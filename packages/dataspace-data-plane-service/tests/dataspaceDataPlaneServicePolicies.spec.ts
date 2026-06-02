// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { ScheduledTask } from "@twin.org/background-task-scheduler";
import {
	TaskSchedulerService,
	initSchema as initSchemaTaskScheduler
} from "@twin.org/background-task-scheduler";
import {
	BackgroundTaskService,
	initSchema as initSchemaBackgroundTask,
	type BackgroundTask
} from "@twin.org/background-task-service";
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ArrayHelper, ComponentFactory, GeneralError, I18n, NotFoundError } from "@twin.org/core";
import {
	DataspaceAppFactory,
	DataspaceAppDataset,
	TransferProcess,
	type IDataAssetItemListResult
} from "@twin.org/dataspace-models";
import { TestDataspaceDataPlaneApp } from "@twin.org/dataspace-test-app";
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import {
	DataspaceProtocolDataTypes,
	DataspaceProtocolTransferProcessStateType,
	type IDataspaceProtocolAgreement,
	type IDataspaceProtocolPolicy
} from "@twin.org/standards-dataspace-protocol";
import { addAllContextsToDocumentCache } from "@twin.org/standards-ld-contexts";
import { OdrlContexts } from "@twin.org/standards-w3c-odrl";
import { createMockPolicyEnforcementPoint, createMockTrustComponent } from "./setupTestEnv.js";
import locales from "../locales/en.json" with { type: "json" };
import { DataspaceDataPlaneService } from "../src/dataspaceDataPlaneService.js";
import type { ActivityLogDetails } from "../src/entities/activityLogDetails.js";
import type { ActivityTask } from "../src/entities/activityTask.js";
import type { PushSubscription } from "../src/entities/pushSubscription.js";
import { initSchema } from "../src/schema.js";

const TEST_NODE_IDENTITY = "did:iota:testnet:provider-node";
const DATA_CONSUMER_IDENTITY = "did:iota:testnet:consumer-node";
const TEST_DATASET_ID = "urn:dataset:test-dataset-001";
const TEST_CONSUMER_PID = "urn:uuid:consumer-pid-001";
const TEST_PROVIDER_PID = "urn:uuid:provider-pid-001";
const TEST_AGREEMENT_ID = "urn:agreement:test-agreement-001";
const TEST_OFFER_ID = "urn:offer:test-offer-001";
const TEST_TRANSFER_TOKEN = "test-transfer-token-abc123";

/**
 * Creates a test Transfer Process entity.
 * @param overrides Optional partial entity to override default values.
 * @returns A TransferProcessEntity for testing.
 */
function createTestTransferProcess(overrides?: Partial<TransferProcess>): TransferProcess {
	const now = new Date().toISOString();

	const entity = new TransferProcess();
	entity.consumerPid = TEST_CONSUMER_PID;
	entity.id = TEST_CONSUMER_PID; // id mirrors consumerPid
	entity.providerPid = TEST_PROVIDER_PID;
	entity.agreementId = TEST_AGREEMENT_ID;
	entity.offerId = TEST_OFFER_ID;
	entity.state = DataspaceProtocolTransferProcessStateType.STARTED;
	entity.datasetId = TEST_DATASET_ID;
	entity.consumerIdentity = DATA_CONSUMER_IDENTITY;
	entity.providerIdentity = TEST_NODE_IDENTITY;
	entity.format = "application/json";
	entity.dateCreated = now;
	entity.dateModified = now;
	entity.policies = [
		{
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			"@id": TEST_AGREEMENT_ID,
			assigner: TEST_NODE_IDENTITY,
			assignee: DATA_CONSUMER_IDENTITY,
			target: TEST_DATASET_ID,
			permission: [{ action: "read" }]
		}
	];

	// Apply overrides
	if (overrides) {
		Object.assign(entity, overrides);
	}

	return entity;
}

describe("DataspaceDataPlaneService Policy Tests", () => {
	let transferProcessStorage: MemoryEntityStorageConnector<TransferProcess>;
	let pushSubscriptionStorage: MemoryEntityStorageConnector<PushSubscription>;
	let activityLogStorage: MemoryEntityStorageConnector<ActivityLogDetails>;
	let activityTaskStorage: MemoryEntityStorageConnector<ActivityTask>;
	let backgroundTaskStorage: MemoryEntityStorageConnector<BackgroundTask>;
	let service: DataspaceDataPlaneService;

	beforeAll(async () => {
		// Initialize schemas and contexts
		initSchema();
		initSchemaBackgroundTask();
		initSchemaTaskScheduler();
		DataspaceProtocolDataTypes.registerTypes();
		await addAllContextsToDocumentCache();
		I18n.addDictionary("en", locales);
		I18n.setLocale("en");

		// Register TransferProcessEntity schema
		EntitySchemaFactory.register(nameof<TransferProcess>(), () =>
			EntitySchemaHelper.getSchema(TransferProcess)
		);
		EntitySchemaFactory.register(nameof<DataspaceAppDataset>(), () =>
			EntitySchemaHelper.getSchema(DataspaceAppDataset)
		);

		// Mock context IDs
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		ComponentFactory.register("url-transformer", () => ({
			className: () => "MockUrlTransformerComponent",
			getEncryptedFromUrl: vi.fn().mockImplementation(async (url: string, id: string) => {
				const value = new URL(url).searchParams.get(`x-enc-${id}-token`);
				return value ?? undefined;
			}),
			addEncryptedQueryParamToUrl: vi.fn().mockImplementation(async (url: string) => url),
			getEncryptedQueryParam: vi.fn().mockResolvedValue(undefined),
			addEncryptedToUrl: vi.fn().mockImplementation(async (url: string) => url),
			getDecryptedFromQueryParams: vi.fn().mockResolvedValue({}),
			encryptQueryParams: vi.fn().mockResolvedValue(undefined),
			decryptQueryParams: vi.fn().mockResolvedValue(undefined),
			encryptParam: vi.fn().mockImplementation(async (v: string) => v),
			decryptParam: vi.fn().mockImplementation(async (v: string) => v),
			getParamName: vi.fn().mockImplementation((key: string) => `x-enc-${key}-token`)
		}));
	});

	beforeEach(async () => {
		// Create fresh storage for each test
		transferProcessStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>()
		});
		activityLogStorage = new MemoryEntityStorageConnector<ActivityLogDetails>({
			entitySchema: nameof<ActivityLogDetails>()
		});
		activityTaskStorage = new MemoryEntityStorageConnector<ActivityTask>({
			entitySchema: nameof<ActivityTask>()
		});
		backgroundTaskStorage = new MemoryEntityStorageConnector<BackgroundTask>({
			entitySchema: nameof<BackgroundTask>()
		});

		pushSubscriptionStorage = new MemoryEntityStorageConnector<PushSubscription>({
			entitySchema: nameof<PushSubscription>()
		});

		// Register all required entity storage connectors
		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferProcess>(),
			() => transferProcessStorage
		);
		const dataspaceAppDatasetStorage = new MemoryEntityStorageConnector<DataspaceAppDataset>({
			entitySchema: nameof<DataspaceAppDataset>()
		});
		EntityStorageConnectorFactory.register(
			nameofKebabCase<DataspaceAppDataset>(),
			() => dataspaceAppDatasetStorage
		);
		// Seed a dataset record whose primary key is the test app's dataset @id
		const now = new Date().toISOString();
		await dataspaceAppDatasetStorage.set({
			id: "https://twin.example.org/data-service-1",
			nodeIdentity: TEST_NODE_IDENTITY,
			tenantId: "test-tenant",
			appId: "test-app",
			dataset: {
				"@context": ["https://w3id.org/dspace/2025/1/context.jsonld"],
				"@type": "Dataset",
				hasPolicy: [
					{ "@id": "urn:policy:test", "@type": "Offer", permission: [{ action: "read" }] }
				],
				distribution: [
					{
						"@id": "https://twin.example.org/distribution-1",
						"@type": "Distribution",
						accessService: "https://twin.example.org/data-service-1",
						format: "Http-Pull-Query-Format"
					}
				]
			},
			dateCreated: now,
			dateModified: now
		});
		EntityStorageConnectorFactory.register(
			nameofKebabCase<PushSubscription>(),
			() => pushSubscriptionStorage
		);
		EntityStorageConnectorFactory.register(
			nameofKebabCase<ActivityLogDetails>(),
			() => activityLogStorage
		);
		EntityStorageConnectorFactory.register(
			nameofKebabCase<ActivityTask>(),
			() => activityTaskStorage
		);
		EntityStorageConnectorFactory.register("background-task", () => backgroundTaskStorage);

		const scheduledTaskStorage = new MemoryEntityStorageConnector<ScheduledTask>({
			entitySchema: "ScheduledTask"
		});
		EntityStorageConnectorFactory.register("scheduled-task", () => scheduledTaskStorage);

		// Register mock trust component
		ComponentFactory.register("mock-trust", () =>
			createMockTrustComponent(TEST_TRANSFER_TOKEN, DATA_CONSUMER_IDENTITY)
		);

		// Register background task service
		const backgroundTaskService = new BackgroundTaskService({
			backgroundTaskEntityStorageType: "background-task"
		});
		ComponentFactory.register("background-task", () => backgroundTaskService);

		// Register task scheduler
		const taskScheduler = new TaskSchedulerService();
		ComponentFactory.register("task-scheduler", () => taskScheduler);

		// Register test app
		DataspaceAppFactory.register("test-app", () => new TestDataspaceDataPlaneApp());

		// Create service with transfer process storage configured
		service = new DataspaceDataPlaneService({
			trustComponentType: "mock-trust",
			transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
			pushSubscriptionEntityStorageType: nameofKebabCase<PushSubscription>()
		});
	});

	afterEach(() => {
		// Cleanup all registrations
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<TransferProcess>());
		} catch {
			// Ignore
		}
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<PushSubscription>());
		} catch {
			// Ignore
		}
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<ActivityLogDetails>());
		} catch {
			// Ignore
		}
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<ActivityTask>());
		} catch {
			// Ignore
		}
		try {
			EntityStorageConnectorFactory.unregister("background-task");
		} catch {
			// Ignore
		}
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<DataspaceAppDataset>());
		} catch {
			// Ignore
		}
		try {
			EntityStorageConnectorFactory.unregister("scheduled-task");
		} catch {
			// Ignore
		}
		try {
			ComponentFactory.unregister("mock-trust");
		} catch {
			// Ignore
		}
		try {
			ComponentFactory.unregister("background-task");
		} catch {
			// Ignore
		}
		try {
			ComponentFactory.unregister("task-scheduler");
		} catch {
			// Ignore
		}
		try {
			DataspaceAppFactory.unregister("test-app");
		} catch {
			// Ignore
		}
		vi.restoreAllMocks();
	});

	describe("Shared Storage Integration", () => {
		test("Data Plane can read TransferProcess created by Control Plane", async () => {
			// Simulate Control Plane creating a transfer process
			const transferProcess = createTestTransferProcess();
			await transferProcessStorage.set(transferProcess);

			// Verify Data Plane can read it via validateTransfer
			// We need to access the private method indirectly through getDataAssetEntities
			const stored = await transferProcessStorage.get(TEST_CONSUMER_PID);
			expect(stored).toBeDefined();
			expect(stored?.consumerPid).toBe(TEST_CONSUMER_PID);
			expect(stored?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			expect(stored?.datasetId).toBe(TEST_DATASET_ID);
		});

		test("TransferProcess state updates are visible to Data Plane", async () => {
			// Create initial transfer process in REQUESTED state
			const transferProcess = createTestTransferProcess({ state: "REQUESTED" });
			await transferProcessStorage.set(transferProcess);

			// Verify initial state
			let stored = await transferProcessStorage.get(TEST_CONSUMER_PID);
			expect(stored?.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);

			// Simulate Control Plane updating state to STARTED
			transferProcess.state = DataspaceProtocolTransferProcessStateType.STARTED;
			transferProcess.dateModified = new Date().toISOString();
			await transferProcessStorage.set(transferProcess);

			// Verify updated state is visible
			stored = await transferProcessStorage.get(TEST_CONSUMER_PID);
			expect(stored?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
		});

		test("Multiple transfer processes can coexist", async () => {
			// Create multiple transfer processes
			const tp1 = createTestTransferProcess();
			const tp2 = createTestTransferProcess({
				consumerPid: "urn:uuid:consumer-pid-002",
				id: "urn:uuid:consumer-pid-002",
				providerPid: "urn:uuid:provider-pid-002",
				datasetId: "urn:dataset:test-dataset-002"
			});
			const tp3 = createTestTransferProcess({
				consumerPid: "urn:uuid:consumer-pid-003",
				id: "urn:uuid:consumer-pid-003",
				providerPid: "urn:uuid:provider-pid-003",
				state: "COMPLETED"
			});

			await transferProcessStorage.set(tp1);
			await transferProcessStorage.set(tp2);
			await transferProcessStorage.set(tp3);

			// Verify all are accessible
			const stored1 = await transferProcessStorage.get(TEST_CONSUMER_PID);
			const stored2 = await transferProcessStorage.get("urn:uuid:consumer-pid-002");
			const stored3 = await transferProcessStorage.get("urn:uuid:consumer-pid-003");

			expect(stored1?.datasetId).toBe(TEST_DATASET_ID);
			expect(stored2?.datasetId).toBe("urn:dataset:test-dataset-002");
			expect(stored3?.state).toBe(DataspaceProtocolTransferProcessStateType.COMPLETED);
		});
	});

	describe("Transfer Validation", () => {
		test("validateTransfer throws NotFoundError for non-existent consumerPid", async () => {
			// Don't add any transfer process to storage

			await expect(
				service.validateTransfer("non-existent-pid", TEST_TRANSFER_TOKEN)
			).rejects.toThrow(NotFoundError);
		});

		test("validateTransfer throws GeneralError when state is not STARTED", async () => {
			// Create transfer process in REQUESTED state (not STARTED)
			const transferProcess = createTestTransferProcess({ state: "REQUESTED" });
			await transferProcessStorage.set(transferProcess);

			await expect(
				service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN)
			).rejects.toThrow(GeneralError);
		});

		test("validateTransfer throws GeneralError when datasetId is missing", async () => {
			// Create transfer process without datasetId
			const transferProcess = createTestTransferProcess();
			transferProcess.datasetId = "";
			await transferProcessStorage.set(transferProcess);

			await expect(
				service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN)
			).rejects.toThrow(GeneralError);
		});

		test("validateTransfer returns ITransferContext for valid transfer", async () => {
			// Create valid transfer process
			const transferProcess = createTestTransferProcess();
			await transferProcessStorage.set(transferProcess);

			const context = await service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN);

			expect(context).toBeDefined();
			expect(context.consumerPid).toBe(TEST_CONSUMER_PID);
			expect(context.providerPid).toBe(TEST_PROVIDER_PID);
			expect(context.datasetId).toBe(TEST_DATASET_ID);
			expect(context.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
		});

		test("buildTransferContext correctly extracts permission, prohibition, and obligation from stored Agreement", async () => {
			// Create transfer process with full ODRL Agreement containing all policy types
			const fullAgreement = {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": TEST_AGREEMENT_ID,
				assigner: TEST_NODE_IDENTITY,
				assignee: DATA_CONSUMER_IDENTITY,
				target: TEST_DATASET_ID,
				permission: [
					{
						action: "read",
						constraint: [{ leftOperand: "count", operator: "lteq", rightOperand: 100 }]
					}
				],
				prohibition: [
					{ action: "read", target: "field:sensitiveData" },
					{ action: "derive", target: "field:personalInfo" }
				],
				obligation: [
					{ action: "attribute", attributedParty: TEST_NODE_IDENTITY },
					{
						action: "delete",
						constraint: [{ leftOperand: "event", operator: "eq", rightOperand: "policyExpiry" }]
					}
				]
			} as unknown as IDataspaceProtocolPolicy;

			const transferProcess = createTestTransferProcess({
				policies: [fullAgreement]
			});
			await transferProcessStorage.set(transferProcess);

			// Validate transfer and get context
			const context = await service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN);

			// Verify permission array is correctly extracted
			const permissions = ArrayHelper.fromObjectOrArray(context.agreement.permission) ?? [];
			expect(permissions).toHaveLength(1);
			expect(permissions.at(0)?.action).toBe("read");

			// Verify prohibition array is correctly extracted (this was the bug - it was undefined before fix)
			const prohibitions = ArrayHelper.fromObjectOrArray(context.agreement.prohibition) ?? [];
			expect(prohibitions).toHaveLength(2);
			expect(prohibitions[0]?.action).toBe("read");
			expect(prohibitions[0]?.target).toBe("field:sensitiveData");
			expect(prohibitions[1]?.action).toBe("derive");

			// Verify obligation array is correctly extracted (this was also lost before fix)
			const obligations = ArrayHelper.fromObjectOrArray(context.agreement.obligation) ?? [];
			expect(obligations).toHaveLength(2);
			expect(obligations[0]?.action).toBe("attribute");
			expect(obligations[1]?.action).toBe("delete");
		});
	});

	describe("Policy Filters (PEP Delegation)", () => {
		const testResult: IDataAssetItemListResult = {
			itemList: {
				"@context": "https://schema.org",
				type: "ItemList",
				itemListElement: [
					{ id: "1", name: "Item 1" },
					{ id: "2", name: "Item 2" },
					{ id: "3", name: "Item 3" }
				]
			}
		};

		const testAgreement: IDataspaceProtocolAgreement = {
			"@context": OdrlContexts.Context,
			"@type": "Agreement",
			"@id": TEST_AGREEMENT_ID,
			assigner: TEST_NODE_IDENTITY,
			assignee: DATA_CONSUMER_IDENTITY,
			permission: [{ action: "read" }]
		};

		async function callApplyPolicyFilters(
			svc: DataspaceDataPlaneService,
			result: IDataAssetItemListResult,
			agreement?: IDataspaceProtocolAgreement
		): Promise<IDataAssetItemListResult> {
			return (
				svc as unknown as {
					applyPolicyFilters: (
						result: IDataAssetItemListResult,
						agreement?: IDataspaceProtocolAgreement
					) => Promise<IDataAssetItemListResult>;
				}
			).applyPolicyFilters(result, agreement);
		}

		test("returns unchanged result when no agreement is provided", async () => {
			const result = structuredClone(testResult);
			const filtered = await callApplyPolicyFilters(service, result, undefined);
			expect(filtered.itemList.itemListElement).toHaveLength(3);
		});

		test("returns unchanged result when no PEP is registered", async () => {
			const result = structuredClone(testResult);
			const filtered = await callApplyPolicyFilters(service, result, testAgreement);
			expect(filtered.itemList.itemListElement).toHaveLength(3);
		});

		test("returns unchanged result when PEP grants access", async () => {
			ComponentFactory.register("mock-pep", () => createMockPolicyEnforcementPoint());

			const pepService = new DataspaceDataPlaneService({
				trustComponentType: "mock-trust",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pepComponentType: "mock-pep"
			});

			const result = structuredClone(testResult);
			const filtered = await callApplyPolicyFilters(pepService, result, testAgreement);
			expect(filtered.itemList.itemListElement).toHaveLength(3);

			ComponentFactory.unregister("mock-pep");
		});

		test("returns PEP output when PEP denies access", async () => {
			ComponentFactory.register("mock-pep", () =>
				createMockPolicyEnforcementPoint<IDataAssetItemListResult>({} as IDataAssetItemListResult)
			);

			const pepService = new DataspaceDataPlaneService({
				trustComponentType: "mock-trust",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pepComponentType: "mock-pep"
			});

			const result = structuredClone(testResult);
			const filtered = await callApplyPolicyFilters(pepService, result, testAgreement);
			expect(filtered).toEqual({});

			ComponentFactory.unregister("mock-pep");
		});

		test("logs obligations when agreement has obligations", async () => {
			ComponentFactory.register("mock-pep", () => createMockPolicyEnforcementPoint());

			const pepService = new DataspaceDataPlaneService({
				trustComponentType: "mock-trust",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pepComponentType: "mock-pep"
			});

			const logSpy = vi.fn();
			(pepService as unknown as { _logging: { log: typeof logSpy } })._logging = {
				log: logSpy
			};

			const agreementWithObligations: IDataspaceProtocolAgreement = {
				...testAgreement,
				obligation: [
					{ action: "attribute", assignee: DATA_CONSUMER_IDENTITY },
					{ action: "delete", target: TEST_DATASET_ID }
				]
			};

			const result = structuredClone(testResult);
			await callApplyPolicyFilters(pepService, result, agreementWithObligations);

			expect(logSpy).toHaveBeenCalledTimes(2);
			expect(logSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "policyObligationTriggered",
					data: expect.objectContaining({ action: "attribute" })
				})
			);
			expect(logSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "policyObligationTriggered",
					data: expect.objectContaining({ action: "delete" })
				})
			);

			ComponentFactory.unregister("mock-pep");
		});

		test("logs obligations even when PEP denies access", async () => {
			ComponentFactory.register("mock-pep", () =>
				createMockPolicyEnforcementPoint<IDataAssetItemListResult>({} as IDataAssetItemListResult)
			);

			const pepService = new DataspaceDataPlaneService({
				trustComponentType: "mock-trust",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pepComponentType: "mock-pep"
			});

			const logSpy = vi.fn();
			(pepService as unknown as { _logging: { log: typeof logSpy } })._logging = {
				log: logSpy
			};

			const agreementWithObligations: IDataspaceProtocolAgreement = {
				...testAgreement,
				obligation: [{ action: "attribute", assignee: DATA_CONSUMER_IDENTITY }]
			};

			const result = structuredClone(testResult);
			await callApplyPolicyFilters(pepService, result, agreementWithObligations);

			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(logSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "policyObligationTriggered",
					data: expect.objectContaining({ action: "attribute" })
				})
			);

			ComponentFactory.unregister("mock-pep");
		});
	});

	describe("Policy Filters at Call Site (getDataAssetEntities / queryDataAsset)", () => {
		const APP_DATASET_ID = "https://twin.example.org/data-service-1";

		function createTransferWithAgreement(
			agreement?: Partial<IDataspaceProtocolAgreement>
		): TransferProcess {
			const fullAgreement = {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": TEST_AGREEMENT_ID,
				assigner: TEST_NODE_IDENTITY,
				assignee: DATA_CONSUMER_IDENTITY,
				target: APP_DATASET_ID,
				permission: [{ action: "read" }],
				...agreement
			} as unknown as IDataspaceProtocolPolicy;

			return createTestTransferProcess({
				datasetId: APP_DATASET_ID,
				policies: [fullAgreement]
			});
		}

		test("getDataAssetEntities returns valid structure with empty items when PEP denies", async () => {
			ComponentFactory.register("mock-pep", () =>
				createMockPolicyEnforcementPoint<IDataAssetItemListResult>({} as IDataAssetItemListResult)
			);

			const pepService = new DataspaceDataPlaneService({
				trustComponentType: "mock-trust",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pepComponentType: "mock-pep"
			});

			const transferProcess = createTransferWithAgreement();
			await transferProcessStorage.set(transferProcess);

			const result = await pepService.getDataAssetEntities(
				{ entityType: "https://vocabulary.uncefact.org/Consignment" },
				TEST_CONSUMER_PID,
				undefined,
				undefined,
				TEST_TRANSFER_TOKEN
			);

			expect(result.itemList).toBeDefined();
			expect(result.itemList.type).toBe("ItemList");
			expect(result.itemList.itemListElement).toEqual([]);

			ComponentFactory.unregister("mock-pep");
		});

		test("getDataAssetEntities returns data unchanged when PEP grants", async () => {
			ComponentFactory.register("mock-pep", () => createMockPolicyEnforcementPoint());

			const pepService = new DataspaceDataPlaneService({
				trustComponentType: "mock-trust",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pepComponentType: "mock-pep"
			});

			const transferProcess = createTransferWithAgreement();
			await transferProcessStorage.set(transferProcess);

			const result = await pepService.getDataAssetEntities(
				{ entityType: "https://vocabulary.uncefact.org/Consignment" },
				TEST_CONSUMER_PID,
				undefined,
				undefined,
				TEST_TRANSFER_TOKEN
			);

			expect(result.itemList).toBeDefined();
			expect(result.itemList.type).toBe("ItemList");
			expect(result.itemList.itemListElement.length).toBeGreaterThan(0);

			ComponentFactory.unregister("mock-pep");
		});

		test("queryDataAsset returns valid structure with empty items when PEP denies", async () => {
			ComponentFactory.register("mock-pep", () =>
				createMockPolicyEnforcementPoint<IDataAssetItemListResult>({} as IDataAssetItemListResult)
			);

			const pepService = new DataspaceDataPlaneService({
				trustComponentType: "mock-trust",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pepComponentType: "mock-pep"
			});

			const transferProcess = createTransferWithAgreement();
			await transferProcessStorage.set(transferProcess);

			const result = await pepService.queryDataAsset(
				TEST_CONSUMER_PID,
				{ type: "TestQueryType", q: {} },
				undefined,
				undefined,
				TEST_TRANSFER_TOKEN
			);

			expect(result.itemList).toBeDefined();
			expect(result.itemList.type).toBe("ItemList");
			expect(result.itemList.itemListElement).toEqual([]);

			ComponentFactory.unregister("mock-pep");
		});

		test("queryDataAsset returns data unchanged when PEP grants", async () => {
			ComponentFactory.register("mock-pep", () => createMockPolicyEnforcementPoint());

			const pepService = new DataspaceDataPlaneService({
				trustComponentType: "mock-trust",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pepComponentType: "mock-pep"
			});

			const transferProcess = createTransferWithAgreement();
			await transferProcessStorage.set(transferProcess);

			const result = await pepService.queryDataAsset(
				TEST_CONSUMER_PID,
				{ type: "TestQueryType", q: {} },
				undefined,
				undefined,
				TEST_TRANSFER_TOKEN
			);

			expect(result.itemList).toBeDefined();
			expect(result.itemList.type).toBe("ItemList");
			expect(result.itemList.itemListElement.length).toBeGreaterThan(0);

			ComponentFactory.unregister("mock-pep");
		});
	});

	describe("End-to-End Transfer Flow", () => {
		test("Complete DSP transfer flow: validate → resolve datasetId → return context", async () => {
			// Step 1: Simulate Control Plane creating a transfer in REQUESTED state
			const transferProcess = createTestTransferProcess({ state: "REQUESTED" });
			await transferProcessStorage.set(transferProcess);

			// Step 2: Simulate Control Plane starting the transfer (state → STARTED)
			transferProcess.state = DataspaceProtocolTransferProcessStateType.STARTED;
			transferProcess.dateModified = new Date().toISOString();
			await transferProcessStorage.set(transferProcess);

			// Step 3: Data Plane validates the transfer using consumerPid and token
			const context = await service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN);

			// Step 4: Verify Data Plane resolved datasetId from TransferProcess
			expect(context.datasetId).toBe(TEST_DATASET_ID);

			// Step 5: Verify full context is available for app delegation
			expect(context.consumerPid).toBe(TEST_CONSUMER_PID);
			expect(context.providerPid).toBe(TEST_PROVIDER_PID);
			expect(context.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			expect(context.agreement).toBeDefined();
			expect(context.agreement["@id"]).toBe(TEST_AGREEMENT_ID);

			// Step 6: Verify consumer/provider identities for auditing
			expect(context.consumerIdentity).toBe(DATA_CONSUMER_IDENTITY);
			expect(context.providerIdentity).toBe(TEST_NODE_IDENTITY);
		});

		test("Transfer lifecycle: REQUESTED → STARTED → query succeeds → COMPLETED", async () => {
			// Phase 1: Control Plane receives transfer request
			const transferProcess = createTestTransferProcess({ state: "REQUESTED" });
			await transferProcessStorage.set(transferProcess);

			// Query should fail - transfer not yet started
			await expect(
				service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN)
			).rejects.toThrow(GeneralError);

			// Phase 2: Control Plane starts the transfer
			transferProcess.state = DataspaceProtocolTransferProcessStateType.STARTED;
			await transferProcessStorage.set(transferProcess);

			// Query should succeed now
			const context = await service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN);
			expect(context.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			expect(context.datasetId).toBe(TEST_DATASET_ID);

			// Phase 3: Control Plane completes the transfer
			transferProcess.state = DataspaceProtocolTransferProcessStateType.COMPLETED;
			await transferProcessStorage.set(transferProcess);

			// Query should fail - transfer completed
			await expect(
				service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN)
			).rejects.toThrow(GeneralError);
		});

		test("Multiple concurrent transfers with different consumerPids", async () => {
			// Create two separate transfer processes
			const transfer1 = createTestTransferProcess();
			transfer1.consumerPid = "urn:uuid:consumer-001";
			transfer1.id = "urn:uuid:consumer-001";
			transfer1.datasetId = "urn:dataset:dataset-A";

			const transfer2 = createTestTransferProcess();
			transfer2.consumerPid = "urn:uuid:consumer-002";
			transfer2.id = "urn:uuid:consumer-002";
			transfer2.datasetId = "urn:dataset:dataset-B";

			await transferProcessStorage.set(transfer1);
			await transferProcessStorage.set(transfer2);

			// Both should validate independently with valid trust payloads
			const context1 = await service.validateTransfer(
				"urn:uuid:consumer-001",
				"valid-trust-payload"
			);
			const context2 = await service.validateTransfer(
				"urn:uuid:consumer-002",
				"valid-trust-payload"
			);

			// Each resolves to its own datasetId (isolated by consumerPid)
			expect(context1.datasetId).toBe("urn:dataset:dataset-A");
			expect(context2.datasetId).toBe("urn:dataset:dataset-B");
		});
	});
});
