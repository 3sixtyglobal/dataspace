// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { HttpContextIdKeys } from "@twin.org/api-models";
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import {
	ComponentFactory,
	Converter,
	Factory,
	GeneralError,
	Is,
	NotFoundError,
	RandomHelper
} from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import {
	DataspaceAppFactory,
	DataspaceTransferFormat,
	TransferProcessRole,
	TransferTerminationCode,
	type DataspaceAppDataset,
	type INegotiationCallback,
	type ITransferCallback,
	type TransferProcess,
	type TransferRetrieval
} from "@twin.org/dataspace-models";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import { PolicyRequesterFactory } from "@twin.org/rights-management-models";
import {
	DataspaceProtocolCatalogTypes,
	DataspaceProtocolContexts,
	DataspaceProtocolContractNegotiationStateType,
	DataspaceProtocolEndpointType,
	DataspaceProtocolTransferProcessStateType,
	DataspaceProtocolTransferProcessTypes,
	type IDataspaceProtocolAgreement,
	type IDataspaceProtocolCatalogError,
	type IDataspaceProtocolDataAddress,
	type IDataspaceProtocolOffer,
	type IDataspaceProtocolTransferCompletionMessage,
	type IDataspaceProtocolTransferError,
	type IDataspaceProtocolTransferProcess,
	type IDataspaceProtocolTransferRequestMessage,
	type IDataspaceProtocolTransferStartMessage,
	type IDataspaceProtocolTransferSuspensionMessage,
	type IDataspaceProtocolTransferTerminationMessage
} from "@twin.org/standards-dataspace-protocol";
import { JwtVerifiableCredentialGenerator } from "@twin.org/trust-generators";
import type { ITrustComponent } from "@twin.org/trust-models";
import type { DataspaceControlPlanePolicyRequester } from "../src/dataspaceControlPlanePolicyRequester.js";
import { DataspaceControlPlaneService } from "../src/dataspaceControlPlaneService.js";
import { MockFederatedCatalogueComponent } from "./mocks/mockFederatedCatalogue.js";
import { MockPolicyAdministrationPointComponent } from "./mocks/mockPolicyAdministrationPoint.js";
import { MockPolicyNegotiationAdminPointComponent } from "./mocks/mockPolicyNegotiationAdminPoint.js";
import { MockPolicyNegotiationPointComponent } from "./mocks/mockPolicyNegotiationPoint.js";
import {
	createFailingMockTrustComponent,
	createMockDataspaceDataPlaneComponent,
	createMockEngineCore,
	createMockTaskScheduler,
	createMockTrustComponent,
	createSingleTenantPlatformComponent,
	DEFAULT_SERVICE_OPTIONS,
	setupTestEnv
} from "./setupTestEnv.js";

/**
 * Mocks sendRequestToProvider to return the negotiation ID.
 * negotiateAgreement() now returns immediately with { negotiationId },
 * so PNP callbacks happen asynchronously via the INegotiationCallback interface.
 *
 * @param mockPnpInstance The mock PNP component to configure.
 * @param negotiationId The negotiation ID to return (default: "test-negotiation-id").
 */
function mockPnpToReturnNegotiationId(
	mockPnpInstance: MockPolicyNegotiationPointComponent,
	negotiationId: string = "test-negotiation-id"
): void {
	mockPnpInstance.sendRequestToProvider = vi.fn().mockImplementation(async () => negotiationId);
}

/**
 * Test suite for DataspaceControlPlaneService.
 */
describe("DataspaceControlPlaneService", () => {
	// Create transfer process storage for tests
	let transferProcessStorage: MemoryEntityStorageConnector<TransferProcess>;
	let dataspaceAppDatasetStorage: MemoryEntityStorageConnector<DataspaceAppDataset>;
	let transferRetrievalStorage: MemoryEntityStorageConnector<TransferRetrieval>;
	let mockPap: MockPolicyAdministrationPointComponent;
	let mockFedCat: MockFederatedCatalogueComponent;
	let mockPnp: MockPolicyNegotiationPointComponent;

	// Register DSP schemas and contexts before running tests
	beforeAll(async () => {
		await setupTestEnv();
	});

	beforeEach(() => {
		// Create fresh storage for each test
		transferProcessStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>(),
			config: { storageKey: "transfer-process" }
		});
		dataspaceAppDatasetStorage = new MemoryEntityStorageConnector<DataspaceAppDataset>({
			entitySchema: nameof<DataspaceAppDataset>(),
			config: { storageKey: "dataspace-app-dataset" }
		});
		transferRetrievalStorage = new MemoryEntityStorageConnector<TransferRetrieval>({
			entitySchema: nameof<TransferRetrieval>(),
			config: { storageKey: "transfer-retrieval" }
		});

		// Register the entity storage connectors
		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferProcess>(),
			() => transferProcessStorage
		);
		EntityStorageConnectorFactory.register(
			nameofKebabCase<DataspaceAppDataset>(),
			() => dataspaceAppDatasetStorage
		);
		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferRetrieval>(),
			() => transferRetrievalStorage
		);

		// Create and register mock PAP, PNP, FedCat and PNAP admin components
		mockPap = new MockPolicyAdministrationPointComponent();
		mockPnp = new MockPolicyNegotiationPointComponent();
		mockFedCat = new MockFederatedCatalogueComponent();
		ComponentFactory.register("test-pap", () => mockPap);
		ComponentFactory.register("test-pnp", () => mockPnp);
		ComponentFactory.register("test-fedcat", () => mockFedCat);
		ComponentFactory.register(
			"test-pnap-admin",
			() => new MockPolicyNegotiationAdminPointComponent()
		);

		// Register mock trust component
		ComponentFactory.register("test-trust", () => createMockTrustComponent());
		ComponentFactory.register("task-scheduler", () => createMockTaskScheduler());

		// Default platform: no URL is treated as local (getLocalOriginContext -> undefined).
		// Re-registered each test so any per-block override (e.g. the implicit-trust block) cannot leak.
		ComponentFactory.register("platform", () => createSingleTenantPlatformComponent());

		// Mock ContextIdStore to return test organization ID
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
			[ContextIdKeys.Node]: "did:iota:test-node",
			[ContextIdKeys.Tenant]: "did:iota:test-tenant",
			[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
			[ContextIdKeys.User]: "did:iota:test-user",
			[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
		});
	});

	afterEach(async () => {
		// Unregister the entity storage connector after each test
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<TransferProcess>());
			EntityStorageConnectorFactory.unregister(nameofKebabCase<DataspaceAppDataset>());
			EntityStorageConnectorFactory.unregister(nameofKebabCase<TransferRetrieval>());
		} catch {
			// Ignore errors if already unregistered
		}

		// Unregister mock components
		try {
			ComponentFactory.unregister("test-pap");
			ComponentFactory.unregister("test-pnp");
			ComponentFactory.unregister("test-fedcat");
			ComponentFactory.unregister("test-pnap-admin");
			ComponentFactory.unregister("test-trust");
			ComponentFactory.unregister("task-scheduler");
			ComponentFactory.unregister("test-url-transformer");
			ComponentFactory.unregister("url-transformer");
		} catch {
			// Ignore errors if already unregistered
		}

		await transferProcessStorage.teardown();
		await dataspaceAppDatasetStorage.teardown();
		await transferRetrievalStorage.teardown();

		vi.restoreAllMocks();
	});

	test("can construct with dependencies", async () => {
		const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
		expect(service).toBeDefined();
		expect(service.className()).toBe("DataspaceControlPlaneService");
	});

	describe("Mock Data Initialization", () => {
		test("should have 3 mock Transfer Processes in different states", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Verify STARTED state
			const process1 = await service.getTransferProcess(
				"urn:uuid:consumer-pid-001",
				"valid-trust-payload"
			);
			if (process1["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess1 = process1;
				expect(transferProcess1.consumerPid).toBe("urn:uuid:consumer-pid-001");
				expect(transferProcess1.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			}

			// Verify REQUESTED state
			const process2 = await service.getTransferProcess(
				"urn:uuid:consumer-pid-002",
				"valid-trust-payload"
			);
			if (process2["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess2 = process2;
				expect(transferProcess2.consumerPid).toBe("urn:uuid:consumer-pid-002");
				expect(transferProcess2.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);
			}

			// Verify COMPLETED state
			const process3 = await service.getTransferProcess(
				"urn:uuid:consumer-pid-003",
				"valid-trust-payload"
			);
			if (process3["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess3 = process3;
				expect(transferProcess3.consumerPid).toBe("urn:uuid:consumer-pid-003");
				expect(transferProcess3.state).toBe(DataspaceProtocolTransferProcessStateType.COMPLETED);
			}
		});
	});

	describe("requestTransfer()", () => {
		test("should create a new Transfer Process in REQUESTED state", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// 1. CONSUMER GENERATES consumerPid (per DSP spec) in URN UUIDv7 format
			const consumerGeneratedPid = `urn:uuid:${RandomHelper.generateUuidV7()}`;

			// 2. Consumer sends Transfer Request to Provider
			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: consumerGeneratedPid,
				agreementId: "agreement-123",
				callbackAddress: "https://consumer.example.com/callback",
				format: "HttpData-PULL"
			};

			// 3. Provider receives request and returns Transfer Process with both PIDs
			const response = await service.requestTransfer(request, "valid-trust-payload");

			// Check it's a TransferProcess, not an error
			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const transferProcess = response;

			expect(transferProcess).toBeDefined();
			expect(transferProcess["@context"]).toBeDefined();
			expect(transferProcess["@type"]).toBe("TransferProcess");
			expect(transferProcess.consumerPid).toBe(consumerGeneratedPid); // Echo back Consumer's PID
			expect(transferProcess.providerPid).toMatch(
				/^urn:uuid:[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i
			); // Provider generated UUIDv7
			expect((transferProcess as IDataspaceProtocolTransferProcess).state).toBe(
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);
		});

		test("captures organizationIdentity from ContextIdStore at requestTransfer time", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const consumerGeneratedPid = `urn:uuid:${RandomHelper.generateUuidV7()}`;
			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: consumerGeneratedPid,
				agreementId: "agreement-123",
				callbackAddress: "https://consumer.example.com/callback",
				format: "HttpData-PUSH"
			};

			await service.requestTransfer(request, "valid-trust-payload");

			const stored = await transferProcessStorage.get(consumerGeneratedPid, "consumerPid");
			expect(stored?.organizationIdentity).toBe("did:iota:provider-node-xyz");
		});

		test("should allow retrieving the created Transfer Process", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Consumer generates their own PID in URN UUIDv7 format
			const consumerGeneratedPid = `urn:uuid:${RandomHelper.generateUuidV7()}`;

			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: consumerGeneratedPid,
				agreementId: "agreement-456",
				callbackAddress: "https://consumer.example.com/callback",
				format: "HttpData-PULL"
			};

			await service.requestTransfer(request, "valid-trust-payload");

			// Both Consumer and Provider can query using consumerPid
			const retrieved = await service.getTransferProcess(
				consumerGeneratedPid,
				"valid-trust-payload"
			);
			if (retrieved["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(retrieved.consumerPid).toBe(consumerGeneratedPid);
			}
		});
	});

	describe("getTransferProcess()", () => {
		test("should return Transfer Process for existing consumerPid", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const process = await service.getTransferProcess("consumer-pid-001", "valid-trust-payload");

			expect(process).toBeDefined();
			if (process["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = process;
				expect(transferProcess.consumerPid).toBe("consumer-pid-001");
				expect(transferProcess.providerPid).toBe("provider-pid-001");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			}
		});

		test("should return TransferError for non-existent consumerPid", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const result = await service.getTransferProcess("non-existent-pid", "valid-trust-payload");
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferError = result;
				// Semantic error code format: "ErrorName:message"
				expect(transferError.code).toMatch(/^NotFoundError:/);
			}
		});
	});

	describe("queryDataTransfer()", () => {
		/**
		 * Seed a transfer process into storage with sensible defaults for query tests.
		 * The default party identities match the mock trust component's caller identity.
		 * @param overrides Field overrides for the seeded transfer process.
		 */
		async function seedTransferProcess(overrides: Partial<TransferProcess>): Promise<void> {
			await transferProcessStorage.set({
				consumerPid: `urn:uuid:${RandomHelper.generateUuidV7()}`,
				id: `urn:uuid:${RandomHelper.generateUuidV7()}`,
				providerPid: `urn:uuid:${RandomHelper.generateUuidV7()}`,
				agreementId: "agreement-query-001",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-query-001",
				offerId: "offer-query-001",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				localRole: TransferProcessRole.Consumer,
				format: DataspaceTransferFormat.HttpDataPull,
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString(),
				...overrides
			});
		}

		test("should return a matching STARTED transfer including its dataAddress", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await seedTransferProcess({
				consumerPid: "urn:uuid:query-consumer-pid-001",
				providerPid: "urn:uuid:query-provider-pid-001",
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: "https://consumer.example.com/dataspace/inbox"
				}
			});

			const result = await service.queryDataTransfer(
				"agreement-query-001",
				DataspaceProtocolTransferProcessStateType.STARTED,
				undefined,
				"valid-trust-payload"
			);

			expect(result.transfers).toHaveLength(1);
			expect(result.transfers[0].consumerPid).toBe("urn:uuid:query-consumer-pid-001");
			expect(result.transfers[0].providerPid).toBe("urn:uuid:query-provider-pid-001");
			expect(result.transfers[0].state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			expect(result.transfers[0].agreementId).toBe("agreement-query-001");
			expect(result.transfers[0].datasetId).toBe("dataset-query-001");
			expect(result.transfers[0].format).toBe(DataspaceTransferFormat.HttpDataPull);
			expect(result.transfers[0].dataAddress?.endpoint).toBe(
				"https://consumer.example.com/dataspace/inbox"
			);
			expect(result.cursor).toBeUndefined();
		});

		test("should return an empty result when no transfer exists for the agreement", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await seedTransferProcess({ agreementId: "agreement-query-other" });

			const result = await service.queryDataTransfer(
				"agreement-query-001",
				undefined,
				undefined,
				"valid-trust-payload"
			);

			expect(result.transfers).toEqual([]);
			expect(result.cursor).toBeUndefined();
		});

		test("should not return a transfer whose state differs from the filter", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await seedTransferProcess({ state: DataspaceProtocolTransferProcessStateType.REQUESTED });

			const result = await service.queryDataTransfer(
				"agreement-query-001",
				DataspaceProtocolTransferProcessStateType.STARTED,
				undefined,
				"valid-trust-payload"
			);

			expect(result.transfers).toEqual([]);
		});

		test("should return transfers in every state when no state filter is provided", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await seedTransferProcess({ state: DataspaceProtocolTransferProcessStateType.REQUESTED });
			await seedTransferProcess({ state: DataspaceProtocolTransferProcessStateType.STARTED });
			await seedTransferProcess({ state: DataspaceProtocolTransferProcessStateType.COMPLETED });

			const result = await service.queryDataTransfer(
				"agreement-query-001",
				undefined,
				undefined,
				"valid-trust-payload"
			);

			expect(result.transfers).toHaveLength(3);
		});

		test("should return every matching transfer when duplicates exist for the agreement", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await seedTransferProcess({ consumerPid: "urn:uuid:query-dup-pid-001" });
			await seedTransferProcess({ consumerPid: "urn:uuid:query-dup-pid-002" });

			const result = await service.queryDataTransfer(
				"agreement-query-001",
				DataspaceProtocolTransferProcessStateType.STARTED,
				undefined,
				"valid-trust-payload"
			);

			expect(result.transfers).toHaveLength(2);
			expect(result.transfers.map(transfer => transfer.consumerPid).sort()).toEqual([
				"urn:uuid:query-dup-pid-001",
				"urn:uuid:query-dup-pid-002"
			]);
		});

		test("should exclude transfers where the caller is not a party", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await seedTransferProcess({ consumerPid: "urn:uuid:query-party-pid-001" });
			await seedTransferProcess({
				consumerPid: "urn:uuid:query-party-pid-002",
				consumerIdentity: "did:iota:another-consumer",
				providerIdentity: "did:iota:another-provider"
			});

			const result = await service.queryDataTransfer(
				"agreement-query-001",
				undefined,
				undefined,
				"valid-trust-payload"
			);

			expect(result.transfers).toHaveLength(1);
			expect(result.transfers[0].consumerPid).toBe("urn:uuid:query-party-pid-001");
		});

		test("should throw UnauthorizedError when trust verification fails", async () => {
			ComponentFactory.register("test-trust-failing-query", () =>
				createFailingMockTrustComponent()
			);
			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-failing-query"
			});

			await expect(
				service.queryDataTransfer("agreement-query-001", undefined, undefined, "any-token")
			).rejects.toMatchObject({ name: "UnauthorizedError" });

			ComponentFactory.unregister("test-trust-failing-query");
		});
	});

	describe("startTransfer()", () => {
		test("should transition Transfer Process to STARTED state", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Use mock process in REQUESTED state
			const message: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "consumer-pid-002",
				providerPid: "provider-pid-002"
			};

			const response = await service.startTransfer(message, "valid-trust-payload");

			expect(response).toBeDefined();
			if (response["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferStartMessage = response;
				expect(transferStartMessage.consumerPid).toBe("consumer-pid-002");
				expect(transferStartMessage.providerPid).toBe("provider-pid-002");
				expect(transferStartMessage["@type"]).toBe(
					DataspaceProtocolTransferProcessTypes.TransferStartMessage
				);
			}
		});

		test("should return TransferError for non-existent consumerPid", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "non-existent-pid",
				providerPid: "provider-pid-999"
			};

			const result = await service.startTransfer(message, "valid-trust-payload");
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferError = result;
				// Semantic error code format: "ErrorName:message"
				expect(transferError.code).toMatch(/^NotFoundError:/);
			}
		});

		test("should return TransferStartMessage with HttpsActivityStreamEndpoint for PUSH transfer (REQUESTED → STARTED)", async () => {
			const setupPushCalls: string[] = [];
			const mockDataPlane = {
				className: () => "MockDataPlane",
				setupPushSubscription: async (consumerPid: string) => {
					setupPushCalls.push(consumerPid);
				}
			};
			ComponentFactory.register("test-data-plane-push", () => mockDataPlane);
			ComponentFactory.register("test-trust-provider-push", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-provider-push",
				dataPlaneComponentType: "test-data-plane-push"
			});

			// Seed a REQUESTED PUSH transfer process with provider identity matching trust component
			await transferProcessStorage.set({
				consumerPid: "push-consumer-pid-req",
				id: "push-internal-id-req",
				providerPid: "push-provider-pid-req",
				agreementId: "agreement-push-req",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-push-req",
				offerId: "offer-push-req",
				providerIdentity: "did:iota:provider-node-xyz",
				localRole: TransferProcessRole.Provider,
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString(),
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: "https://consumer.example.com/dataspace/inbox"
				}
			});

			const response = await service.startTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid: "push-consumer-pid-req",
					providerPid: "push-provider-pid-req"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (response["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const startMsg = response;
				expect(startMsg["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferStartMessage);
				expect(startMsg.dataAddress).toBeDefined();
				expect(startMsg.dataAddress?.endpointType).toBe(
					DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint
				);
				expect(startMsg.dataAddress?.endpoint).toBe(
					`https://test-origin.com/data-plane/data/inbox?${ContextIdKeys.Organization}=did%3Aiota%3Aprovider-node-xyz`
				);
			}
			expect(setupPushCalls).toEqual(["push-consumer-pid-req"]);

			try {
				ComponentFactory.unregister("test-data-plane-push");
				ComponentFactory.unregister("test-trust-provider-push");
			} catch {}
		});

		test("should persist the provider-built PULL dataAddress on the consumer record at start", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Consumer-role REQUESTED PULL transfer; providerIdentity matches the mock trust identity.
			await transferProcessStorage.set({
				id: "start-persist-internal-01",
				consumerPid: "start-persist-consumer-01",
				providerPid: "start-persist-provider-01",
				agreementId: "agreement-123",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-123",
				offerId: "offer-persist-01",
				providerIdentity: "did:iota:consumer-node-abc",
				localRole: TransferProcessRole.Consumer,
				format: DataspaceTransferFormat.HttpDataPull,
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const message: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "start-persist-consumer-01",
				providerPid: "start-persist-provider-01",
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsQueryEndpoint,
					endpoint: "https://provider.example.com/data-plane/data/entities",
					endpointProperties: [
						{
							"@type": DataspaceProtocolTransferProcessTypes.EndpointProperty,
							name: "authorization",
							value: "pull-access-token"
						}
					]
				}
			};

			const result = await service.startTransfer(message, "valid-trust-payload");
			expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			const stored = await transferProcessStorage.get("start-persist-consumer-01", "consumerPid");
			expect(stored?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			expect(stored?.dataAddress).toEqual(message.dataAddress);
		});

		test("should keep the consumer's stored PUSH dataAddress when the start message carries one", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// The consumer's own inbox, captured at request time, must not be clobbered by the
			// provider-built address on the start message.
			const consumerInbox: IDataspaceProtocolDataAddress = {
				"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
				endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
				endpoint: "https://consumer.example.com/dataspace/inbox"
			};

			await transferProcessStorage.set({
				id: "start-persist-internal-02",
				consumerPid: "start-persist-consumer-02",
				providerPid: "start-persist-provider-02",
				agreementId: "agreement-123",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-123",
				offerId: "offer-persist-02",
				providerIdentity: "did:iota:consumer-node-abc",
				localRole: TransferProcessRole.Consumer,
				format: DataspaceTransferFormat.HttpDataPush,
				dataAddress: consumerInbox,
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const message: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "start-persist-consumer-02",
				providerPid: "start-persist-provider-02",
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: "https://provider.example.com/data-plane/data/inbox"
				}
			};

			const result = await service.startTransfer(message, "valid-trust-payload");
			expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			const stored = await transferProcessStorage.get("start-persist-consumer-02", "consumerPid");
			expect(stored?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			expect(stored?.dataAddress).toEqual(consumerInbox);
		});

		test("should not persist a start-message dataAddress on a format-less legacy record", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Legacy records without a format rely on dataAddress absence for format inference.
			await transferProcessStorage.set({
				id: "start-persist-internal-03",
				consumerPid: "start-persist-consumer-03",
				providerPid: "start-persist-provider-03",
				agreementId: "agreement-123",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-123",
				offerId: "offer-persist-03",
				providerIdentity: "did:iota:consumer-node-abc",
				localRole: TransferProcessRole.Consumer,
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const message: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "start-persist-consumer-03",
				providerPid: "start-persist-provider-03",
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsQueryEndpoint,
					endpoint: "https://provider.example.com/data-plane/data/entities"
				}
			};

			const result = await service.startTransfer(message, "valid-trust-payload");
			expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			const stored = await transferProcessStorage.get("start-persist-consumer-03", "consumerPid");
			expect(stored?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			expect(stored?.dataAddress).toBeUndefined();
		});

		test("should call resumePushSubscription for SUSPENDED → STARTED PUSH transfer", async () => {
			const resumePushCalls: string[] = [];
			const setupPushCalls: string[] = [];
			const mockDataPlane = {
				className: () => "MockDataPlane",
				setupPushSubscription: async (consumerPid: string) => {
					setupPushCalls.push(consumerPid);
				},
				resumePushSubscription: async (consumerPid: string) => {
					resumePushCalls.push(consumerPid);
				}
			};
			ComponentFactory.register("test-data-plane-resume", () => mockDataPlane);
			ComponentFactory.register("test-trust-provider-resume", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-provider-resume",
				dataPlaneComponentType: "test-data-plane-resume"
			});

			// Seed a SUSPENDED PUSH transfer process
			await transferProcessStorage.set({
				consumerPid: "push-consumer-pid-susp",
				id: "push-internal-id-susp",
				providerPid: "push-provider-pid-susp",
				agreementId: "agreement-push-susp",
				state: DataspaceProtocolTransferProcessStateType.SUSPENDED,
				datasetId: "dataset-push-susp",
				offerId: "offer-push-susp",
				providerIdentity: "did:iota:provider-node-xyz",
				localRole: TransferProcessRole.Provider,
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString(),
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: "https://consumer.example.com/dataspace/inbox"
				}
			});

			const response = await service.startTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid: "push-consumer-pid-susp",
					providerPid: "push-provider-pid-susp"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			expect(resumePushCalls).toEqual(["push-consumer-pid-susp"]);
			expect(setupPushCalls).toHaveLength(0);

			try {
				ComponentFactory.unregister("test-data-plane-resume");
				ComponentFactory.unregister("test-trust-provider-resume");
			} catch {}
		});

		test("should return TransferError for PUSH transfer with missing dataAddress endpoint", async () => {
			ComponentFactory.register("test-trust-provider-bad", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-provider-bad"
			});

			// Seed a REQUESTED PUSH transfer process without a valid dataAddress
			await transferProcessStorage.set({
				consumerPid: "push-consumer-pid-bad",
				id: "push-internal-id-bad",
				providerPid: "push-provider-pid-bad",
				agreementId: "agreement-push-bad",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-push-bad",
				offerId: "offer-push-bad",
				providerIdentity: "did:iota:provider-node-xyz",
				localRole: TransferProcessRole.Provider,
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString(),
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: "",
					endpoint: ""
				}
			});

			const response = await service.startTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid: "push-consumer-pid-bad",
					providerPid: "push-provider-pid-bad"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(response.code).toMatch(/invalidPushDataAddress/);
			}

			const storedBad = await transferProcessStorage.get("push-consumer-pid-bad", "consumerPid");
			expect((storedBad as TransferProcess).state).toBe(
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);

			try {
				ComponentFactory.unregister("test-trust-provider-bad");
			} catch {}
		});

		test("should leave state at REQUESTED when pull is unsupported (dataPlanePath unconfigured)", async () => {
			ComponentFactory.register("test-trust-provider-pull-noconfig", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-provider-pull-noconfig",
				config: {}
			});

			await transferProcessStorage.set({
				consumerPid: "pull-consumer-pid-noconfig",
				id: "pull-internal-id-noconfig",
				providerPid: "pull-provider-pid-noconfig",
				agreementId: "agreement-pull-noconfig",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-pull-noconfig",
				offerId: "offer-pull-noconfig",
				providerIdentity: "did:iota:provider-node-xyz",
				localRole: TransferProcessRole.Provider,
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.startTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid: "pull-consumer-pid-noconfig",
					providerPid: "pull-provider-pid-noconfig"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(response.code).toMatch(/pullTransfersNotSupported/);
			}

			const storedPullNoconfig = await transferProcessStorage.get(
				"pull-consumer-pid-noconfig",
				"consumerPid"
			);
			expect((storedPullNoconfig as TransferProcess).state).toBe(
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);

			try {
				ComponentFactory.unregister("test-trust-provider-pull-noconfig");
			} catch {}
		});

		test("should leave state at REQUESTED when provider-initiated push has no dataPlanePath", async () => {
			ComponentFactory.register("test-trust-provider-push-noconfig", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-provider-push-noconfig",
				config: {}
			});

			await transferProcessStorage.set({
				consumerPid: "push-consumer-pid-noconfig",
				id: "push-internal-id-noconfig",
				providerPid: "push-provider-pid-noconfig",
				agreementId: "agreement-push-noconfig",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-push-noconfig",
				offerId: "offer-push-noconfig",
				providerIdentity: "did:iota:provider-node-xyz",
				localRole: TransferProcessRole.Provider,
				organizationIdentity: "did:iota:provider-node-xyz",
				format: DataspaceTransferFormat.HttpDataPost,
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.startTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid: "push-consumer-pid-noconfig",
					providerPid: "push-provider-pid-noconfig"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(response.code).toMatch(/pushTransferDataPathNotConfigured/);
			}

			const storedPushNoconfig = await transferProcessStorage.get(
				"push-consumer-pid-noconfig",
				"consumerPid"
			);
			expect((storedPushNoconfig as TransferProcess).state).toBe(
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);

			try {
				ComponentFactory.unregister("test-trust-provider-push-noconfig");
			} catch {}
		});

		test("should persist STARTED to storage BEFORE setupPushSubscription is invoked", async () => {
			// Regression guard: setupPushSubscription on the real data-plane reads the transfer
			// entity back from storage and requires state=STARTED. Earlier mocks only recorded
			// the call, so a defect where state was advanced after the data-plane call still
			// passed unit tests but broke the integration path.
			let observedStateAtCallTime: string | undefined;
			const mockDataPlane = {
				className: () => "MockDataPlane",
				setupPushSubscription: async (consumerPid: string) => {
					const stored = await transferProcessStorage.get(consumerPid, "consumerPid");
					observedStateAtCallTime = stored?.state;
				}
			};
			ComponentFactory.register("test-data-plane-readback", () => mockDataPlane);
			ComponentFactory.register("test-trust-readback", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-readback",
				dataPlaneComponentType: "test-data-plane-readback"
			});

			await transferProcessStorage.set({
				consumerPid: "push-consumer-pid-readback",
				id: "push-internal-id-readback",
				providerPid: "push-provider-pid-readback",
				agreementId: "agreement-readback",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-readback",
				offerId: "offer-readback",
				providerIdentity: "did:iota:provider-node-xyz",
				localRole: TransferProcessRole.Provider,
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString(),
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: "https://consumer.example.com/dataspace/inbox"
				}
			});

			const response = await service.startTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid: "push-consumer-pid-readback",
					providerPid: "push-provider-pid-readback"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			expect(observedStateAtCallTime).toBe(DataspaceProtocolTransferProcessStateType.STARTED);

			try {
				ComponentFactory.unregister("test-data-plane-readback");
				ComponentFactory.unregister("test-trust-readback");
			} catch {}
		});

		test("should revert state to REQUESTED if setupPushSubscription throws (atomicity)", async () => {
			const mockDataPlane = {
				className: () => "MockDataPlane",
				setupPushSubscription: vi
					.fn()
					.mockRejectedValue(new GeneralError("MockDataPlane", "setupFailed"))
			};
			ComponentFactory.register("test-data-plane-atomicity-req", () => mockDataPlane);
			ComponentFactory.register("test-trust-atomicity-req", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-atomicity-req",
				dataPlaneComponentType: "test-data-plane-atomicity-req"
			});

			await transferProcessStorage.set({
				consumerPid: "push-consumer-pid-atomicity-req",
				id: "push-internal-id-atomicity-req",
				providerPid: "push-provider-pid-atomicity-req",
				agreementId: "agreement-atomicity-req",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-atomicity-req",
				offerId: "offer-atomicity-req",
				providerIdentity: "did:iota:provider-node-xyz",
				localRole: TransferProcessRole.Provider,
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString(),
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: "https://consumer.example.com/dataspace/inbox"
				}
			});

			const response = await service.startTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid: "push-consumer-pid-atomicity-req",
					providerPid: "push-provider-pid-atomicity-req"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			const stored = await transferProcessStorage.get(
				"push-consumer-pid-atomicity-req",
				"consumerPid"
			);
			expect((stored as TransferProcess).state).toBe(
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);

			try {
				ComponentFactory.unregister("test-data-plane-atomicity-req");
				ComponentFactory.unregister("test-trust-atomicity-req");
			} catch {}
		});

		test("should revert state to SUSPENDED if resumePushSubscription throws (atomicity)", async () => {
			const mockDataPlane = {
				className: () => "MockDataPlane",
				setupPushSubscription: vi.fn(),
				resumePushSubscription: vi
					.fn()
					.mockRejectedValue(new GeneralError("MockDataPlane", "resumeFailed"))
			};
			ComponentFactory.register("test-data-plane-atomicity-susp", () => mockDataPlane);
			ComponentFactory.register("test-trust-atomicity-susp", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-atomicity-susp",
				dataPlaneComponentType: "test-data-plane-atomicity-susp"
			});

			await transferProcessStorage.set({
				consumerPid: "push-consumer-pid-atomicity-susp",
				id: "push-internal-id-atomicity-susp",
				providerPid: "push-provider-pid-atomicity-susp",
				agreementId: "agreement-atomicity-susp",
				state: DataspaceProtocolTransferProcessStateType.SUSPENDED,
				datasetId: "dataset-atomicity-susp",
				offerId: "offer-atomicity-susp",
				providerIdentity: "did:iota:provider-node-xyz",
				localRole: TransferProcessRole.Provider,
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString(),
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: "https://consumer.example.com/dataspace/inbox"
				}
			});

			const response = await service.startTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid: "push-consumer-pid-atomicity-susp",
					providerPid: "push-provider-pid-atomicity-susp"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			const stored = await transferProcessStorage.get(
				"push-consumer-pid-atomicity-susp",
				"consumerPid"
			);
			expect((stored as TransferProcess).state).toBe(
				DataspaceProtocolTransferProcessStateType.SUSPENDED
			);

			try {
				ComponentFactory.unregister("test-data-plane-atomicity-susp");
				ComponentFactory.unregister("test-trust-atomicity-susp");
			} catch {}
		});
		describe("endpoint URL handling (organization routing)", () => {
			// Mock trust component returns identity "did:iota:consumer-node-abc" by default; seed the
			// transfer with providerIdentity matching so validateCallerIsProvider passes, and an
			// empty dataAddress so the PULL-mode branch is exercised.
			const seedPullTransfer = async (): Promise<IDataspaceProtocolTransferStartMessage> => {
				const now = new Date().toISOString();
				const consumerPid = "urn:uuid:pull-consumer-pid";
				const providerPid = "urn:uuid:pull-provider-pid";
				await transferProcessStorage.set({
					consumerPid,
					id: "pull-test-id",
					providerPid,
					state: DataspaceProtocolTransferProcessStateType.REQUESTED,
					agreementId: "agreement-123",
					datasetId: "urn:uuid:dataset-123",
					offerId: "agreement-123",
					consumerIdentity: "did:iota:provider-node-xyz",
					providerIdentity: "did:iota:consumer-node-abc",
					localRole: TransferProcessRole.Provider,
					organizationIdentity: "did:iota:provider-node-xyz",
					dateCreated: now,
					dateModified: now
				});
				return {
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid,
					providerPid
				};
			};

			test("appends organization to pull endpoint URL", async () => {
				const message = await seedPullTransfer();
				const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

				const response = await service.startTransfer(message, "valid-trust-payload");

				if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
					throw new Error(`unexpected TransferError: ${response.code}`);
				}
				expect(response.dataAddress?.endpoint).toBe(
					`https://test-origin.com/data-plane/data/entities?${ContextIdKeys.Organization}=did%3Aiota%3Aprovider-node-xyz`
				);
			});

			test("appends organization query param to pull endpoint URL", async () => {
				const message = await seedPullTransfer();

				const service = new DataspaceControlPlaneService({
					...DEFAULT_SERVICE_OPTIONS
				});

				const response = await service.startTransfer(message, "valid-trust-payload");

				if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
					throw new Error(`unexpected TransferError: ${response.code}`);
				}
				expect(response.dataAddress?.endpoint).toBe(
					`https://test-origin.com/data-plane/data/entities?${ContextIdKeys.Organization}=did%3Aiota%3Aprovider-node-xyz`
				);
			});

			test("appends organization to pull endpoint URL when tenant context is absent", async () => {
				const message = await seedPullTransfer();

				const service = new DataspaceControlPlaneService({
					...DEFAULT_SERVICE_OPTIONS
				});

				// Remove Tenant from context (Organization still present)
				vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
					[ContextIdKeys.Node]: "did:iota:test-node",
					[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
					[ContextIdKeys.User]: "did:iota:test-user",
					[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
				});

				const response = await service.startTransfer(message, "valid-trust-payload");

				if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
					throw new Error(`unexpected TransferError: ${response.code}`);
				}
				expect(response.dataAddress?.endpoint).toBe(
					`https://test-origin.com/data-plane/data/entities?${ContextIdKeys.Organization}=did%3Aiota%3Aprovider-node-xyz`
				);
			});

			test("startTransfer accessToken does NOT auto-flow tenant/org context (caller must pass explicitly)", async () => {
				const message = await seedPullTransfer();

				const verifiableCredentialCreate = vi
					.fn()
					.mockImplementation(async (vmId, credId, subject, meta, signer) => ({
						jwt: `mock-jwt.${Converter.bytesToBase64(Converter.utf8ToBytes(JSON.stringify(subject)))}.sig`,
						verifiableCredential: {
							issuer: "did:iota:consumer-node-abc",
							credentialSubject: subject
						}
					}));
				ComponentFactory.register("s3-identity", () => ({
					className: () => "S3MockIdentityComponent",
					verifiableCredentialCreate
				}));

				const realGenerator = new JwtVerifiableCredentialGenerator({
					identityComponentType: "s3-identity",
					config: { verificationMethodId: "trust-assertion" }
				});

				const hybridTrustComponent: ITrustComponent = {
					className: () => "S3HybridTrustComponent",
					verify: async (payload: unknown) => ({
						verified: true,
						info: { identity: "did:iota:consumer-node-abc", token: payload as string }
					}),
					generate: async (
						issuerIdentity: string,
						generatorType?: string,
						info?: { subject?: { [key: string]: unknown } }
					) =>
						realGenerator.generate(
							issuerIdentity,
							info as { subject?: IJsonLdNodeObject } | undefined
						)
				};
				ComponentFactory.register("s3-real-trust", () => hybridTrustComponent);

				const service = new DataspaceControlPlaneService({
					...DEFAULT_SERVICE_OPTIONS,
					trustComponentType: "s3-real-trust"
				});

				const response = await service.startTransfer(message, "valid-trust-payload");
				if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
					throw new Error(`unexpected TransferError: ${response.code}`);
				}

				expect(verifiableCredentialCreate).toHaveBeenCalled();
				const lastCall =
					verifiableCredentialCreate.mock.calls[verifiableCredentialCreate.mock.calls.length - 1];
				const subjectArg = lastCall[2] as { [key: string]: unknown };

				// credentialSubject stays domain-only - tenant/org are NOT merged in.
				expect(subjectArg.tenantId).toBeUndefined();
				expect(subjectArg.organizationId).toBeUndefined();
				// Original transfer claims still flow through unchanged.
				expect(subjectArg.consumerPid).toBeDefined();
				expect(subjectArg.providerPid).toBeDefined();
				expect(subjectArg.agreementId).toBeDefined();
				expect(subjectArg.datasetId).toBeDefined();

				ComponentFactory.unregister("s3-real-trust");
				ComponentFactory.unregister("s3-identity");
			});
		});
	});

	test("should return TransferStartMessage with /inbox endpoint and JWT for provider-initiated push (HttpPostActivityStreamFormat)", async () => {
		const setupPushCalls: string[] = [];
		const mockDataPlane = {
			className: () => "MockDataPlane",
			setupPushSubscription: async (consumerPid: string) => {
				setupPushCalls.push(consumerPid);
			}
		};
		ComponentFactory.register("test-data-plane-post-push", () => mockDataPlane);
		ComponentFactory.register("test-trust-provider-post-push", () =>
			createMockTrustComponent("did:iota:provider-node-xyz")
		);

		const service = new DataspaceControlPlaneService({
			...DEFAULT_SERVICE_OPTIONS,
			trustComponentType: "test-trust-provider-post-push",
			dataPlaneComponentType: "test-data-plane-post-push"
		});

		// Seed a REQUESTED provider-initiated push transfer (no dataAddress, format=HttpPostActivityStreamFormat)
		await transferProcessStorage.set({
			consumerPid: "post-push-consumer-pid",
			id: "post-push-internal-id",
			providerPid: "post-push-provider-pid",
			agreementId: "agreement-post-push",
			state: DataspaceProtocolTransferProcessStateType.REQUESTED,
			datasetId: "dataset-post-push",
			offerId: "offer-post-push",
			providerIdentity: "did:iota:provider-node-xyz",
			localRole: TransferProcessRole.Provider,
			organizationIdentity: "did:iota:provider-node-xyz",
			format: DataspaceTransferFormat.HttpDataPost,
			dateCreated: new Date().toISOString(),
			dateModified: new Date().toISOString()
		});

		const response = await service.startTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "post-push-consumer-pid",
				providerPid: "post-push-provider-pid"
			},
			"valid-trust-payload"
		);

		expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		if (response["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
			expect(response.dataAddress?.endpointType).toBe(
				DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint
			);
			expect(response.dataAddress?.endpoint).toBe(
				`https://test-origin.com/data-plane/data/inbox?${ContextIdKeys.Organization}=did%3Aiota%3Aprovider-node-xyz`
			);
			// Provider-initiated push includes a JWT token in endpointProperties
			const authProp = response.dataAddress?.endpointProperties?.find(
				p => p.name === "authorization"
			);
			expect(authProp).toBeDefined();
			expect(authProp?.value).toBeTruthy();
		}
		// Provider-initiated push: provider is the receiver, so setupPushSubscription must NOT be called
		expect(setupPushCalls).toEqual([]);

		try {
			ComponentFactory.unregister("test-data-plane-post-push");
			ComponentFactory.unregister("test-trust-provider-post-push");
		} catch {}
	});

	test("should NOT call setupPushSubscription for HttpPostActivityStreamFormat on REQUESTED → STARTED", async () => {
		const pushSubscriptionCalls: string[] = [];
		const mockDataPlane = {
			className: () => "MockDataPlane",
			setupPushSubscription: async (pid: string) => {
				pushSubscriptionCalls.push(`setup:${pid}`);
			},
			resumePushSubscription: async (pid: string) => {
				pushSubscriptionCalls.push(`resume:${pid}`);
			}
		};
		ComponentFactory.register("test-data-plane-pini-01", () => mockDataPlane);
		ComponentFactory.register("test-trust-pini-01", () =>
			createMockTrustComponent("did:iota:provider-node-xyz")
		);

		const service = new DataspaceControlPlaneService({
			...DEFAULT_SERVICE_OPTIONS,
			trustComponentType: "test-trust-pini-01",
			dataPlaneComponentType: "test-data-plane-pini-01"
		});

		await transferProcessStorage.set({
			consumerPid: "pini-01-consumer-pid",
			id: "pini-01-internal-id",
			providerPid: "pini-01-provider-pid",
			agreementId: "agreement-pini-01",
			state: DataspaceProtocolTransferProcessStateType.REQUESTED,
			datasetId: "dataset-pini-01",
			offerId: "offer-pini-01",
			providerIdentity: "did:iota:provider-node-xyz",
			organizationIdentity: "did:iota:provider-node-xyz",
			format: DataspaceTransferFormat.HttpDataPost,
			dateCreated: new Date().toISOString(),
			dateModified: new Date().toISOString()
		});

		const response = await service.startTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "pini-01-consumer-pid",
				providerPid: "pini-01-provider-pid"
			},
			"valid-trust-payload"
		);

		expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		expect(pushSubscriptionCalls).toEqual([]);

		try {
			ComponentFactory.unregister("test-data-plane-pini-01");
			ComponentFactory.unregister("test-trust-pini-01");
		} catch {}
	});

	test("should NOT call resumePushSubscription for HttpPostActivityStreamFormat on SUSPENDED → STARTED", async () => {
		const pushSubscriptionCalls: string[] = [];
		const mockDataPlane = {
			className: () => "MockDataPlane",
			setupPushSubscription: async (pid: string) => {
				pushSubscriptionCalls.push(`setup:${pid}`);
			},
			resumePushSubscription: async (pid: string) => {
				pushSubscriptionCalls.push(`resume:${pid}`);
			}
		};
		ComponentFactory.register("test-data-plane-pini-02", () => mockDataPlane);
		ComponentFactory.register("test-trust-pini-02", () =>
			createMockTrustComponent("did:iota:provider-node-xyz")
		);

		const service = new DataspaceControlPlaneService({
			...DEFAULT_SERVICE_OPTIONS,
			trustComponentType: "test-trust-pini-02",
			dataPlaneComponentType: "test-data-plane-pini-02"
		});

		await transferProcessStorage.set({
			consumerPid: "pini-02-consumer-pid",
			id: "pini-02-internal-id",
			providerPid: "pini-02-provider-pid",
			agreementId: "agreement-pini-02",
			state: DataspaceProtocolTransferProcessStateType.SUSPENDED,
			datasetId: "dataset-pini-02",
			offerId: "offer-pini-02",
			providerIdentity: "did:iota:provider-node-xyz",
			organizationIdentity: "did:iota:provider-node-xyz",
			format: DataspaceTransferFormat.HttpDataPost,
			dateCreated: new Date().toISOString(),
			dateModified: new Date().toISOString()
		});

		const response = await service.startTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "pini-02-consumer-pid",
				providerPid: "pini-02-provider-pid"
			},
			"valid-trust-payload"
		);

		expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		expect(pushSubscriptionCalls).toEqual([]);

		try {
			ComponentFactory.unregister("test-data-plane-pini-02");
			ComponentFactory.unregister("test-trust-pini-02");
		} catch {}
	});

	test("rejects startTransfer from an organization that does not own this transfer (transferWrongOrganization)", async () => {
		const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

		const ownerOrg = "did:iota:org-owner";
		const otherOrg = "did:iota:org-other";

		await transferProcessStorage.set({
			consumerPid: "wrong-tenant-start-pid",
			id: "wrong-tenant-start-id",
			providerPid: "wrong-tenant-start-provider-pid",
			agreementId: "agreement-wrong-tenant-start",
			state: DataspaceProtocolTransferProcessStateType.REQUESTED,
			datasetId: "dataset-wrong-tenant-start",
			offerId: "offer-wrong-tenant-start",
			consumerIdentity: "did:iota:consumer-node-abc",
			// Must match what the default test-trust mock returns ("did:iota:consumer-node-abc")
			// so the callerNotAuthorizedAsProvider check passes before the org check is reached.
			providerIdentity: "did:iota:consumer-node-abc",
			organizationIdentity: ownerOrg,
			dateCreated: new Date().toISOString(),
			dateModified: new Date().toISOString()
		});

		// Caller's organization context is `otherOrg`, but the entity is owned by `ownerOrg`.
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
			[ContextIdKeys.Node]: "did:iota:test-node",
			[ContextIdKeys.Organization]: otherOrg,
			[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
		});

		const response = await service.startTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "wrong-tenant-start-pid",
				providerPid: "wrong-tenant-start-provider-pid"
			},
			"valid-trust-payload"
		);

		expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
			expect(response.code).toMatch(/^UnauthorizedError:/);
			expect(response.code).toContain("transferWrongOrganization");
		}
	});

	describe("completeTransfer()", () => {
		test("should transition Transfer Process to COMPLETED state", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Use mock process in STARTED state
			const message: IDataspaceProtocolTransferCompletionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferCompletionMessage",
				consumerPid: "consumer-pid-001",
				providerPid: "provider-pid-001"
			};

			const response = await service.completeTransfer(message, "valid-trust-payload");

			expect(response).toBeDefined();
			if (response["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = response;
				expect(transferProcess.consumerPid).toBe("consumer-pid-001");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.COMPLETED);
			}
		});

		test("should return TransferError for non-existent consumerPid", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferCompletionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferCompletionMessage",
				consumerPid: "non-existent-pid",
				providerPid: "provider-pid-999"
			};

			const result = await service.completeTransfer(message, "valid-trust-payload");
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferError = result;
				// Semantic error code format: "ErrorName:message"
				expect(transferError.code).toMatch(/^NotFoundError:/);
			}
		});

		test("should call teardownPushSubscription when completing a PUSH transfer", async () => {
			const teardownCalls: string[] = [];
			const mockDataPlane = {
				className: () => "MockDataPlane",
				teardownPushSubscription: async (consumerPid: string) => {
					teardownCalls.push(consumerPid);
				}
			};
			ComponentFactory.register("test-data-plane-complete-push", () => mockDataPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				dataPlaneComponentType: "test-data-plane-complete-push"
			});

			await transferProcessStorage.set({
				consumerPid: "push-complete-pid",
				id: "push-complete-internal-id",
				providerPid: "push-complete-provider-pid",
				agreementId: "agreement-push-complete",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-push-complete",
				offerId: "offer-push-complete",
				format: DataspaceTransferFormat.HttpDataPush,
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.completeTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferCompletionMessage",
					consumerPid: "push-complete-pid",
					providerPid: "push-complete-provider-pid"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			expect(teardownCalls).toEqual(["push-complete-pid"]);

			try {
				ComponentFactory.unregister("test-data-plane-complete-push");
			} catch {}
		});

		test("rolls back to STARTED if teardownPushSubscription throws (PUSH transfer)", async () => {
			const mockDataPlane = {
				className: () => "MockDataPlane",
				teardownPushSubscription: async () => {
					throw new Error("teardown blew up");
				}
			};
			ComponentFactory.register("test-data-plane-complete-rollback", () => mockDataPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				dataPlaneComponentType: "test-data-plane-complete-rollback"
			});

			await transferProcessStorage.set({
				consumerPid: "push-complete-rollback-pid",
				id: "push-complete-rollback-internal-id",
				providerPid: "push-complete-rollback-provider-pid",
				agreementId: "agreement-push-complete-rollback",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-push-complete-rollback",
				offerId: "offer-push-complete-rollback",
				format: DataspaceTransferFormat.HttpDataPush,
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.completeTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferCompletionMessage",
					consumerPid: "push-complete-rollback-pid",
					providerPid: "push-complete-rollback-provider-pid"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const persisted = await transferProcessStorage.get(
				"push-complete-rollback-pid",
				"consumerPid"
			);
			expect(persisted?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);

			try {
				ComponentFactory.unregister("test-data-plane-complete-rollback");
			} catch {}
		});

		test("is idempotent: re-completing an already-COMPLETED transfer returns success", async () => {
			let teardownCallCount = 0;
			const mockDataPlane = {
				className: () => "MockDataPlane",
				teardownPushSubscription: async () => {
					teardownCallCount++;
				}
			};
			ComponentFactory.register("test-data-plane-complete-idempotent", () => mockDataPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				dataPlaneComponentType: "test-data-plane-complete-idempotent"
			});

			await transferProcessStorage.set({
				consumerPid: "push-complete-idempotent-pid",
				id: "push-complete-idempotent-internal-id",
				providerPid: "push-complete-idempotent-provider-pid",
				agreementId: "agreement-push-complete-idempotent",
				state: DataspaceProtocolTransferProcessStateType.COMPLETED,
				datasetId: "dataset-push-complete-idempotent",
				offerId: "offer-push-complete-idempotent",
				format: DataspaceTransferFormat.HttpDataPush,
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.completeTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferCompletionMessage",
					consumerPid: "push-complete-idempotent-pid",
					providerPid: "push-complete-idempotent-provider-pid"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferProcess);
			if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferProcess) {
				expect(response.state).toBe(DataspaceProtocolTransferProcessStateType.COMPLETED);
			}
			// No second data-plane teardown - the first attempt already ran it.
			expect(teardownCallCount).toBe(0);

			try {
				ComponentFactory.unregister("test-data-plane-complete-idempotent");
			} catch {}
		});

		test("rejects completeTransfer from an organization that does not own this transfer (transferWrongOrganization)", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const ownerOrg = "did:iota:org-owner";
			const otherOrg = "did:iota:org-other";

			await transferProcessStorage.set({
				consumerPid: "wrong-tenant-complete-pid",
				id: "wrong-tenant-complete-id",
				providerPid: "wrong-tenant-complete-provider-pid",
				agreementId: "agreement-wrong-tenant-complete",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-wrong-tenant-complete",
				offerId: "offer-wrong-tenant-complete",
				// Must match what the default test-trust mock returns ("did:iota:consumer-node-abc")
				// so the callerNotAuthorizedAsConsumer check passes before the org check is reached.
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: ownerOrg,
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			// Caller's organization context is `otherOrg`, but the entity is owned by `ownerOrg`.
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Organization]: otherOrg
			});

			const response = await service.completeTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferCompletionMessage",
					consumerPid: "wrong-tenant-complete-pid",
					providerPid: "wrong-tenant-complete-provider-pid"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(response.code).toMatch(/^UnauthorizedError:/);
				expect(response.code).toContain("transferWrongOrganization");
			}
		});
	});

	describe("suspendTransfer()", () => {
		test("should transition Transfer Process to SUSPENDED state", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferSuspensionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferSuspensionMessage",
				consumerPid: "consumer-pid-001",
				providerPid: "provider-pid-001",
				reason: ["Manual suspension for testing"]
			};

			const response = await service.suspendTransfer(message, "valid-trust-payload");

			expect(response).toBeDefined();
			if (response["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = response;
				expect(transferProcess.consumerPid).toBe("consumer-pid-001");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.SUSPENDED);
			}
		});

		test("should return TransferError for non-existent consumerPid", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferSuspensionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferSuspensionMessage",
				consumerPid: "non-existent-pid",
				providerPid: "provider-pid-999"
			};

			const result = await service.suspendTransfer(message, "valid-trust-payload");
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferError = result;
				// Semantic error code format: "ErrorName:message"
				expect(transferError.code).toMatch(/^NotFoundError:/);
			}
		});

		test("should call suspendPushSubscription when suspending a PUSH transfer", async () => {
			const suspendCalls: string[] = [];
			const mockDataPlane = {
				className: () => "MockDataPlane",
				suspendPushSubscription: async (consumerPid: string) => {
					suspendCalls.push(consumerPid);
				}
			};
			ComponentFactory.register("test-data-plane-suspend-push", () => mockDataPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				dataPlaneComponentType: "test-data-plane-suspend-push"
			});

			await transferProcessStorage.set({
				consumerPid: "push-suspend-pid",
				id: "push-suspend-internal-id",
				providerPid: "push-suspend-provider-pid",
				agreementId: "agreement-push-suspend",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-push-suspend",
				offerId: "offer-push-suspend",
				format: DataspaceTransferFormat.HttpDataPush,
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.suspendTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferSuspensionMessage",
					consumerPid: "push-suspend-pid",
					providerPid: "push-suspend-provider-pid"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			expect(suspendCalls).toEqual(["push-suspend-pid"]);

			try {
				ComponentFactory.unregister("test-data-plane-suspend-push");
			} catch {}
		});

		test("rolls back to STARTED if suspendPushSubscription throws (PUSH transfer)", async () => {
			const mockDataPlane = {
				className: () => "MockDataPlane",
				suspendPushSubscription: async () => {
					throw new Error("suspend blew up");
				}
			};
			ComponentFactory.register("test-data-plane-suspend-rollback", () => mockDataPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				dataPlaneComponentType: "test-data-plane-suspend-rollback"
			});

			await transferProcessStorage.set({
				consumerPid: "push-suspend-rollback-pid",
				id: "push-suspend-rollback-internal-id",
				providerPid: "push-suspend-rollback-provider-pid",
				agreementId: "agreement-push-suspend-rollback",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-push-suspend-rollback",
				offerId: "offer-push-suspend-rollback",
				format: DataspaceTransferFormat.HttpDataPush,
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.suspendTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferSuspensionMessage",
					consumerPid: "push-suspend-rollback-pid",
					providerPid: "push-suspend-rollback-provider-pid",
					reason: ["transient failure"]
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const persisted = await transferProcessStorage.get(
				"push-suspend-rollback-pid",
				"consumerPid"
			);
			expect(persisted?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);

			try {
				ComponentFactory.unregister("test-data-plane-suspend-rollback");
			} catch {}
		});

		test("is idempotent: re-suspending an already-SUSPENDED transfer returns success", async () => {
			let suspendCallCount = 0;
			const mockDataPlane = {
				className: () => "MockDataPlane",
				suspendPushSubscription: async () => {
					suspendCallCount++;
				}
			};
			ComponentFactory.register("test-data-plane-suspend-idempotent", () => mockDataPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				dataPlaneComponentType: "test-data-plane-suspend-idempotent"
			});

			await transferProcessStorage.set({
				consumerPid: "push-suspend-idempotent-pid",
				id: "push-suspend-idempotent-internal-id",
				providerPid: "push-suspend-idempotent-provider-pid",
				agreementId: "agreement-push-suspend-idempotent",
				state: DataspaceProtocolTransferProcessStateType.SUSPENDED,
				datasetId: "dataset-push-suspend-idempotent",
				offerId: "offer-push-suspend-idempotent",
				format: DataspaceTransferFormat.HttpDataPush,
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.suspendTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferSuspensionMessage",
					consumerPid: "push-suspend-idempotent-pid",
					providerPid: "push-suspend-idempotent-provider-pid",
					reason: ["resend"]
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferProcess);
			if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferProcess) {
				expect(response.state).toBe(DataspaceProtocolTransferProcessStateType.SUSPENDED);
			}
			expect(suspendCallCount).toBe(0);

			try {
				ComponentFactory.unregister("test-data-plane-suspend-idempotent");
			} catch {}
		});

		test("rejects suspendTransfer from an organization that does not own this transfer (transferWrongOrganization)", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const ownerOrg = "did:iota:org-owner";
			const otherOrg = "did:iota:org-other";

			await transferProcessStorage.set({
				consumerPid: "wrong-tenant-suspend-pid",
				id: "wrong-tenant-suspend-id",
				providerPid: "wrong-tenant-suspend-provider-pid",
				agreementId: "agreement-wrong-tenant-suspend",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-wrong-tenant-suspend",
				offerId: "offer-wrong-tenant-suspend",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: ownerOrg,
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			// Caller's organization context is `otherOrg`, but the entity is owned by `ownerOrg`.
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Organization]: otherOrg
			});

			const response = await service.suspendTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferSuspensionMessage",
					consumerPid: "wrong-tenant-suspend-pid",
					providerPid: "wrong-tenant-suspend-provider-pid",
					reason: ["wrong org attempt"]
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(response.code).toMatch(/^UnauthorizedError:/);
				expect(response.code).toContain("transferWrongOrganization");
			}
		});
	});

	describe("terminateTransfer()", () => {
		test("should transition Transfer Process to TERMINATED state", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferTerminationMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferTerminationMessage",
				consumerPid: "consumer-pid-001",
				providerPid: "provider-pid-001",
				reason: ["Manual termination for testing"]
			};

			const response = await service.terminateTransfer(message, "valid-trust-payload");

			expect(response).toBeDefined();
			if (response["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = response;
				expect(transferProcess.consumerPid).toBe("consumer-pid-001");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.TERMINATED);
			}
		});

		test("should return TransferError for non-existent consumerPid", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferTerminationMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferTerminationMessage",
				consumerPid: "non-existent-pid",
				providerPid: "provider-pid-999"
			};

			const result = await service.terminateTransfer(message, "valid-trust-payload");
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferError = result;
				// Semantic error code format: "ErrorName:message"
				expect(transferError.code).toMatch(/^NotFoundError:/);
			}
		});

		test("should call teardownPushSubscription when terminating a PUSH transfer", async () => {
			const teardownCalls: string[] = [];
			const mockDataPlane = {
				className: () => "MockDataPlane",
				teardownPushSubscription: async (consumerPid: string) => {
					teardownCalls.push(consumerPid);
				}
			};
			ComponentFactory.register("test-data-plane-terminate-push", () => mockDataPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				dataPlaneComponentType: "test-data-plane-terminate-push"
			});

			await transferProcessStorage.set({
				consumerPid: "push-terminate-pid",
				id: "push-terminate-internal-id",
				providerPid: "push-terminate-provider-pid",
				agreementId: "agreement-push-terminate",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-push-terminate",
				offerId: "offer-push-terminate",
				format: DataspaceTransferFormat.HttpDataPush,
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.terminateTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferTerminationMessage",
					consumerPid: "push-terminate-pid",
					providerPid: "push-terminate-provider-pid"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			expect(teardownCalls).toEqual(["push-terminate-pid"]);

			try {
				ComponentFactory.unregister("test-data-plane-terminate-push");
			} catch {}
		});

		test("rolls back to previous state if teardownPushSubscription throws (PUSH transfer)", async () => {
			const mockDataPlane = {
				className: () => "MockDataPlane",
				teardownPushSubscription: async () => {
					throw new Error("teardown blew up");
				}
			};
			ComponentFactory.register("test-data-plane-terminate-rollback", () => mockDataPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				dataPlaneComponentType: "test-data-plane-terminate-rollback"
			});

			await transferProcessStorage.set({
				consumerPid: "push-terminate-rollback-pid",
				id: "push-terminate-rollback-internal-id",
				providerPid: "push-terminate-rollback-provider-pid",
				agreementId: "agreement-push-terminate-rollback",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-push-terminate-rollback",
				offerId: "offer-push-terminate-rollback",
				format: DataspaceTransferFormat.HttpDataPush,
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.terminateTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferTerminationMessage",
					consumerPid: "push-terminate-rollback-pid",
					providerPid: "push-terminate-rollback-provider-pid",
					reason: ["transient failure"]
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const persisted = await transferProcessStorage.get(
				"push-terminate-rollback-pid",
				"consumerPid"
			);
			expect(persisted?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);

			try {
				ComponentFactory.unregister("test-data-plane-terminate-rollback");
			} catch {}
		});

		test("is idempotent: re-terminating an already-TERMINATED transfer returns success", async () => {
			let teardownCallCount = 0;
			const mockDataPlane = {
				className: () => "MockDataPlane",
				teardownPushSubscription: async () => {
					teardownCallCount++;
				}
			};
			ComponentFactory.register("test-data-plane-terminate-idempotent", () => mockDataPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				dataPlaneComponentType: "test-data-plane-terminate-idempotent"
			});

			await transferProcessStorage.set({
				consumerPid: "push-terminate-idempotent-pid",
				id: "push-terminate-idempotent-internal-id",
				providerPid: "push-terminate-idempotent-provider-pid",
				agreementId: "agreement-push-terminate-idempotent",
				state: DataspaceProtocolTransferProcessStateType.TERMINATED,
				datasetId: "dataset-push-terminate-idempotent",
				offerId: "offer-push-terminate-idempotent",
				format: DataspaceTransferFormat.HttpDataPush,
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.terminateTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferTerminationMessage",
					consumerPid: "push-terminate-idempotent-pid",
					providerPid: "push-terminate-idempotent-provider-pid",
					reason: ["resend"]
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferProcess);
			if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferProcess) {
				expect(response.state).toBe(DataspaceProtocolTransferProcessStateType.TERMINATED);
			}
			expect(teardownCallCount).toBe(0);

			try {
				ComponentFactory.unregister("test-data-plane-terminate-idempotent");
			} catch {}
		});

		test("rejects terminateTransfer from an organization that does not own this transfer (transferWrongOrganization)", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const ownerOrg = "did:iota:org-owner";
			const otherOrg = "did:iota:org-other";

			await transferProcessStorage.set({
				consumerPid: "wrong-tenant-terminate-pid",
				id: "wrong-tenant-terminate-id",
				providerPid: "wrong-tenant-terminate-provider-pid",
				agreementId: "agreement-wrong-tenant-terminate",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-wrong-tenant-terminate",
				offerId: "offer-wrong-tenant-terminate",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: ownerOrg,
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			// Caller's organization context is `otherOrg`, but the entity is owned by `ownerOrg`.
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Organization]: otherOrg
			});

			const response = await service.terminateTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferTerminationMessage",
					consumerPid: "wrong-tenant-terminate-pid",
					providerPid: "wrong-tenant-terminate-provider-pid",
					reason: ["wrong org attempt"]
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(response.code).toMatch(/^UnauthorizedError:/);
				expect(response.code).toContain("transferWrongOrganization");
			}
		});
	});

	describe("resolveConsumerPid() - Internal API for DSC", () => {
		let mockPapResolve: MockPolicyAdministrationPointComponent;
		let mockFedCatResolve: MockFederatedCatalogueComponent;

		beforeEach(() => {
			// Create and register mock PAP and FedCat
			mockPapResolve = new MockPolicyAdministrationPointComponent();
			mockFedCatResolve = new MockFederatedCatalogueComponent();
			ComponentFactory.register("test-pap-resolve", () => mockPapResolve);
			ComponentFactory.register("test-fedcat-resolve", () => mockFedCatResolve);

			// Register mock trust components for resolver tests
			ComponentFactory.register("test-trust-resolve", () => createMockTrustComponent());
			ComponentFactory.register("test-trust-resolve-as-provider", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			// Mock ContextIdStore to return test organization ID
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz", // Matches assigner in test agreements
				[ContextIdKeys.User]: "did:iota:test-user",
				[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
			});
		});

		afterEach(() => {
			try {
				ComponentFactory.unregister("test-pap-resolve");
				ComponentFactory.unregister("test-fedcat-resolve");
				ComponentFactory.unregister("test-trust-resolve");
				ComponentFactory.unregister("test-trust-resolve-as-provider");
			} catch {
				// Ignore errors if already unregistered
			}
			vi.restoreAllMocks();
		});

		test("should resolve consumerPid to Transfer Context with Agreement", async () => {
			// Caller-validation builds the caller's composite from the
			// node+tenant context and matches against agreement.assigner. Pin
			// the context to a single-tenant shape (no Tenant) so the composite
			// collapses to the bare node DID and lines up with the fixture
			// assigner below. This keeps the resolve-flow assertions independent
			// of the BLAKE2b hash details.
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:provider-node-xyz",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
				[ContextIdKeys.User]: "did:iota:test-user",
				[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
			});

			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add a test agreement (target must match dataset @id in mock FedCat)
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-001",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-123",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-001",
					agreementId: "agreement-001",
					callbackAddress: "https://consumer.example.com/callback",
					format: "HttpData-PULL"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;

				// Start the transfer as the provider (startTransfer requires provider identity).
				// dataPlanePath is required for pull-mode transfers - without it, startTransfer
				// returns a `pullTransfersNotSupported` TransferError and (post-fix) leaves the
				// state at REQUESTED, so we must configure it to get to STARTED.
				const providerService = new DataspaceControlPlaneService({
					policyAdministrationPointComponentType: "test-pap-resolve",
					policyNegotiationPointComponentType: "test-pnp",
					federatedCatalogueComponentType: "test-fedcat-resolve",
					trustComponentType: "test-trust-resolve-as-provider",
					transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
					config: {
						dataPlanePath: "data-plane/data"
					}
				});
				await providerService.startTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferStartMessage",
						consumerPid: transferProcess.consumerPid,
						providerPid: transferProcess.providerPid
					},
					"valid-trust-payload"
				);
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Verify entity was stored
			const storedEntity = await transferProcessStorage.get("consumer-pid-001", "consumerPid");
			expect(storedEntity).toBeDefined();

			// Pass a valid trust payload (mock trust component accepts any payload)
			// In production, the consumer would receive a data access token via TransferStartMessage.dataAddress
			const context = await service.resolveConsumerPid("consumer-pid-001", "valid-trust-payload");

			expect(context).toBeDefined();
			expect(context.consumerPid).toBe("consumer-pid-001");
			expect(context.providerPid).toBe(providerPid);
			// datasetId is now the full URN (DCAT-compliant, not parsed)
			expect(context.datasetId).toBe("urn:uuid:dataset-123");
			expect(context.agreement).toBeDefined();
			expect(context.agreement["@id"]).toBe("agreement-001");
			expect(context.agreement["@type"]).toBe("Agreement");
			expect(context.providerIdentity).toBe("did:iota:provider-node-xyz");
			expect(context.offerId).toBeDefined();
			expect(context.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
		});

		test("should throw NotFoundError for non-existent consumerPid", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			await expect(service.resolveConsumerPid("non-existent-pid", "some-token")).rejects.toThrow(
				NotFoundError
			);
		});

		test("should throw GeneralError if Transfer Process is TERMINATED", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-001",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-123",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-001",
					agreementId: "agreement-001",
					callbackAddress: "https://consumer.example.com/callback",
					format: "HttpData-PULL"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;
			} else {
				throw new Error("Failed to create transfer process");
			}

			// First terminate the process
			const terminateMessage: IDataspaceProtocolTransferTerminationMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferTerminationMessage",
				consumerPid: "consumer-pid-001",
				providerPid
			};
			await service.terminateTransfer(terminateMessage, "valid-trust-payload");

			// Then try to resolve it - should throw GeneralError for TERMINATED state
			await expect(
				service.resolveConsumerPid("consumer-pid-001", "valid-trust-payload")
			).rejects.toThrow(GeneralError);
		});

		test("should throw UnauthorizedError when trust verification fails", async () => {
			// Register a failing trust component
			ComponentFactory.register("test-trust-failing", () => createFailingMockTrustComponent());

			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-failing",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-trust-fail",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-123",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			// We need to use a service with working trust to create the transfer
			const workingService = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			await workingService.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-trust-fail",
					agreementId: "agreement-trust-fail",
					callbackAddress: "https://consumer.example.com/callback",
					format: "HttpData-PULL"
				},
				"valid-trust-payload"
			);

			// Start the transfer as provider (startTransfer requires provider identity)
			const providerStartService = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve-as-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				config: { dataPlanePath: "data-plane/data" }
			});
			const startResponse = await workingService.getTransferProcess(
				"consumer-pid-trust-fail",
				"valid-trust-payload"
			);
			if (startResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				await providerStartService.startTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferStartMessage",
						consumerPid: startResponse.consumerPid,
						providerPid: startResponse.providerPid
					},
					"valid-trust-payload"
				);
			}

			// Now try to resolve with the failing trust component service
			// TrustHelper.verifyTrust should throw UnauthorizedError when verified: false
			await expect(
				service.resolveConsumerPid("consumer-pid-trust-fail", "any-token")
			).rejects.toMatchObject({ name: "UnauthorizedError" });

			// Cleanup
			ComponentFactory.unregister("test-trust-failing");
		});

		test("should throw GeneralError when organization context is missing", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-001",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-123",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-001",
					agreementId: "agreement-001",
					callbackAddress: "https://consumer.example.com/callback",
					format: "HttpData-PULL"
				},
				"valid-trust-payload"
			);

			// Mock ContextIdStore to return undefined organization
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant"
				// Organization is missing
			});

			// Pass the correct token format for the trust component
			await expect(
				service.resolveConsumerPid("consumer-pid-001", "mock-jwt-consumer-pid-001")
			).rejects.toMatchObject({ name: "GeneralError" });
		});

		test("should throw UnauthorizedError when Agreement assigner doesn't match organization", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement with valid assigner (matches mock FedCat offer)
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-001",
				assigner: "did:iota:provider-node-xyz", // Matches offer in mock FedCat
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-123",
				permission: [{ action: "read" }]
			});

			// Create transfer process first (with correct org context)
			await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-001",
					agreementId: "agreement-001",
					callbackAddress: "https://consumer.example.com/callback",
					format: "HttpData-PULL"
				},
				"valid-trust-payload"
			);

			// Now change context to different organization for resolve call
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant",
				[ContextIdKeys.Organization]: "did:iota:different-provider", // Different from Agreement assigner
				[ContextIdKeys.User]: "did:iota:test-user"
			});

			// Pass the correct token format for the trust component
			await expect(
				service.resolveConsumerPid("consumer-pid-001", "mock-jwt-consumer-pid-001")
			).rejects.toMatchObject({ name: "UnauthorizedError" });
		});

		test("should return TransferError when Agreement is missing assigner", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement without assigner (invalid but for testing)
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-001",
				// assigner is missing
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-123",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolAgreement);

			// With FedCat validation, missing assigner causes requestTransfer to return TransferError
			// (agreement won't match any offer in catalog)
			const result = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-001",
					agreementId: "agreement-001",
					callbackAddress: "https://consumer.example.com/callback",
					format: "HttpData-PULL"
				},
				"valid-trust-payload"
			);

			// Assert - Should be a TransferError
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const transferError = result as IDataspaceProtocolTransferError;
			expect(transferError.code).toMatch(/GeneralError:/);
		});

		test("should include dataAddress when present in transfer process", async () => {
			// Same single-tenant context override as the parent test - collapses
			// the caller composite to the bare node DID so it lines up with the
			// fixture assigner below.
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:provider-node-xyz",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
				[ContextIdKeys.User]: "did:iota:test-user",
				[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
			});

			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Create transfer process with dataAddress (push mode)
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push",
					agreementId: "agreement-push",
					format: DataspaceTransferFormat.HttpDataPush,
					callbackAddress: "https://consumer.example.com/callback",
					dataAddress: {
						"@type": "DataAddress",
						endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
						endpoint: "https://consumer.example.com/dataspace/inbox"
					}
				},
				"valid-trust-payload"
			);

			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;

				// Start the transfer as provider (startTransfer requires provider identity)
				const providerStartService = new DataspaceControlPlaneService({
					policyAdministrationPointComponentType: "test-pap-resolve",
					policyNegotiationPointComponentType: "test-pnp",
					federatedCatalogueComponentType: "test-fedcat-resolve",
					trustComponentType: "test-trust-resolve-as-provider",
					transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
					config: { dataPlanePath: "data-plane/data" }
				});
				await providerStartService.startTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferStartMessage",
						consumerPid: transferProcess.consumerPid,
						providerPid: transferProcess.providerPid
					},
					"valid-trust-payload"
				);
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Verify the entity was stored
			const storedEntity = await transferProcessStorage.get("consumer-pid-push", "consumerPid");
			expect(storedEntity).toBeDefined();
			if (!storedEntity) {
				throw new Error("Entity not found");
			}

			// Pass a valid trust payload (trust verification handles authentication)
			const context = await service.resolveConsumerPid("consumer-pid-push", "valid-trust-payload");

			expect(context.dataAddress).toBeDefined();
			expect(context.dataAddress?.["@type"]).toBe("DataAddress");
			expect(context.dataAddress?.endpointType).toBe(
				DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint
			);
			expect(context.dataAddress?.endpoint).toBe("https://consumer.example.com/dataspace/inbox");
		});
	});

	describe("resolveProviderPid() - Internal API for DSC (Push Mode)", () => {
		let mockPapProvider: MockPolicyAdministrationPointComponent;
		let mockFedCatProvider: MockFederatedCatalogueComponent;

		beforeEach(() => {
			// Create and register mock PAP and FedCat
			mockPapProvider = new MockPolicyAdministrationPointComponent();
			mockFedCatProvider = new MockFederatedCatalogueComponent();
			ComponentFactory.register("test-pap-resolve-provider", () => mockPapProvider);
			ComponentFactory.register("test-fedcat-resolve-provider", () => mockFedCatProvider);

			// Register mock trust components for provider resolver tests
			ComponentFactory.register("test-trust-resolve-provider", () => createMockTrustComponent());
			ComponentFactory.register("test-trust-resolve-provider-as-provider", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			// Mock ContextIdStore to return test organization ID
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
				[ContextIdKeys.User]: "did:iota:test-user",
				[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
			});
		});

		afterEach(() => {
			try {
				ComponentFactory.unregister("test-pap-resolve-provider");
				ComponentFactory.unregister("test-fedcat-resolve-provider");
				ComponentFactory.unregister("test-trust-resolve-provider");
				ComponentFactory.unregister("test-trust-resolve-provider-as-provider");
			} catch {
				// Ignore errors if already unregistered
			}
			vi.restoreAllMocks();
		});

		test("should resolve providerPid to Transfer Context with Agreement", async () => {
			// Caller-validation builds the caller's composite from
			// node+tenant. Pin the context to a single-tenant shape so the
			// composite matches the bare-DID assigner below.
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:provider-node-xyz",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
				[ContextIdKeys.User]: "did:iota:test-user",
				[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
			});

			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-001",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push-123",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push-001",
					agreementId: "agreement-push-001",
					format: DataspaceTransferFormat.HttpDataPush,
					callbackAddress: "https://consumer.example.com/callback",
					dataAddress: {
						"@type": "DataAddress",
						endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
						endpoint: "https://consumer.example.com/dataspace/inbox"
					}
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;

				// Start the transfer as the provider (startTransfer requires provider identity).
				// dataPlanePath is required to reach STARTED - see sibling test above.
				const providerService = new DataspaceControlPlaneService({
					policyAdministrationPointComponentType: "test-pap-resolve-provider",
					policyNegotiationPointComponentType: "test-pnp",
					federatedCatalogueComponentType: "test-fedcat-resolve-provider",
					trustComponentType: "test-trust-resolve-provider-as-provider",
					transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
					config: {
						dataPlanePath: "data-plane/data"
					}
				});
				await providerService.startTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferStartMessage",
						consumerPid: transferProcess.consumerPid,
						providerPid: transferProcess.providerPid
					},
					"valid-trust-payload"
				);
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Verify the entity was stored
			const storedEntity = await transferProcessStorage.get("consumer-pid-push-001", "consumerPid");
			expect(storedEntity).toBeDefined();
			if (!storedEntity) {
				throw new Error("Entity not found");
			}

			// Pass a valid trust payload (trust verification handles authentication)
			const context = await service.resolveProviderPid(providerPid, "valid-trust-payload");

			expect(context).toBeDefined();
			expect(context.consumerPid).toBe("consumer-pid-push-001");
			expect(context.providerPid).toBe(providerPid);
			// datasetId is now the full URN (DCAT-compliant, not parsed)
			expect(context.datasetId).toBe("urn:uuid:dataset-push-123");
			expect(context.agreement).toBeDefined();
			expect(context.agreement["@id"]).toBe("agreement-push-001");
			expect(context.agreement["@type"]).toBe("Agreement");
			expect(context.providerIdentity).toBe("did:iota:provider-node-xyz");
			expect(context.consumerIdentity).toBe("did:iota:consumer-node-abc");
			expect(context.dataAddress).toBeDefined();
			expect(context.dataAddress?.endpoint).toBe("https://consumer.example.com/dataspace/inbox");
			expect(context.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
		});

		test("should throw NotFoundError for non-existent providerPid", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			await expect(
				service.resolveProviderPid("non-existent-provider-pid", "some-token")
			).rejects.toThrow(NotFoundError);
		});

		test("should throw UnauthorizedError when trust verification fails", async () => {
			// Register a failing trust component for provider tests
			ComponentFactory.register("test-trust-failing-provider", () =>
				createFailingMockTrustComponent()
			);

			// First create a transfer with a working trust service
			const workingService = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-trust-fail",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Create transfer process
			const requestResponse = await workingService.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push-trust-fail",
					agreementId: "agreement-push-trust-fail",
					format: DataspaceTransferFormat.HttpDataPush,
					callbackAddress: "https://consumer.example.com/callback"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;

				// Start the transfer as provider (startTransfer requires provider identity)
				const providerStartService = new DataspaceControlPlaneService({
					policyAdministrationPointComponentType: "test-pap-resolve-provider",
					policyNegotiationPointComponentType: "test-pnp",
					federatedCatalogueComponentType: "test-fedcat-resolve-provider",
					trustComponentType: "test-trust-resolve-provider-as-provider",
					transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
					config: { dataPlanePath: "data-plane/data" }
				});
				await providerStartService.startTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferStartMessage",
						consumerPid: transferProcess.consumerPid,
						providerPid: transferProcess.providerPid
					},
					"valid-trust-payload"
				);
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Now create service with failing trust component
			const failingService = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-failing-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// TrustHelper.verifyTrust should throw UnauthorizedError when verified: false
			await expect(
				failingService.resolveProviderPid(providerPid, "any-token")
			).rejects.toMatchObject({ name: "UnauthorizedError" });

			// Cleanup
			ComponentFactory.unregister("test-trust-failing-provider");
		});

		test("should throw GeneralError if Transfer Process is TERMINATED", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-terminate",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push-terminate",
					agreementId: "agreement-push-terminate",
					format: DataspaceTransferFormat.HttpDataPush,
					callbackAddress: "https://consumer.example.com/callback"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Verify the entity was stored
			const storedEntity = await transferProcessStorage.get(
				"consumer-pid-push-terminate",
				"consumerPid"
			);
			expect(storedEntity).toBeDefined();
			if (!storedEntity) {
				throw new Error("Entity not found");
			}

			// Terminate the process
			await service.terminateTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferTerminationMessage",
					consumerPid: "consumer-pid-push-terminate",
					providerPid
				},
				"valid-trust-payload"
			);

			// Then try to resolve it - pass valid trust payload to test TERMINATED state check
			await expect(service.resolveProviderPid(providerPid, "valid-trust-payload")).rejects.toThrow(
				GeneralError
			);
		});

		test("should throw GeneralError when organization context is missing", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-no-org",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push-no-org",
					agreementId: "agreement-push-no-org",
					format: DataspaceTransferFormat.HttpDataPush,
					callbackAddress: "https://consumer.example.com/callback"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Mock ContextIdStore to return undefined organization
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant"
				// Organization is missing
			});

			// Pass the correct token format
			await expect(
				service.resolveProviderPid(providerPid, "mock-jwt-consumer-pid-push-no-org")
			).rejects.toMatchObject({ name: "GeneralError" });
		});

		test("should throw UnauthorizedError when Agreement assigner doesn't match organization", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement with VALID assigner (matching mocked org) for requestTransfer
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-mismatch",
				assigner: "did:iota:provider-node-xyz", // Matches mocked org for requestTransfer
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Create transfer process first (with valid assigner)
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push-mismatch",
					agreementId: "agreement-push-mismatch",
					format: DataspaceTransferFormat.HttpDataPush,
					callbackAddress: "https://consumer.example.com/callback"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Now change context to a different organization to trigger the mismatch
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant",
				[ContextIdKeys.Organization]: "did:iota:different-provider", // Different from Agreement assigner
				[ContextIdKeys.User]: "did:iota:test-user"
			});

			// Pass the correct token format
			await expect(
				service.resolveProviderPid(providerPid, "mock-jwt-consumer-pid-push-mismatch")
			).rejects.toMatchObject({ name: "UnauthorizedError" });
		});

		test("should throw UnauthorizedError when Agreement assignee doesn't match consumer identity", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement - this will set consumerIdentity to "did:iota:consumer-node-abc"
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-assignee",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Create transfer process - this stores consumerIdentity from Agreement
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push-assignee",
					agreementId: "agreement-push-assignee",
					format: DataspaceTransferFormat.HttpDataPush,
					callbackAddress: "https://consumer.example.com/callback"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;

				// Start the transfer as provider (startTransfer requires provider identity)
				const providerStartService = new DataspaceControlPlaneService({
					policyAdministrationPointComponentType: "test-pap-resolve-provider",
					policyNegotiationPointComponentType: "test-pnp",
					federatedCatalogueComponentType: "test-fedcat-resolve-provider",
					trustComponentType: "test-trust-resolve-provider-as-provider",
					transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
					config: { dataPlanePath: "data-plane/data" }
				});
				await providerStartService.startTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferStartMessage",
						consumerPid: transferProcess.consumerPid,
						providerPid: transferProcess.providerPid
					},
					"valid-trust-payload"
				);
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Now update the Agreement in PAP to have a different assignee
			// This simulates the case where Agreement assignee doesn't match stored consumerIdentity
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-assignee",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:another-consumer", // Different from stored consumerIdentity
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Pass the correct token format
			await expect(
				service.resolveProviderPid(providerPid, "mock-jwt-consumer-pid-push-assignee")
			).rejects.toMatchObject({ name: "UnauthorizedError" });
		});
	});

	describe("Complete Workflow Test", () => {
		test("should handle complete Transfer Process lifecycle", async () => {
			// Setup PAP, FedCat, Trust and ContextIdStore for this test
			const workflowMockPap = new MockPolicyAdministrationPointComponent();
			const workflowMockFedCat = new MockFederatedCatalogueComponent();
			ComponentFactory.register("test-pap-workflow", () => workflowMockPap);
			ComponentFactory.register("test-fedcat-workflow", () => workflowMockFedCat);
			ComponentFactory.register("test-trust-workflow", () => createMockTrustComponent());
			ComponentFactory.register("test-trust-workflow-provider", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			// Pin context to single-tenant shape so the composite
			// matches the bare-DID assigner fixture below.
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:provider-node-xyz",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
				[ContextIdKeys.User]: "did:iota:test-user",
				[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
			});

			// Add agreement for the workflow test
			workflowMockPap.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "workflow-agreement-123",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-workflow-123",
				permission: [{ action: "read" }]
			});

			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-workflow",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-workflow",
				trustComponentType: "test-trust-workflow",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Initiate Transfer (Consumer side)
			const initiateRequest: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: "workflow-test-consumer-pid",
				agreementId: "workflow-agreement-123",
				callbackAddress: "https://consumer.example.com/callback",
				format: "HttpData-PULL"
			};

			const initiateResponse = await service.requestTransfer(
				initiateRequest,
				"valid-trust-payload"
			);
			expect(initiateResponse["@type"]).not.toBe(
				DataspaceProtocolTransferProcessTypes.TransferError
			);
			const initiateProcess = initiateResponse;
			expect(initiateProcess.consumerPid).toBe("workflow-test-consumer-pid");

			// Get Transfer Process state
			const getResponse1 = await service.getTransferProcess(
				"workflow-test-consumer-pid",
				"valid-trust-payload"
			);
			expect(getResponse1.consumerPid).toBe("workflow-test-consumer-pid");

			// Start Transfer (Provider side - requires provider identity)
			const providerService = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-workflow",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-workflow",
				trustComponentType: "test-trust-workflow-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				config: { dataPlanePath: "data-plane/data" }
			});
			const startMessage: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: initiateResponse.consumerPid,
				providerPid: initiateResponse.providerPid
			};

			const startResponse = await providerService.startTransfer(
				startMessage,
				"valid-trust-payload"
			);
			if (startResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferStartMessage = startResponse;
				expect(transferStartMessage.consumerPid).toBe("workflow-test-consumer-pid");
				expect(transferStartMessage["@type"]).toBe(
					DataspaceProtocolTransferProcessTypes.TransferStartMessage
				);
			}

			// Resolve consumerPid (DSC internal API)
			// Verify the entity was stored
			const storedEntity = await transferProcessStorage.get(
				"workflow-test-consumer-pid",
				"consumerPid"
			);
			expect(storedEntity).toBeDefined();
			if (!storedEntity) {
				throw new Error("Entity not found");
			}

			// Pass a valid trust payload (trust verification handles authentication)
			const context = await service.resolveConsumerPid(
				"workflow-test-consumer-pid",
				"valid-trust-payload"
			);
			expect(context.datasetId).toBeDefined();
			expect(context.agreement).toBeDefined();
			expect(context.agreement["@id"]).toBe("workflow-agreement-123");

			// Complete Transfer
			const completeMessage: IDataspaceProtocolTransferCompletionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferCompletionMessage",
				consumerPid: initiateResponse.consumerPid,
				providerPid: initiateResponse.providerPid
			};

			const completeResponse = await service.completeTransfer(
				completeMessage,
				"valid-trust-payload"
			);
			if (completeResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = completeResponse;
				expect(transferProcess.consumerPid).toBe("workflow-test-consumer-pid");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.COMPLETED);
			}

			// Get final state
			const getResponse2 = await service.getTransferProcess(
				"workflow-test-consumer-pid",
				"valid-trust-payload"
			);
			if (getResponse2["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = getResponse2;
				expect(transferProcess.consumerPid).toBe("workflow-test-consumer-pid");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.COMPLETED);
			}

			// Cleanup
			ComponentFactory.unregister("test-pap-workflow");
			ComponentFactory.unregister("test-fedcat-workflow");
			ComponentFactory.unregister("test-trust-workflow");
			ComponentFactory.unregister("test-trust-workflow-provider");
		});
	});

	describe("Federated Catalogue Integration", () => {
		test("should validate dataset exists in catalog during transfer initiation", async () => {
			// Setup: Mock Federated Catalogue component
			// NOTE: Now expects full URN as datasetId (not short ID)
			const mockCatalog = {
				get: async (datasetId: string) => {
					if (datasetId === "urn:uuid:valid-dataset-123") {
						return {
							"@context": "https://www.w3.org/ns/dcat",
							"@id": "urn:uuid:valid-dataset-123",
							"@type": "dcat:Dataset",
							"dcterms:title": "Test Dataset",
							"dcat:distribution": [{ "dcterms:format": "HttpData-PULL" }],
							"odrl:hasPolicy": [
								{
									"@type": "odrl:Offer",
									"@id": "agreement-test-catalog",
									assigner: "urn:uuid:provider-123",
									permission: [
										{
											action: "use"
										}
									]
								}
							]
						};
					}
					// Return CatalogError instead of throwing
					return {
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": DataspaceProtocolCatalogTypes.CatalogError,
						code: "NotFoundError:datasetNotFound"
					} as IDataspaceProtocolCatalogError;
				},
				className: () => "MockFederatedCatalogue"
			};

			// Setup: Mock PAP component
			const mockPapCatalog = {
				getAgreement: async (agreementId: string) => {
					if (agreementId === "agreement-test-catalog") {
						return {
							"@type": "Agreement",
							"@id": "agreement-test-catalog",
							status: "active",
							assignee: "urn:uuid:consumer-123",
							assigner: "urn:uuid:provider-123",
							target: "urn:uuid:valid-dataset-123",
							permission: [
								{
									action: "use"
								}
							]
						};
					}
					throw new NotFoundError("MockPAP", "agreementNotFound", agreementId);
				},
				className: () => "MockPolicyAdministrationPoint"
			};

			// Register mocks with ComponentFactory (TWIN pattern)
			ComponentFactory.register("mock-pap-catalog-test", () => mockPapCatalog);
			ComponentFactory.register("mock-fedcat-test", () => mockCatalog);
			ComponentFactory.register("mock-trust-catalog-test", () =>
				createMockTrustComponent("urn:uuid:consumer-123")
			);

			// Create service with component types
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "mock-pap-catalog-test",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "mock-fedcat-test",
				trustComponentType: "mock-trust-catalog-test",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Initiate transfer
			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: "consumer-pid-catalog-test",
				agreementId: "agreement-test-catalog",
				callbackAddress: "https://callback.example.com",
				format: "HttpData-PULL"
			};

			const response = await service.requestTransfer(request, "valid-trust-payload");

			// Verify transfer was created successfully
			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const transferProcess = response;
			expect(transferProcess.consumerPid).toBe("consumer-pid-catalog-test");
			expect((transferProcess as IDataspaceProtocolTransferProcess).state).toBe(
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);

			// Cleanup
			ComponentFactory.unregister("mock-pap-catalog-test");
			ComponentFactory.unregister("mock-fedcat-test");
			ComponentFactory.unregister("mock-trust-catalog-test");
		});

		test("should throw NotFoundError if dataset not in catalog", async () => {
			// Setup: Mock Federated Catalogue that returns CatalogError
			const mockCatalog = {
				get: async (datasetId: string) =>
					// Return CatalogError instead of throwing
					({
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": DataspaceProtocolCatalogTypes.CatalogError,
						code: "NotFoundError:datasetNotFound"
					}) as IDataspaceProtocolCatalogError,
				className: () => "MockFederatedCatalogue"
			};

			// Setup: Mock PAP component
			const mockPapNotFound = {
				getAgreement: async (agreementId: string) => {
					if (agreementId === "agreement-missing-dataset") {
						return {
							"@type": "Agreement",
							"@id": "agreement-missing-dataset",
							status: "active",
							assignee: "urn:uuid:consumer-123",
							assigner: "urn:uuid:provider-123",
							target: "urn:uuid:missing-dataset-456",
							permission: [
								{
									action: "use"
								}
							]
						};
					}
					throw new NotFoundError("MockPAP", "agreementNotFound", agreementId);
				},
				className: () => "MockPolicyAdministrationPoint"
			};

			// Register mocks with ComponentFactory
			ComponentFactory.register("mock-pap-notfound-test", () => mockPapNotFound);
			ComponentFactory.register("mock-fedcat-notfound-test", () => mockCatalog);
			ComponentFactory.register("mock-trust-notfound-test", () =>
				createMockTrustComponent("urn:uuid:consumer-123")
			);

			// Create service with component types
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "mock-pap-notfound-test",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "mock-fedcat-notfound-test",
				trustComponentType: "mock-trust-notfound-test",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Initiate transfer
			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: "consumer-pid-missing-dataset",
				agreementId: "agreement-missing-dataset",
				callbackAddress: "https://callback.example.com",
				format: "HttpData-PULL"
			};

			// Should return TransferError (DSP-compliant) instead of throwing
			const result = await service.requestTransfer(request, "valid-trust-payload");
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const transferError = result as IDataspaceProtocolTransferError;
			// Semantic error code format: "ErrorName:message"
			expect(transferError.code).toMatch(/^NotFoundError:/);
			expect(transferError.consumerPid).toBe("consumer-pid-missing-dataset");
			expect(transferError.providerPid).toBeDefined();
			expect(transferError.reason).toBeDefined();
			expect(Is.array(transferError.reason)).toBe(true);
			// reason now contains flattened error objects (following Federated Catalogue pattern)
			if (transferError.reason && transferError.reason.length > 0) {
				const firstError = transferError.reason[0] as { name?: string; message?: string };
				expect(firstError.name).toBe("NotFoundError");
				expect(firstError.message).toContain("datasetNotInCatalog");
			}

			// Cleanup
			ComponentFactory.unregister("mock-pap-notfound-test");
			ComponentFactory.unregister("mock-fedcat-notfound-test");
			ComponentFactory.unregister("mock-trust-notfound-test");
		});

		test("should throw GeneralError if Agreement doesn't match any Catalog Offer", async () => {
			// Setup: Mock Federated Catalogue with different offer
			// NOTE: Now expects full URN as datasetId (not short ID)
			const mockCatalog = {
				get: async (datasetId: string) => {
					if (datasetId === "urn:uuid:dataset-mismatch-123") {
						return {
							"@context": "https://www.w3.org/ns/dcat",
							"@id": "urn:uuid:dataset-mismatch-123",
							"@type": "dcat:Dataset",
							"dcterms:title": "Test Dataset",
							"odrl:hasPolicy": [
								{
									"@type": "odrl:Offer",
									"@id": "offer-different-123",
									assigner: "urn:uuid:provider-123",
									permission: [
										{
											action: "use"
										}
									]
								}
							]
						};
					}
					// Return CatalogError instead of throwing
					return {
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": DataspaceProtocolCatalogTypes.CatalogError,
						code: "NotFoundError:datasetNotFound"
					} as IDataspaceProtocolCatalogError;
				},
				className: () => "MockFederatedCatalogue"
			};

			// Setup: Mock PAP with Agreement that doesn't match Offer
			const mockPapMismatch = {
				getAgreement: async (agreementId: string) => {
					if (agreementId === "agreement-mismatch-123") {
						return {
							"@type": "Agreement",
							"@id": "agreement-mismatch-123",
							status: "active",
							assignee: "urn:uuid:consumer-123",
							assigner: "urn:uuid:provider-different",
							target: "urn:uuid:dataset-mismatch-123",
							permission: [
								{
									action: "use"
								}
							]
						};
					}
					throw new NotFoundError("MockPAP", "agreementNotFound", agreementId);
				},
				className: () => "MockPolicyAdministrationPoint"
			};

			// Register mocks with ComponentFactory
			ComponentFactory.register("mock-pap-mismatch-test", () => mockPapMismatch);
			ComponentFactory.register("mock-fedcat-mismatch-test", () => mockCatalog);
			ComponentFactory.register("mock-trust-mismatch-test", () =>
				createMockTrustComponent("urn:uuid:consumer-123")
			);

			// Create service with component types
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "mock-pap-mismatch-test",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "mock-fedcat-mismatch-test",
				trustComponentType: "mock-trust-mismatch-test",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Initiate transfer
			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: "consumer-pid-mismatch",
				agreementId: "agreement-mismatch-123",
				callbackAddress: "https://callback.example.com",
				format: "HttpData-PULL"
			};

			// Should return TransferError with specific error key
			const result = await service.requestTransfer(request, "valid-trust-payload");

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const transferError = result as IDataspaceProtocolTransferError;
			expect(transferError.code).toMatch(/GeneralError:/);
			expect(transferError.reason).toBeDefined();
			if (transferError.reason && transferError.reason.length > 0) {
				const firstError = transferError.reason[0] as { message?: string };
				expect(firstError.message).toContain("agreementNotMatchingOffer");
			}

			// Cleanup
			ComponentFactory.unregister("mock-pap-mismatch-test");
			ComponentFactory.unregister("mock-fedcat-mismatch-test");
			ComponentFactory.unregister("mock-trust-mismatch-test");
		});

		test("should reject transfer when requested format is not in dataset distributions", async () => {
			const mockCatalogWithDistributions = {
				get: async (datasetId: string) => {
					if (datasetId === "urn:uuid:dataset-format-check") {
						return {
							"@context": [DataspaceProtocolContexts.JsonLdContext],
							"@type": "Dataset",
							"@id": "urn:uuid:dataset-format-check",
							"dcterms:title": "Dataset with distributions",
							distribution: [
								{
									"@type": "Distribution",
									format: "HttpData-PULL",
									accessService: "https://provider.example.com/api"
								}
							],
							hasPolicy: [
								{
									"@type": "odrl:Offer",
									"@id": "offer-format-check",
									assigner: "urn:uuid:provider-123",
									permission: [{ action: "use" }]
								}
							]
						};
					}
					return {
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": DataspaceProtocolCatalogTypes.CatalogError,
						code: "NotFoundError:datasetNotFound"
					} as IDataspaceProtocolCatalogError;
				},
				className: () => "MockFederatedCatalogue"
			};

			const mockPapFormatCheck = {
				getAgreement: async (agreementId: string) => {
					if (agreementId === "agreement-format-check") {
						return {
							"@type": "Agreement",
							"@id": "agreement-format-check",
							status: "active",
							assignee: "urn:uuid:consumer-123",
							assigner: "urn:uuid:provider-123",
							target: "urn:uuid:dataset-format-check",
							permission: [{ action: "use" }]
						};
					}
					throw new NotFoundError("MockPAP", "agreementNotFound", agreementId);
				},
				className: () => "MockPolicyAdministrationPoint"
			};

			ComponentFactory.register("mock-pap-format-check", () => mockPapFormatCheck);
			ComponentFactory.register("mock-fedcat-format-check", () => mockCatalogWithDistributions);
			ComponentFactory.register("mock-trust-format-check", () =>
				createMockTrustComponent("urn:uuid:consumer-123")
			);

			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "mock-pap-format-check",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "mock-fedcat-format-check",
				trustComponentType: "mock-trust-format-check",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			const result = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-invalid-format",
					agreementId: "agreement-format-check",
					callbackAddress: "https://callback.example.com",
					format: "HttpData-PUSH"
				},
				"valid-trust-payload"
			);

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const transferError = result as IDataspaceProtocolTransferError;
			expect(transferError.code).toMatch(/^GeneralError:/);
			expect(transferError.consumerPid).toBe("consumer-pid-invalid-format");
			if (transferError.reason && transferError.reason.length > 0) {
				const firstError = transferError.reason[0] as { message?: string };
				expect(firstError.message).toContain("transferFormatNotInDistributions");
			}

			ComponentFactory.unregister("mock-pap-format-check");
			ComponentFactory.unregister("mock-fedcat-format-check");
			ComponentFactory.unregister("mock-trust-format-check");
		});

		test("should accept transfer when requested format matches a dataset distribution", async () => {
			const mockCatalogWithMatchingDist = {
				get: async (datasetId: string) => {
					if (datasetId === "urn:uuid:dataset-format-match") {
						return {
							"@context": [DataspaceProtocolContexts.JsonLdContext],
							"@type": "Dataset",
							"@id": "urn:uuid:dataset-format-match",
							"dcterms:title": "Dataset with matching distribution",
							distribution: [
								{
									"@type": "Distribution",
									format: "HttpData-PULL",
									accessService: "https://provider.example.com/api"
								}
							],
							hasPolicy: [
								{
									"@type": "odrl:Offer",
									"@id": "offer-format-match",
									assigner: "urn:uuid:provider-123",
									permission: [{ action: "use" }]
								}
							]
						};
					}
					return {
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": DataspaceProtocolCatalogTypes.CatalogError,
						code: "NotFoundError:datasetNotFound"
					} as IDataspaceProtocolCatalogError;
				},
				className: () => "MockFederatedCatalogue"
			};

			const mockPapFormatMatch = {
				getAgreement: async (agreementId: string) => {
					if (agreementId === "agreement-format-match") {
						return {
							"@type": "Agreement",
							"@id": "agreement-format-match",
							status: "active",
							assignee: "urn:uuid:consumer-123",
							assigner: "urn:uuid:provider-123",
							target: "urn:uuid:dataset-format-match",
							permission: [{ action: "use" }]
						};
					}
					throw new NotFoundError("MockPAP", "agreementNotFound", agreementId);
				},
				className: () => "MockPolicyAdministrationPoint"
			};

			ComponentFactory.register("mock-pap-format-match", () => mockPapFormatMatch);
			ComponentFactory.register("mock-fedcat-format-match", () => mockCatalogWithMatchingDist);
			ComponentFactory.register("mock-trust-format-match", () =>
				createMockTrustComponent("urn:uuid:consumer-123")
			);

			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "mock-pap-format-match",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "mock-fedcat-format-match",
				trustComponentType: "mock-trust-format-match",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			const result = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-valid-format",
					agreementId: "agreement-format-match",
					callbackAddress: "https://callback.example.com",
					format: "HttpData-PULL"
				},
				"valid-trust-payload"
			);

			expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			expect(result.consumerPid).toBe("consumer-pid-valid-format");
			expect((result as IDataspaceProtocolTransferProcess).state).toBe(
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);

			ComponentFactory.unregister("mock-pap-format-match");
			ComponentFactory.unregister("mock-fedcat-format-match");
			ComponentFactory.unregister("mock-trust-format-match");
		});
	});

	describe("Contract Negotiation - Catalog Integration", () => {
		test("should throw NotFoundError when dataset not found in catalog", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(
				service.negotiateAgreement(
					"dataset-does-not-exist",
					"offer-does-not-exist",
					"http://provider.example.com",
					"valid-trust-payload"
				)
			).rejects.toMatchObject({
				name: "NotFoundError",
				message: expect.stringContaining("datasetNotFoundInCatalog")
			});
		});

		test("should throw GeneralError when dataset has no offers", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(
				service.negotiateAgreement(
					"dataset-no-offers",
					"any-offer-id",
					"http://provider.example.com",
					"valid-trust-payload"
				)
			).rejects.toMatchObject({
				name: "GeneralError",
				message: expect.stringContaining("datasetHasNoOffers")
			});
		});

		test("should throw NotFoundError when specific offer not found in dataset", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(
				service.negotiateAgreement(
					"urn:uuid:dataset-negotiation-valid",
					"offer-wrong-id",
					"http://provider.example.com",
					"valid-trust-payload"
				)
			).rejects.toMatchObject({
				name: "NotFoundError",
				message: expect.stringContaining("offerNotFoundInDataset")
			});
		});

		test("should find offer in dataset with multiple offers", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp);

			const result = await service.negotiateAgreement(
				"dataset-multi-offers",
				"offer-multi-2",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(result).toBeDefined();
			expect(result.negotiationId).toBe("test-negotiation-id");
			expect(mockPnp.sendRequestToProvider).toHaveBeenCalledWith(
				"http://provider.example.com",
				"dataspace-control-plane-requester",
				"offer-multi-2",
				"https://test-origin.com"
			);
		});

		test("should successfully look up dataset by datasetId", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp);

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(result).toBeDefined();
			expect(result.negotiationId).toBe("test-negotiation-id");
		});

		test("should successfully initiate negotiation with valid offer from catalog", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp);

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(result).toBeDefined();
			expect(result.negotiationId).toBe("test-negotiation-id");
			expect(mockPnp.sendRequestToProvider).toHaveBeenCalledWith(
				"http://provider.example.com",
				"dataspace-control-plane-requester",
				"offer-negotiation-valid",
				"https://test-origin.com"
			);
		});

		test("should always use hardcoded requester type", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp);

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(mockPnp.sendRequestToProvider).toHaveBeenCalledWith(
				"http://provider.example.com",
				"dataspace-control-plane-requester",
				"offer-negotiation-valid",
				"https://test-origin.com"
			);
		});
	});

	describe("Contract Negotiation - Callback Pattern", () => {
		test("should return negotiationId immediately without waiting for callbacks", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp, "my-negotiation-123");

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(result).toBeDefined();
			expect(result.negotiationId).toBe("my-negotiation-123");
		});

		test("should track negotiation in policy requester after initiation", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp, "tracked-negotiation-456");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			// Verify PNP sendRequestToProvider was called
			expect(mockPnp.sendRequestToProvider).toHaveBeenCalledWith(
				"http://provider.example.com",
				"dataspace-control-plane-requester",
				"offer-negotiation-valid",
				"https://test-origin.com"
			);
		});
	});

	describe("Contract Negotiation - Callback Sequence", () => {
		test("should invoke onStateChanged with OFFERED when offer() fires", async () => {
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-001");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			// Simulate PNP calling offer() on the requester
			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			const mockOffer: IDataspaceProtocolOffer = {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Offer",
				"@id": "test-offer-uid",
				assigner: "did:iota:provider",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolOffer;

			const accepted = await requester.offer("cb-neg-001", mockOffer);

			expect(accepted).toBe(true);
			expect(callbackSpy.onStateChanged).toHaveBeenCalledWith(
				"cb-neg-001",
				DataspaceProtocolContractNegotiationStateType.OFFERED,
				{ offer: mockOffer }
			);
			expect(callbackSpy.onFinalized).not.toHaveBeenCalled();
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
		});

		test("should invoke onStateChanged with AGREED when agreement() fires", async () => {
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-002");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			const mockAgreement: IDataspaceProtocolAgreement = {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "test-agreement-uid",
				assigner: "did:iota:provider",
				assignee: "did:iota:consumer",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolAgreement;

			const accepted = await requester.agreement("cb-neg-002", mockAgreement);

			expect(accepted).toBe(true);
			expect(callbackSpy.onStateChanged).toHaveBeenCalledWith(
				"cb-neg-002",
				DataspaceProtocolContractNegotiationStateType.AGREED,
				{ agreement: mockAgreement }
			);
			expect(callbackSpy.onFinalized).not.toHaveBeenCalled();
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
		});

		test("should invoke onFinalized with agreementId when finalised() fires after agreement", async () => {
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-003");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			const mockAgreement: IDataspaceProtocolAgreement = {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "final-agreement-uid",
				assigner: "did:iota:provider",
				assignee: "did:iota:consumer",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolAgreement;

			// Simulate the full callback sequence: offer → agreement → finalised
			await requester.offer("cb-neg-003", {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Offer",
				"@id": "offer-uid",
				assigner: "did:iota:provider",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolOffer);

			await requester.agreement("cb-neg-003", mockAgreement);
			await requester.finalised("cb-neg-003");

			expect(callbackSpy.onFinalized).toHaveBeenCalledWith("cb-neg-003", "final-agreement-uid");
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
		});

		test("should invoke onFailed when terminated() fires", async () => {
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-004");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			await requester.terminated("cb-neg-004");

			expect(callbackSpy.onFailed).toHaveBeenCalledWith(
				"cb-neg-004",
				"negotiationTerminatedByProvider"
			);
			expect(callbackSpy.onFinalized).not.toHaveBeenCalled();
		});

		test("should invoke onFailed when finalised() fires without prior agreement", async () => {
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-005");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			// Skip agreement() and go straight to finalised()
			await requester.finalised("cb-neg-005");

			expect(callbackSpy.onFailed).toHaveBeenCalledWith(
				"cb-neg-005",
				"negotiationFinalizedNoAgreement"
			);
			expect(callbackSpy.onFinalized).not.toHaveBeenCalled();
		});

		test("should remove negotiation from tracking after finalised()", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-006");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			expect(requester.getActiveNegotiations().has("cb-neg-006")).toBe(true);

			await requester.agreement("cb-neg-006", {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-cleanup",
				assigner: "did:iota:provider",
				assignee: "did:iota:consumer",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolAgreement);

			await requester.finalised("cb-neg-006");

			expect(requester.getActiveNegotiations().has("cb-neg-006")).toBe(false);
		});

		test("should remove negotiation from tracking after terminated()", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-007");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			expect(requester.getActiveNegotiations().has("cb-neg-007")).toBe(true);

			await requester.terminated("cb-neg-007");

			expect(requester.getActiveNegotiations().has("cb-neg-007")).toBe(false);
		});

		test("should invoke full callback sequence in correct order", async () => {
			const callOrder: string[] = [];
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockImplementation(async (negId, state) => {
					callOrder.push(`stateChanged:${state}`);
				}),
				onFinalized: vi.fn().mockImplementation(async () => {
					callOrder.push("finalized");
				}),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-008");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			await requester.offer("cb-neg-008", {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Offer",
				"@id": "seq-offer",
				assigner: "did:iota:provider",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolOffer);

			await requester.agreement("cb-neg-008", {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "seq-agreement",
				assigner: "did:iota:provider",
				assignee: "did:iota:consumer",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolAgreement);

			await requester.finalised("cb-neg-008");

			expect(callOrder).toEqual([
				"stateChanged:OFFERED",
				"stateChanged:AGREED",
				"stateChanged:FINALIZED",
				"finalized"
			]);
		});

		test("should fan out callbacks to multiple registered listeners", async () => {
			const callbackSpy1: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};
			const callbackSpy2: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("listener-a", callbackSpy1);
			service.registerNegotiationCallback("listener-b", callbackSpy2);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-multi-001");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			await requester.terminated("cb-neg-multi-001");

			expect(callbackSpy1.onFailed).toHaveBeenCalledWith(
				"cb-neg-multi-001",
				"negotiationTerminatedByProvider"
			);
			expect(callbackSpy2.onFailed).toHaveBeenCalledWith(
				"cb-neg-multi-001",
				"negotiationTerminatedByProvider"
			);
		});

		test("should not invoke callback after unregisterNegotiationCallback", async () => {
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("removable", callbackSpy);
			service.unregisterNegotiationCallback("removable");

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-unreg-001");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			await requester.terminated("cb-neg-unreg-001");

			expect(callbackSpy.onStateChanged).not.toHaveBeenCalled();
			expect(callbackSpy.onFinalized).not.toHaveBeenCalled();
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
		});

		test("should only unregister the specified key, leaving other callbacks active", async () => {
			const callbackSpy1: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};
			const callbackSpy2: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("keep", callbackSpy1);
			service.registerNegotiationCallback("remove", callbackSpy2);
			service.unregisterNegotiationCallback("remove");

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-app-001");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			await requester.terminated("cb-neg-app-001");

			expect(callbackSpy1.onFailed).toHaveBeenCalledWith(
				"cb-neg-app-001",
				"negotiationTerminatedByProvider"
			);
			expect(callbackSpy2.onFailed).not.toHaveBeenCalled();
		});
	});

	describe("Contract Negotiation - Implicit Trust", () => {
		// The implicit-trust shortcut requires the provider endpoint to resolve to a local
		// context whose Organization matches the caller (in addition to the matching trust
		// identity). Model that by making getLocalOriginContext return the local org here.
		beforeEach(() => {
			ComponentFactory.register("platform", () =>
				createSingleTenantPlatformComponent("did:iota:provider-node-xyz")
			);
		});

		test("should NOT shortcut to implicit trust for a cross-org provider whose endpoint is not local, even with a self-issued token", async () => {
			// Regression for the cross-org bug: on the consumer's own control plane the trust
			// identity is always == organizationId, so it cannot be the sole discriminant. When
			// the provider endpoint does not resolve to this node (getLocalOriginContext ->
			// undefined), the negotiation MUST go to the provider, not become a local agreement.
			ComponentFactory.register("test-trust", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);
			// Provider endpoint is NOT local to this node (override the block's local-origin mock).
			ComponentFactory.register("platform", () => createSingleTenantPlatformComponent());
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			mockPnpToReturnNegotiationId(mockPnp);
			const sendSpy = vi.spyOn(mockPnp, "sendRequestToProvider");

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(result.negotiationId).toBe("test-negotiation-id");
			expect(result.agreementId).toBeUndefined();
			expect(sendSpy).toHaveBeenCalled();
		});

		test("should return agreementId when caller identity matches organization (new agreement)", async () => {
			ComponentFactory.register("test-trust", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			mockPap.clearAgreements();

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(result.agreementId).toBeDefined();
			expect(result.negotiationId).toBeUndefined();
		});

		test("should not call sendRequestToProvider for implicit trust negotiations", async () => {
			ComponentFactory.register("test-trust", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			mockPap.clearAgreements();

			const sendSpy = vi.spyOn(mockPnp, "sendRequestToProvider");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(sendSpy).not.toHaveBeenCalled();
		});

		test("should call onFinalized(undefined, agreementId) when creating a new implicit agreement", async () => {
			ComponentFactory.register("test-trust", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			mockPap.clearAgreements();

			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};
			service.registerNegotiationCallback("implicit-trust-test", callbackSpy);

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(callbackSpy.onFinalized).toHaveBeenCalledWith(undefined, result.agreementId);
			expect(callbackSpy.onStateChanged).not.toHaveBeenCalled();
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
		});

		test("should call onFinalized(undefined, agreementId) when reusing an existing implicit agreement", async () => {
			ComponentFactory.register("test-trust", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			mockPap.clearAgreements();
			mockPap.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "implicit-reuse-agreement-1",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:provider-node-xyz",
				target: "urn:uuid:dataset-negotiation-valid",
				permission: [{ action: "use" }]
			} as unknown as IDataspaceProtocolAgreement);

			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};
			service.registerNegotiationCallback("implicit-reuse-test", callbackSpy);

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(result.agreementId).toBe("implicit-reuse-agreement-1");
			expect(result.negotiationId).toBeUndefined();
			expect(callbackSpy.onFinalized).toHaveBeenCalledWith(undefined, "implicit-reuse-agreement-1");
		});

		test("should not create a new agreement when one already exists", async () => {
			ComponentFactory.register("test-trust", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			mockPap.clearAgreements();
			mockPap.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "implicit-existing-agreement",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:provider-node-xyz",
				target: "urn:uuid:dataset-negotiation-valid",
				permission: [{ action: "use" }]
			} as unknown as IDataspaceProtocolAgreement);

			const createSpy = vi.spyOn(mockPap, "create");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(createSpy).not.toHaveBeenCalled();
		});

		test("should fan out onFinalized to multiple callbacks for implicit trust", async () => {
			ComponentFactory.register("test-trust", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			mockPap.clearAgreements();

			const callbackSpy1: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};
			const callbackSpy2: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};
			service.registerNegotiationCallback("cb-a", callbackSpy1);
			service.registerNegotiationCallback("cb-b", callbackSpy2);

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(callbackSpy1.onFinalized).toHaveBeenCalledWith(undefined, result.agreementId);
			expect(callbackSpy2.onFinalized).toHaveBeenCalledWith(undefined, result.agreementId);
		});

		test("should still return agreementId if a callback throws during implicit trust", async () => {
			ComponentFactory.register("test-trust", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			mockPap.clearAgreements();

			const throwingCallback: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockRejectedValue(new Error("callback boom")),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};
			service.registerNegotiationCallback("throwing-cb", throwingCallback);

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(result.agreementId).toBeDefined();
			expect(result.negotiationId).toBeUndefined();
		});

		test("should not call implicit trust callbacks for external negotiations", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};
			service.registerNegotiationCallback("external-test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "external-neg-001");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(callbackSpy.onFinalized).not.toHaveBeenCalled();
		});
	});

	describe("Contract Negotiation - Cross-Org Agreement Reuse", () => {
		// These tests exercise the cross-org path (provider endpoint is not local).
		// The default platform component returns undefined from getLocalOriginContext, so the
		// implicit-trust shortcut is never taken and findExistingAgreement runs instead.

		test("should reuse an existing agreement for the same offer and organizations instead of starting a new negotiation", async () => {
			mockPap.clearAgreements();
			mockPap.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "cross-org-existing-agreement",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:provider-node-xyz",
				target: "urn:uuid:dataset-negotiation-valid",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolAgreement);
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			const sendSpy = vi.spyOn(mockPnp, "sendRequestToProvider");

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(result.agreementId).toBe("cross-org-existing-agreement");
			expect(result.negotiationId).toBeUndefined();
			expect(sendSpy).not.toHaveBeenCalled();
		});

		test("should fire onFinalized callbacks with the existing agreementId when reusing", async () => {
			mockPap.clearAgreements();
			mockPap.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "cross-org-callback-agreement",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:provider-node-xyz",
				target: "urn:uuid:dataset-negotiation-valid",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolAgreement);
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};
			service.registerNegotiationCallback("cross-org-reuse-test", callbackSpy);

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(result.agreementId).toBe("cross-org-callback-agreement");
			expect(callbackSpy.onFinalized).toHaveBeenCalledWith(
				undefined,
				"cross-org-callback-agreement"
			);
			expect(callbackSpy.onStateChanged).not.toHaveBeenCalled();
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
		});

		test("should select the newest agreement by dateCreated when multiple compatible agreements exist", async () => {
			mockPap.clearAgreements();
			mockPap.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "cross-org-older-agreement",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:provider-node-xyz",
				target: "urn:uuid:dataset-negotiation-valid",
				permission: [{ action: "read" }],
				dateCreated: "2025-01-01T00:00:00.000Z"
			} as unknown as IDataspaceProtocolAgreement);
			mockPap.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "cross-org-newer-agreement",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:provider-node-xyz",
				target: "urn:uuid:dataset-negotiation-valid",
				permission: [{ action: "read" }],
				dateCreated: "2026-06-01T00:00:00.000Z"
			} as unknown as IDataspaceProtocolAgreement);
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			expect(result.agreementId).toBe("cross-org-newer-agreement");
			expect(result.negotiationId).toBeUndefined();
		});
	});

	describe("Negotiation History", () => {
		test("should retrieve negotiation history from PNAP", async () => {
			const mockPnapAdmin = new MockPolicyNegotiationAdminPointComponent();

			// Add sample negotiations
			mockPnapAdmin.addNegotiation(
				MockPolicyNegotiationAdminPointComponent.createSampleNegotiation({
					id: "neg-1",
					correlationId: "provider-1",
					state: "FINALIZED",
					dateCreated: "2026-02-05T10:00:00.000Z",
					offer: {
						"@context": "http://www.w3.org/ns/odrl.jsonld",
						"@type": "Offer",
						"@id": "offer-1",
						assigner: "did:iota:provider",
						permission: [{ action: "read" }]
					},
					agreement: {
						"@context": "http://www.w3.org/ns/odrl.jsonld",
						"@type": "Agreement",
						"@id": "agreement-1",
						assigner: "did:iota:provider",
						assignee: "did:iota:consumer",
						permission: [{ action: "read" }]
					}
				})
			);

			mockPnapAdmin.addNegotiation(
				MockPolicyNegotiationAdminPointComponent.createSampleNegotiation({
					id: "neg-2",
					correlationId: "provider-2",
					state: "REQUESTED",
					dateCreated: "2026-02-05T09:00:00.000Z",
					offer: {
						"@context": "http://www.w3.org/ns/odrl.jsonld",
						"@type": "Offer",
						"@id": "offer-2",
						assigner: "did:iota:provider",
						permission: [{ action: "write" }]
					}
				})
			);

			ComponentFactory.register("test-pnap-history", () => mockPnapAdmin);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				policyNegotiationAdminPointComponentType: "test-pnap-history"
			});

			const result = await service.getNegotiationHistory(undefined, undefined, "trust-payload");

			expect(result.count).toBe(2);
			expect(result.negotiations).toHaveLength(2);

			// Verify first negotiation (newest first)
			const firstNeg = result.negotiations[0];
			expect(firstNeg.negotiation["@type"]).toBe("ContractNegotiation");
			expect(firstNeg.negotiation.consumerPid).toBe("neg-1");
			expect(firstNeg.negotiation.providerPid).toBe("provider-1");
			if ("state" in firstNeg.negotiation) {
				expect(firstNeg.negotiation.state).toBe("FINALIZED");
			}
			expect(firstNeg.offerId).toBe("offer-1");
			expect(firstNeg.agreementId).toBe("agreement-1");

			// Verify second negotiation
			const secondNeg = result.negotiations[1];
			expect(secondNeg.negotiation.consumerPid).toBe("neg-2");
			if ("state" in secondNeg.negotiation) {
				expect(secondNeg.negotiation.state).toBe("REQUESTED");
			}
			expect(secondNeg.offerId).toBe("offer-2");
			expect(secondNeg.agreementId).toBeUndefined(); // No agreement yet

			ComponentFactory.unregister("test-pnap-history");
		});

		test("should filter negotiation history by state", async () => {
			const mockPnapAdmin = new MockPolicyNegotiationAdminPointComponent();

			// Add negotiations in different states
			mockPnapAdmin.addNegotiation(
				MockPolicyNegotiationAdminPointComponent.createSampleNegotiation({
					id: "neg-finalized",
					state: "FINALIZED",
					dateCreated: "2026-02-05T10:00:00.000Z"
				})
			);

			mockPnapAdmin.addNegotiation(
				MockPolicyNegotiationAdminPointComponent.createSampleNegotiation({
					id: "neg-requested",
					state: "REQUESTED",
					dateCreated: "2026-02-05T09:00:00.000Z"
				})
			);

			mockPnapAdmin.addNegotiation(
				MockPolicyNegotiationAdminPointComponent.createSampleNegotiation({
					id: "neg-terminated",
					state: "TERMINATED",
					dateCreated: "2026-02-05T08:00:00.000Z"
				})
			);

			ComponentFactory.register("test-pnap-filter", () => mockPnapAdmin);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				policyNegotiationAdminPointComponentType: "test-pnap-filter"
			});

			// Query only FINALIZED negotiations
			const result = await service.getNegotiationHistory("FINALIZED", undefined, "trust-payload");

			expect(result.count).toBe(1);
			expect(result.negotiations).toHaveLength(1);
			const firstNeg = result.negotiations[0].negotiation;
			if ("state" in firstNeg) {
				expect(firstNeg.state).toBe("FINALIZED");
			}
			expect(result.negotiations[0].negotiation.consumerPid).toBe("neg-finalized");

			ComponentFactory.unregister("test-pnap-filter");
		});

		test("should support pagination with cursor", async () => {
			const mockPnapAdmin = new MockPolicyNegotiationAdminPointComponent();

			// Add 15 negotiations (more than one page)
			for (let i = 0; i < 15; i++) {
				mockPnapAdmin.addNegotiation(
					MockPolicyNegotiationAdminPointComponent.createSampleNegotiation({
						id: `neg-${i}`,
						state: "FINALIZED",
						dateCreated: new Date((Date.now() - i) * 1000).toISOString()
					})
				);
			}

			ComponentFactory.register("test-pnap-pagination", () => mockPnapAdmin);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				policyNegotiationAdminPointComponentType: "test-pnap-pagination"
			});

			// First page
			const page1 = await service.getNegotiationHistory(undefined, undefined, "trust-payload");

			expect(page1.count).toBe(10); // First page has 10 items
			expect(page1.negotiations).toHaveLength(10);
			expect(page1.cursor).toBeDefined(); // Has more pages

			// Second page
			const page2 = await service.getNegotiationHistory(undefined, page1.cursor, "trust-payload");

			expect(page2.count).toBe(5); // Second page has remaining 5 items
			expect(page2.negotiations).toHaveLength(5);
			expect(page2.cursor).toBeUndefined(); // No more pages

			ComponentFactory.unregister("test-pnap-pagination");
		});

		test("should return empty history when no negotiations exist", async () => {
			const mockPnapAdmin = new MockPolicyNegotiationAdminPointComponent();

			ComponentFactory.register("test-pnap-empty", () => mockPnapAdmin);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				policyNegotiationAdminPointComponentType: "test-pnap-empty"
			});

			const result = await service.getNegotiationHistory(undefined, undefined, "trust-payload");

			expect(result.count).toBe(0);
			expect(result.negotiations).toHaveLength(0);
			expect(result.cursor).toBeUndefined();

			ComponentFactory.unregister("test-pnap-empty");
		});

		test("should throw when PNAP component type is not registered", async () => {
			expect(
				() =>
					new DataspaceControlPlaneService({
						...DEFAULT_SERVICE_OPTIONS,
						policyNegotiationAdminPointComponentType: "not-a-registered-pnap"
					})
			).toThrow();
		});
	});

	describe("Identity-based authorization", () => {
		test("requestTransfer should return TransferError when caller is not agreement assignee", async () => {
			ComponentFactory.register("test-trust-unauthorized", () =>
				createMockTrustComponent("did:iota:unauthorized-node")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-unauthorized"
			});

			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: `urn:uuid:${RandomHelper.generateUuidV7()}`,
				agreementId: "agreement-123",
				callbackAddress: "https://consumer.example.com/callback",
				format: "HttpData-PULL"
			};

			const result = await service.requestTransfer(request, "valid-trust-payload");

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(result.code).toMatch(/^UnauthorizedError:/);
			}

			ComponentFactory.unregister("test-trust-unauthorized");
		});

		test("getTransferProcess should return TransferError when caller is neither consumer nor provider", async () => {
			const now = new Date().toISOString();
			await transferProcessStorage.set({
				consumerPid: "auth-test-consumer-pid",
				id: "auth-test-id",
				providerPid: "auth-test-provider-pid",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				agreementId: "agreement-123",
				datasetId: "urn:uuid:dataset-123",
				offerId: "agreement-123",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: now,
				dateModified: now
			});

			ComponentFactory.register("test-trust-unauthorized", () =>
				createMockTrustComponent("did:iota:unauthorized-node")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-unauthorized"
			});

			const result = await service.getTransferProcess(
				"auth-test-consumer-pid",
				"valid-trust-payload"
			);

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(result.code).toMatch(/^UnauthorizedError:/);
			}

			ComponentFactory.unregister("test-trust-unauthorized");
		});

		test("completeTransfer should return TransferError when caller is not the consumer", async () => {
			const now = new Date().toISOString();
			await transferProcessStorage.set({
				consumerPid: "auth-test-complete-pid",
				id: "auth-test-complete-id",
				providerPid: "auth-test-complete-provider",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				agreementId: "agreement-123",
				datasetId: "urn:uuid:dataset-123",
				offerId: "agreement-123",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: now,
				dateModified: now
			});

			ComponentFactory.register("test-trust-unauthorized", () =>
				createMockTrustComponent("did:iota:unauthorized-node")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-unauthorized"
			});

			const message: IDataspaceProtocolTransferCompletionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferCompletionMessage",
				consumerPid: "auth-test-complete-pid",
				providerPid: "auth-test-complete-provider"
			};

			const result = await service.completeTransfer(message, "valid-trust-payload");

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(result.code).toMatch(/^UnauthorizedError:/);
			}

			ComponentFactory.unregister("test-trust-unauthorized");
		});

		test("startTransfer should return TransferError when caller is not the provider", async () => {
			const now = new Date().toISOString();
			await transferProcessStorage.set({
				consumerPid: "auth-test-start-pid",
				id: "auth-test-start-id",
				providerPid: "auth-test-start-provider",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				agreementId: "agreement-123",
				datasetId: "urn:uuid:dataset-123",
				offerId: "agreement-123",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: now,
				dateModified: now
			});

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "auth-test-start-pid",
				providerPid: "auth-test-start-provider"
			};

			const result = await service.startTransfer(message, "valid-trust-payload");

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(result.code).toMatch(/^UnauthorizedError:/);
			}
		});

		test("completeTransfer should return TransferError when caller is the provider (not consumer)", async () => {
			const now = new Date().toISOString();
			await transferProcessStorage.set({
				consumerPid: "auth-test-complete-provider-pid",
				id: "auth-test-complete-provider-id",
				providerPid: "auth-test-complete-provider-ppid",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				agreementId: "agreement-123",
				datasetId: "urn:uuid:dataset-123",
				offerId: "agreement-123",
				consumerIdentity: "did:iota:other-consumer",
				providerIdentity: "did:iota:consumer-node-abc",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: now,
				dateModified: now
			});

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferCompletionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferCompletionMessage",
				consumerPid: "auth-test-complete-provider-pid",
				providerPid: "auth-test-complete-provider-ppid"
			};

			const result = await service.completeTransfer(message, "valid-trust-payload");

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(result.code).toMatch(/^UnauthorizedError:/);
			}
		});

		test("requestTransfer should succeed when caller matches one of multiple agreement assignees", async () => {
			ComponentFactory.register("test-trust-multi-assignee", () =>
				createMockTrustComponent("did:iota:consumer-node-abc")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-multi-assignee"
			});

			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: `urn:uuid:${RandomHelper.generateUuidV7()}`,
				agreementId: "agreement-multi-assignee",
				callbackAddress: "https://consumer.example.com/callback",
				format: "HttpData-PULL"
			};

			const result = await service.requestTransfer(request, "valid-trust-payload");

			expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			ComponentFactory.unregister("test-trust-multi-assignee");
		});

		test("authorized consumer should successfully access transfer process", async () => {
			const now = new Date().toISOString();
			await transferProcessStorage.set({
				consumerPid: "auth-test-ok-pid",
				id: "auth-test-ok-id",
				providerPid: "auth-test-ok-provider",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				agreementId: "agreement-123",
				datasetId: "urn:uuid:dataset-123",
				offerId: "agreement-123",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: now,
				dateModified: now
			});

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const result = await service.getTransferProcess("auth-test-ok-pid", "valid-trust-payload");

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferProcess);
		});
	});

	describe("data plane component", () => {
		test("constructor throws when the data plane component type is not registered", () => {
			expect(
				() =>
					new DataspaceControlPlaneService({
						...DEFAULT_SERVICE_OPTIONS,
						dataPlaneComponentType: "not-a-registered-component"
					})
			).toThrowError("factory.noGet");
		});

		test("setupPushSubscription is called with consumerPid on REQUESTED → STARTED (HttpData-PUSH)", async () => {
			const mockDataPlane = createMockDataspaceDataPlaneComponent();
			ComponentFactory.register("test-dp-required-start", () => mockDataPlane);
			ComponentFactory.register("test-trust-dp-required-start", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-dp-required-start",
				dataPlaneComponentType: "test-dp-required-start"
			});

			await transferProcessStorage.set({
				consumerPid: "g14-start-consumer-pid",
				id: "g14-start-id",
				providerPid: "g14-start-provider-pid",
				agreementId: "g14-start-agreement",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-g14-start",
				offerId: "offer-g14-start",
				providerIdentity: "did:iota:provider-node-xyz",
				localRole: TransferProcessRole.Provider,
				organizationIdentity: "did:iota:provider-node-xyz",
				format: DataspaceTransferFormat.HttpDataPush,
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString(),
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: "https://consumer.example.com/dataspace/inbox"
				}
			});

			const response = await service.startTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid: "g14-start-consumer-pid",
					providerPid: "g14-start-provider-pid"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			expect(mockDataPlane.setupPushSubscription).toHaveBeenCalledOnce();
			expect(mockDataPlane.setupPushSubscription).toHaveBeenCalledWith("g14-start-consumer-pid");
			expect(mockDataPlane.resumePushSubscription).not.toHaveBeenCalled();

			try {
				ComponentFactory.unregister("test-dp-required-start");
				ComponentFactory.unregister("test-trust-dp-required-start");
			} catch {}
		});

		test("teardownPushSubscription is called with consumerPid on STARTED → TERMINATED (HttpData-PUSH)", async () => {
			const mockDataPlane = createMockDataspaceDataPlaneComponent();
			ComponentFactory.register("test-dp-required-terminate", () => mockDataPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				dataPlaneComponentType: "test-dp-required-terminate"
			});

			await transferProcessStorage.set({
				consumerPid: "g14-terminate-consumer-pid",
				id: "g14-terminate-id",
				providerPid: "g14-terminate-provider-pid",
				agreementId: "g14-terminate-agreement",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-g14-terminate",
				offerId: "offer-g14-terminate",
				format: DataspaceTransferFormat.HttpDataPush,
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.terminateTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferTerminationMessage",
					consumerPid: "g14-terminate-consumer-pid",
					providerPid: "g14-terminate-provider-pid"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			expect(mockDataPlane.teardownPushSubscription).toHaveBeenCalledOnce();
			expect(mockDataPlane.teardownPushSubscription).toHaveBeenCalledWith(
				"g14-terminate-consumer-pid"
			);

			try {
				ComponentFactory.unregister("test-dp-required-terminate");
			} catch {}
		});

		test("suspendPushSubscription is called with consumerPid on STARTED → SUSPENDED (HttpData-PUSH)", async () => {
			const mockDataPlane = createMockDataspaceDataPlaneComponent();
			ComponentFactory.register("test-dp-required-suspend", () => mockDataPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				dataPlaneComponentType: "test-dp-required-suspend"
			});

			await transferProcessStorage.set({
				consumerPid: "g14-suspend-consumer-pid",
				id: "g14-suspend-id",
				providerPid: "g14-suspend-provider-pid",
				agreementId: "g14-suspend-agreement",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-g14-suspend",
				offerId: "offer-g14-suspend",
				format: DataspaceTransferFormat.HttpDataPush,
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const response = await service.suspendTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferSuspensionMessage",
					consumerPid: "g14-suspend-consumer-pid",
					providerPid: "g14-suspend-provider-pid"
				},
				"valid-trust-payload"
			);

			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			expect(mockDataPlane.suspendPushSubscription).toHaveBeenCalledOnce();
			expect(mockDataPlane.suspendPushSubscription).toHaveBeenCalledWith(
				"g14-suspend-consumer-pid"
			);

			try {
				ComponentFactory.unregister("test-dp-required-suspend");
			} catch {}
		});
	});

	describe("Dataset CRUD (tenant-scoped admin surface)", () => {
		const TEST_TENANT_A = "did:iota:test-tenant";
		const TEST_TENANT_B = "did:iota:other-tenant";
		const TEST_NODE_ID = "did:iota:test-node";
		const TEST_APP_ID = "https://twin.example.org/app1";

		// Register a minimal mock app under TEST_APP_ID so publishDataset's
		// DataspaceAppFactory.get lookup succeeds.
		beforeEach(() => {
			DataspaceAppFactory.register(TEST_APP_ID, () => ({
				className: () => "MockDataspaceApp",
				activitiesHandled: () => [],
				supportedQueryTypes: () => []
			}));
		});

		afterEach(() => {
			try {
				DataspaceAppFactory.unregister(TEST_APP_ID);
			} catch {
				// Already gone, ignore.
			}
		});

		/**
		 * Build a minimal valid IDataspaceProtocolDataset payload.
		 * @param datasetId The DCAT @id for the dataset.
		 * @returns A minimal app dataset.
		 */
		function buildDataset(datasetId: string): unknown {
			return {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@id": datasetId,
				"@type": "Dataset",
				hasPolicy: [
					{
						"@id": "urn:policy:test",
						"@type": "Offer",
						permission: [{ action: "read" }]
					}
				],
				distribution: [
					{
						"@id": `${datasetId}/distribution-1`,
						"@type": "Distribution",
						accessService: datasetId,
						format: "Http-Pull-Query-Format"
					}
				]
			};
		}

		test("createAppDataset persists the entity with the calling tenant captured", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await service.createAppDataset(
				"urn:test:ds-1",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/data-service-1") as never
			);

			const stored = await dataspaceAppDatasetStorage.get("urn:test:ds-1");
			expect(stored).toBeDefined();
			expect(stored?.id).toBe("urn:test:ds-1");
			expect(stored?.appId).toBe(TEST_APP_ID);
			expect(stored?.tenantId).toBe(TEST_TENANT_A);
			expect(stored?.organizationIdentity).toBe("did:iota:provider-node-xyz");
			// `@id` is stripped from the stored blob - entity.id is the source of truth.
			expect((stored?.dataset as { "@id"?: string })["@id"]).toBeUndefined();
			expect(stored?.dataset?.["@type"]).toBe("Dataset");
		});

		test("createAppDataset rejects duplicate id with datasetAlreadyExists", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await service.createAppDataset(
				"urn:test:ds-dup",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/data-service-dup") as never
			);

			await expect(
				service.createAppDataset(
					"urn:test:ds-dup",
					TEST_APP_ID,
					buildDataset("https://twin.example.org/data-service-dup") as never
				)
			).rejects.toMatchObject({
				name: "AlreadyExistsError",
				message: expect.stringContaining("datasetAlreadyExists")
			});
		});

		test("createAppDataset rejects plain-string ids that are not a URN or URL", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(
				service.createAppDataset(
					"plain-string-id",
					TEST_APP_ID,
					buildDataset("https://twin.example.org/ignored") as never
				)
			).rejects.toMatchObject({
				name: "GeneralError",
				message: expect.stringContaining("invalidDatasetId")
			});
		});

		test("createAppDataset publishes the dataset to fedcat in the calling tenant context", async () => {
			const setSpy = vi.spyOn(mockFedCat, "set");
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await service.createAppDataset(
				"https://twin.example.org/ds-publish",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-publish") as never
			);

			// fedcat.set was called once during the inline publish flow.
			expect(setSpy).toHaveBeenCalledTimes(1);
			const publishedDataset = setSpy.mock.calls[0][0] as { "@id"?: string };
			expect(publishedDataset["@id"]).toBe("https://twin.example.org/ds-publish");
		});

		test("createAppDataset does not persist locally when fedcat publish returns CatalogError", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			vi.spyOn(mockFedCat, "set").mockResolvedValue({
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": DataspaceProtocolCatalogTypes.CatalogError,
				code: "GeneralError:datasetOwnerMismatch"
			});

			await expect(
				service.createAppDataset(
					"urn:test:ds-publish-fail",
					TEST_APP_ID,
					buildDataset("https://twin.example.org/ds-publish-fail") as never
				)
			).rejects.toMatchObject({
				name: "GeneralError",
				message: expect.stringContaining("datasetPublishFailed")
			});

			const stored = await dataspaceAppDatasetStorage.get("urn:test:ds-publish-fail");
			expect(stored).toBeUndefined();
		});

		test("populateDefaults stamps org DID as publisher in multi-tenant context", async () => {
			// Publisher attribution is always the organization DID from the calling context.
			const setSpy = vi.spyOn(mockFedCat, "set");
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await service.createAppDataset(
				"https://twin.example.org/ds-composite",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-composite") as never
			);

			expect(setSpy).toHaveBeenCalledTimes(1);
			const publishedDataset = setSpy.mock.calls[0][0] as {
				"dcterms:publisher"?: string;
			};
			expect(publishedDataset["dcterms:publisher"]).toBe("did:iota:provider-node-xyz");
		});

		test("populateDefaults stamps org DID as publisher when an org context is present", async () => {
			// The file-level beforeEach mock includes Organization = "did:iota:provider-node-xyz".
			// Publisher attribution comes from the organization DID.
			const setSpy = vi.spyOn(mockFedCat, "set");
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await service.createAppDataset(
				"https://twin.example.org/ds-composite-with-org",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-composite-with-org") as never
			);

			expect(setSpy).toHaveBeenCalledTimes(1);
			const publishedDataset = setSpy.mock.calls[0][0] as {
				"dcterms:publisher"?: string;
			};
			expect(publishedDataset["dcterms:publisher"]).toBe("did:iota:provider-node-xyz");
		});

		test("getAppDataset returns the app when the calling tenant owns it", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await service.createAppDataset(
				"urn:test:ds-get",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-get") as never
			);

			const result = await service.getAppDataset("urn:test:ds-get");
			expect(result.id).toBe("urn:test:ds-get");
			expect(result.appId).toBe(TEST_APP_ID);
		});

		test("getAppDataset throws NotFoundError for an id that does not exist", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(service.getAppDataset("does-not-exist")).rejects.toMatchObject({
				name: "NotFoundError",
				message: expect.stringContaining("datasetNotFound")
			});
		});

		test("getAppDataset rejects cross-tenant reads with datasetWrongOrganization", async () => {
			// Create as Tenant A.
			const serviceA = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			await serviceA.createAppDataset(
				"urn:test:ds-cross",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-cross") as never
			);

			// Switch context to Tenant B; same service instance.
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: TEST_NODE_ID,
				[ContextIdKeys.Tenant]: TEST_TENANT_B,
				[ContextIdKeys.Organization]: "did:iota:other-org"
			});

			await expect(serviceA.getAppDataset("urn:test:ds-cross")).rejects.toMatchObject({
				name: "UnauthorizedError",
				message: expect.stringContaining("datasetWrongOrganization")
			});
		});

		test("listDatasets returns only the calling organization's records", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Two records under the default organization.
			await service.createAppDataset(
				"urn:test:ds-a-1",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-a-1") as never
			);
			await service.createAppDataset(
				"urn:test:ds-a-2",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-a-2") as never
			);

			// One record belonging to a different organization (seeded directly
			// into storage to skip the context switch dance).
			const now = new Date().toISOString();
			await dataspaceAppDatasetStorage.set({
				id: "ds-b-1",
				organizationIdentity: "did:iota:other-org",
				tenantId: TEST_TENANT_B,
				appId: TEST_APP_ID,
				dataset: buildDataset("https://twin.example.org/ds-b-1") as never,
				dateCreated: now,
				dateModified: now
			});

			const page = await service.listAppDatasets();
			expect(page.entities.map(e => e.id).sort()).toEqual(["urn:test:ds-a-1", "urn:test:ds-a-2"]);
		});

		test("updateAppDataset rewrites the app dataset and re-publishes to fedcat", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await service.createAppDataset(
				"urn:test:ds-upd",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-upd-v1") as never
			);

			const setSpy = vi.spyOn(mockFedCat, "set");
			await service.updateAppDataset(
				"urn:test:ds-upd",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-upd-v2") as never
			);

			// updateAppDataset publishes once (the spy was attached AFTER the
			// initial create's publish).
			expect(setSpy).toHaveBeenCalledTimes(1);
			const stored = await dataspaceAppDatasetStorage.get("urn:test:ds-upd");
			// `@id` is stripped from the stored blob; entity.id is the source of truth.
			expect((stored?.dataset as { "@id"?: string })["@id"]).toBeUndefined();
			expect(stored?.id).toBe("urn:test:ds-upd");
		});

		test("re-publishing the same dataset via CRUD keeps a single fedcat entry (idempotent, not duplicated)", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			const setSpy = vi.spyOn(mockFedCat, "set");

			const datasetId = "urn:test:ds-idempotent";
			await service.createAppDataset(
				datasetId,
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-idempotent-v1") as never
			);
			await service.updateAppDataset(
				datasetId,
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-idempotent-v2") as never
			);
			await service.updateAppDataset(
				datasetId,
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-idempotent-v3") as never
			);

			// Three publishes over the lifetime of one dataset - restampDatasetId always
			// stamps the entity's own id as @id, so every publish targets the same fedcat
			// row (an upsert), never a new one.
			expect(setSpy).toHaveBeenCalledTimes(3);
			const publishedIds = setSpy.mock.calls.map(
				([dataset]) => (dataset as { "@id"?: string })["@id"]
			);
			expect(new Set(publishedIds)).toEqual(new Set([datasetId]));

			const { result } = await mockFedCat.query();
			const matching = (result as { dataset: { "@id"?: string }[] }).dataset.filter(
				d => d["@id"] === datasetId
			);
			expect(matching).toHaveLength(1);
		});

		test("updateAppDataset rejects cross-tenant writes with datasetWrongOrganization", async () => {
			const serviceA = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			await serviceA.createAppDataset(
				"urn:test:ds-upd-cross",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-upd-cross") as never
			);

			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: TEST_NODE_ID,
				[ContextIdKeys.Tenant]: TEST_TENANT_B,
				[ContextIdKeys.Organization]: "did:iota:other-org"
			});

			await expect(
				serviceA.updateAppDataset(
					"urn:test:ds-upd-cross",
					TEST_APP_ID,
					buildDataset("https://twin.example.org/ds-upd-cross-hijack") as never
				)
			).rejects.toMatchObject({
				name: "UnauthorizedError",
				message: expect.stringContaining("datasetWrongOrganization")
			});
		});

		test("deleteAppDataset removes the app dataset and the corresponding fedcat dataset", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const datasetId = "https://twin.example.org/ds-del";
			await service.createAppDataset(datasetId, TEST_APP_ID, buildDataset(datasetId) as never);

			const removeSpy = vi.spyOn(mockFedCat, "remove");
			await service.deleteAppDataset(datasetId);

			// Local storage removed.
			const stored = await dataspaceAppDatasetStorage.get(datasetId);
			expect(stored).toBeUndefined();
			// fedcat removal called with the dataset @id (which IS the entity id).
			expect(removeSpy).toHaveBeenCalledTimes(1);
			expect(removeSpy.mock.calls[0][0]).toBe(datasetId);
		});

		test("deleteAppDataset keeps the app dataset when fedcat remove returns CatalogError", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			const datasetId = "https://twin.example.org/ds-del-fail";
			await service.createAppDataset(datasetId, TEST_APP_ID, buildDataset(datasetId) as never);

			vi.spyOn(mockFedCat, "remove").mockResolvedValue({
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": DataspaceProtocolCatalogTypes.CatalogError,
				code: "GeneralError:datasetRemoveNotOwner"
			});

			await expect(service.deleteAppDataset(datasetId)).rejects.toMatchObject({
				name: "GeneralError",
				message: expect.stringContaining("datasetRemoveFailed")
			});

			const stored = await dataspaceAppDatasetStorage.get(datasetId);
			expect(stored).toBeDefined();
		});

		test("deleteAppDataset rejects cross-tenant deletes with datasetWrongOrganization", async () => {
			const serviceA = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			await serviceA.createAppDataset(
				"urn:test:ds-del-cross",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-del-cross") as never
			);

			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: TEST_NODE_ID,
				[ContextIdKeys.Tenant]: TEST_TENANT_B,
				[ContextIdKeys.Organization]: "did:iota:other-org"
			});

			await expect(serviceA.deleteAppDataset("urn:test:ds-del-cross")).rejects.toMatchObject({
				name: "UnauthorizedError",
				message: expect.stringContaining("datasetWrongOrganization")
			});

			// The record must still be present - denied delete shouldn't side-effect.
			const stored = await dataspaceAppDatasetStorage.get("urn:test:ds-del-cross");
			expect(stored).toBeDefined();
		});

		test("deleteAppDataset throws NotFoundError when the id does not exist", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(service.deleteAppDataset("does-not-exist")).rejects.toMatchObject({
				name: "NotFoundError",
				message: expect.stringContaining("datasetNotFound")
			});
		});

		describe("platform component - single-tenant vs multi-tenant mode", () => {
			const TENANT_A = "did:iota:tenant-a";
			const TENANT_B = "did:iota:tenant-b";
			const ORG_A = "did:iota:org-a";
			const ORG_B = "did:iota:org-b";

			afterEach(() => {
				try {
					ComponentFactory.unregister("test-platform-st");
					ComponentFactory.unregister("test-platform-mt");
				} catch {
					// Ignore.
				}
			});

			test("multi-tenant listAppDatasets scopes to the calling organization within the tenant partition", async () => {
				const now = new Date().toISOString();

				// Seed two datasets belonging to ORG_A under TENANT_A.
				await dataspaceAppDatasetStorage.set({
					id: "urn:test:mt-list-a1",
					organizationIdentity: ORG_A,
					tenantId: TENANT_A,
					appId: TEST_APP_ID,
					dataset: buildDataset("https://twin.example.org/mt-list-a1") as never,
					dateCreated: now,
					dateModified: now
				});
				await dataspaceAppDatasetStorage.set({
					id: "urn:test:mt-list-a2",
					organizationIdentity: ORG_A,
					tenantId: TENANT_A,
					appId: TEST_APP_ID,
					dataset: buildDataset("https://twin.example.org/mt-list-a2") as never,
					dateCreated: now,
					dateModified: now
				});

				// One dataset belonging to ORG_B - must not appear in ORG_A's list.
				await dataspaceAppDatasetStorage.set({
					id: "urn:test:mt-list-b1",
					organizationIdentity: ORG_B,
					tenantId: TENANT_B,
					appId: TEST_APP_ID,
					dataset: buildDataset("https://twin.example.org/mt-list-b1") as never,
					dateCreated: now,
					dateModified: now
				});

				// Call listAppDatasets as ORG_A.
				vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
					[ContextIdKeys.Node]: "did:iota:test-node",
					[ContextIdKeys.Tenant]: TENANT_A,
					[ContextIdKeys.Organization]: ORG_A
				});

				const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
				const page = await service.listAppDatasets();
				expect(page.entities.map(e => e.id).sort()).toEqual([
					"urn:test:mt-list-a1",
					"urn:test:mt-list-a2"
				]);
			});
		});

		test("createAppDataset uses dataset @id as storage key when no explicit id is provided", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const datasetId = "https://twin.example.org/derived-from-at-id";
			const resolvedId = await service.createAppDataset(
				undefined,
				TEST_APP_ID,
				buildDataset(datasetId) as never
			);

			expect(resolvedId).toBe(datasetId);
			const stored = await dataspaceAppDatasetStorage.get(datasetId);
			expect(stored?.id).toBe(datasetId);
			expect((stored?.dataset as { "@id"?: string })["@id"]).toBeUndefined();
		});

		test("createAppDataset auto-generates a UUID when neither id nor dataset @id is provided", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Build a dataset payload deliberately without `@id`.
			const datasetWithoutId = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "Dataset",
				hasPolicy: [],
				distribution: []
			};

			const resolvedId = await service.createAppDataset(
				undefined,
				TEST_APP_ID,
				datasetWithoutId as never
			);

			// Auto-generated ID is `dataset:<compact-uuidv7>` (32-char lowercase hex).
			expect(resolvedId).toMatch(/^dataset:[\da-f]{32}$/);
			const stored = await dataspaceAppDatasetStorage.get(resolvedId);
			expect(stored?.id).toBe(resolvedId);
		});

		test("createAppDataset: explicit id wins when explicit id and dataset @id differ", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const explicitId = "urn:test:explicit-storage-id";
			const datasetAtId = "https://twin.example.org/payload-at-id";

			const resolvedId = await service.createAppDataset(
				explicitId,
				TEST_APP_ID,
				buildDataset(datasetAtId) as never
			);

			expect(resolvedId).toBe(explicitId);
			// Nothing stored under the payload's @id.
			const storedAtId = await dataspaceAppDatasetStorage.get(datasetAtId);
			expect(storedAtId).toBeUndefined();
			// Stored under the explicit id, with @id stripped.
			const stored = await dataspaceAppDatasetStorage.get(explicitId);
			expect(stored?.id).toBe(explicitId);
			expect((stored?.dataset as { "@id"?: string })["@id"]).toBeUndefined();
		});

		test("getAppDataset re-stamps @id from entity.id on read", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Seed storage directly with a app dataset blob that has no @id.
			const id = "ds-restamp";
			const now = new Date().toISOString();
			await dataspaceAppDatasetStorage.set({
				id,
				organizationIdentity: "did:iota:provider-node-xyz",
				tenantId: TEST_TENANT_A,
				appId: TEST_APP_ID,
				dataset: {
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "Dataset",
					hasPolicy: [],
					distribution: []
				},
				dateCreated: now,
				dateModified: now
			});

			const result = await service.getAppDataset(id);
			// @id on the returned dataset is re-stamped from entity.id.
			expect((result.dataset as { "@id"?: string })["@id"]).toBe(id);
		});

		test("updateAppDataset strips @id from new payload - path id stays authoritative", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const pathId = "urn:test:ds-immutable-id";
			await service.createAppDataset(
				pathId,
				TEST_APP_ID,
				buildDataset("https://twin.example.org/initial") as never
			);

			// Update with a payload whose @id differs from the path id.
			await service.updateAppDataset(
				pathId,
				TEST_APP_ID,
				buildDataset("https://twin.example.org/different-at-id") as never
			);

			const stored = await dataspaceAppDatasetStorage.get(pathId);
			// The storage key did not change.
			expect(stored?.id).toBe(pathId);
			// @id was stripped from the stored blob.
			expect((stored?.dataset as { "@id"?: string })["@id"]).toBeUndefined();
			// And no entity was stored under the body's @id.
			const storedAtId = await dataspaceAppDatasetStorage.get(
				"https://twin.example.org/different-at-id"
			);
			expect(storedAtId).toBeUndefined();
		});
	});

	describe("negotiateAgreement trust check", () => {
		test("negotiateAgreement should declare 4 parameters (trustPayload retained)", () => {
			// The implementation now enforces a real TrustHelper.verifyTrust() check.
			// Function.length counts formal parameters declared before any default/rest.
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			expect(service.negotiateAgreement.length).toBe(4);
		});

		test("getNegotiation should declare 2 parameters (regression lock-in)", () => {
			// getNegotiation correctly uses trustPayload today. This assertion locks
			// its current shape so a future refactor cannot silently change it.
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			expect(service.getNegotiation.length).toBe(2);
		});

		test("negotiateAgreement should call TrustHelper.verifyTrust on the trust payload", async () => {
			const verifySpy = vi.fn().mockResolvedValue({
				verified: true,
				info: { token: "the-trust-payload-under-test", identity: "did:iota:consumer-spy" }
			});

			ComponentFactory.register("test-trust-spy", () => ({
				className: () => "TestTrustSpy",
				verify: verifySpy,
				generate: vi.fn().mockResolvedValue("mock-local-trust-token")
			}));

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-spy"
			});
			mockPnpToReturnNegotiationId(mockPnp);

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"the-trust-payload-under-test"
			);

			expect(verifySpy).toHaveBeenCalledOnce();
			expect(verifySpy.mock.calls[0][0]).toBe("the-trust-payload-under-test");

			ComponentFactory.unregister("test-trust-spy");
		});

		test("negotiateAgreement should reject when trust verification fails", async () => {
			ComponentFactory.register("test-trust-failing", () => createFailingMockTrustComponent());

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-failing"
			});

			await expect(
				service.negotiateAgreement(
					"urn:uuid:dataset-negotiation-valid",
					"offer-negotiation-valid",
					"http://provider.example.com",
					"invalid-trust-payload"
				)
			).rejects.toThrow();

			ComponentFactory.unregister("test-trust-failing");
		});
	});

	describe("Transfer Callbacks - register / unregister", () => {
		test("registerTransferCallback stores the callback", () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const callback: ITransferCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined)
			};

			expect(() => service.registerTransferCallback("my-listener", callback)).not.toThrow();
		});

		test("unregisterTransferCallback removes a registered callback without error", () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const callback: ITransferCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined)
			};

			service.registerTransferCallback("my-listener", callback);
			expect(() => service.unregisterTransferCallback("my-listener")).not.toThrow();
		});

		test("unregisterTransferCallback is a no-op for an unknown key", () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			expect(() => service.unregisterTransferCallback("does-not-exist")).not.toThrow();
		});
	});

	describe("Transfer Callbacks - startTransfer fires onStarted for Consumer role", () => {
		test("should invoke onStateChanged(STARTED) and onStarted when role is Consumer", async () => {
			const callback: ITransferCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerTransferCallback("test-cb", callback);

			// Seed a REQUESTED transfer where THIS node is the consumer (consumerPid = primary key).
			// providerIdentity must match the mock trust component identity ("did:iota:consumer-node-abc").
			await transferProcessStorage.set({
				id: "cb-start-internal-01",
				consumerPid: "cb-start-consumer-01",
				providerPid: "cb-start-provider-01",
				agreementId: "agreement-123",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-123",
				offerId: "offer-cb-01",
				providerIdentity: "did:iota:consumer-node-abc",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const message: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "cb-start-consumer-01",
				providerPid: "cb-start-provider-01"
			};

			const result = await service.startTransfer(message, "valid-trust-payload");

			expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			expect(callback.onStateChanged).toHaveBeenCalledWith(
				"cb-start-consumer-01",
				DataspaceProtocolTransferProcessStateType.STARTED
			);
			expect(callback.onStarted).toHaveBeenCalledWith(
				"cb-start-consumer-01",
				expect.objectContaining({ consumerPid: "cb-start-consumer-01" })
			);
			expect(callback.onCompleted).not.toHaveBeenCalled();
			expect(callback.onSuspended).not.toHaveBeenCalled();
			expect(callback.onTerminated).not.toHaveBeenCalled();
		});

		test("should NOT invoke transfer callbacks when role is Provider", async () => {
			const callback: ITransferCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined)
			};

			// Use a trust component that identifies as the provider
			ComponentFactory.register("test-trust-provider-cb", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-provider-cb"
			});
			service.registerTransferCallback("test-cb", callback);

			// Seed a REQUESTED transfer found by providerPid (secondary key) → role = Provider.
			// consumerIdentity is intentionally set to a different identity so the provider lookup succeeds.
			await transferProcessStorage.set({
				id: "cb-provider-internal-01",
				consumerPid: "cb-provider-consumer-01",
				providerPid: "cb-provider-pid-01",
				agreementId: "agreement-123",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-123",
				offerId: "offer-cb-provider",
				consumerIdentity: "did:iota:other-consumer",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			// Pass the stored entity's providerPid as the message consumerPid.
			// The primary-key lookup will miss (primary key is "cb-provider-consumer-01"),
			// then the secondary providerPid index lookup will find it → role = Provider.
			const message: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "cb-provider-pid-01",
				providerPid: "cb-provider-pid-01"
			};

			await service.startTransfer(message, "valid-trust-payload");

			// No callbacks should have fired because THIS node is acting as Provider
			expect(callback.onStateChanged).not.toHaveBeenCalled();
			expect(callback.onStarted).not.toHaveBeenCalled();

			ComponentFactory.unregister("test-trust-provider-cb");
		});

		test("should NOT invoke callback after unregisterTransferCallback", async () => {
			const callback: ITransferCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerTransferCallback("test-cb", callback);
			service.unregisterTransferCallback("test-cb");

			await transferProcessStorage.set({
				id: "cb-unreg-internal-01",
				consumerPid: "cb-unreg-consumer-01",
				providerPid: "cb-unreg-provider-01",
				agreementId: "agreement-123",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-123",
				offerId: "offer-cb-unreg",
				providerIdentity: "did:iota:consumer-node-abc",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			await service.startTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid: "cb-unreg-consumer-01",
					providerPid: "cb-unreg-provider-01"
				},
				"valid-trust-payload"
			);

			expect(callback.onStateChanged).not.toHaveBeenCalled();
			expect(callback.onStarted).not.toHaveBeenCalled();
		});

		test("fan-out: multiple callbacks all receive onStarted", async () => {
			const callback1: ITransferCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined)
			};
			const callback2: ITransferCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerTransferCallback("listener-a", callback1);
			service.registerTransferCallback("listener-b", callback2);

			await transferProcessStorage.set({
				id: "cb-fanout-internal-01",
				consumerPid: "cb-fanout-consumer-01",
				providerPid: "cb-fanout-provider-01",
				agreementId: "agreement-123",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-123",
				offerId: "offer-cb-fanout",
				providerIdentity: "did:iota:consumer-node-abc",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			await service.startTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid: "cb-fanout-consumer-01",
					providerPid: "cb-fanout-provider-01"
				},
				"valid-trust-payload"
			);

			expect(callback1.onStarted).toHaveBeenCalledTimes(1);
			expect(callback2.onStarted).toHaveBeenCalledTimes(1);
		});

		test("errors thrown by individual callbacks are swallowed and do not affect protocol flow", async () => {
			const throwingCallback: ITransferCallback = {
				onStateChanged: vi.fn().mockRejectedValue(new Error("Callback boom")),
				onStarted: vi.fn().mockRejectedValue(new Error("Callback boom")),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerTransferCallback("throwing-cb", throwingCallback);

			await transferProcessStorage.set({
				id: "cb-throw-internal-01",
				consumerPid: "cb-throw-consumer-01",
				providerPid: "cb-throw-provider-01",
				agreementId: "agreement-123",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				datasetId: "dataset-123",
				offerId: "offer-cb-throw",
				providerIdentity: "did:iota:consumer-node-abc",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			// Should resolve to a valid TransferStartMessage, NOT propagate the callback error
			const result = await service.startTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid: "cb-throw-consumer-01",
					providerPid: "cb-throw-provider-01"
				},
				"valid-trust-payload"
			);

			expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		});
	});

	describe("Transfer Callbacks - completeTransfer fires onCompleted for Consumer role", () => {
		test("should invoke onStateChanged(COMPLETED) and onCompleted when role is Consumer", async () => {
			const callback: ITransferCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerTransferCallback("test-cb", callback);

			// consumerIdentity must match the caller (mock trust returns "did:iota:consumer-node-abc")
			await transferProcessStorage.set({
				id: "cb-complete-internal-01",
				consumerPid: "cb-complete-consumer-01",
				providerPid: "cb-complete-provider-01",
				agreementId: "agreement-123",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-123",
				offerId: "offer-cb-complete",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const result = await service.completeTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferCompletionMessage",
					consumerPid: "cb-complete-consumer-01",
					providerPid: "cb-complete-provider-01"
				},
				"valid-trust-payload"
			);

			expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			expect(callback.onStateChanged).toHaveBeenCalledWith(
				"cb-complete-consumer-01",
				DataspaceProtocolTransferProcessStateType.COMPLETED
			);
			expect(callback.onCompleted).toHaveBeenCalledWith("cb-complete-consumer-01");
			expect(callback.onStarted).not.toHaveBeenCalled();
			expect(callback.onSuspended).not.toHaveBeenCalled();
			expect(callback.onTerminated).not.toHaveBeenCalled();
		});
	});

	describe("Transfer Callbacks - suspendTransfer fires onSuspended for Consumer role", () => {
		test("should invoke onStateChanged(SUSPENDED) and onSuspended when role is Consumer", async () => {
			const callback: ITransferCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerTransferCallback("test-cb", callback);

			await transferProcessStorage.set({
				id: "cb-suspend-internal-01",
				consumerPid: "cb-suspend-consumer-01",
				providerPid: "cb-suspend-provider-01",
				agreementId: "agreement-123",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-123",
				offerId: "offer-cb-suspend",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const result = await service.suspendTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferSuspensionMessage",
					consumerPid: "cb-suspend-consumer-01",
					providerPid: "cb-suspend-provider-01",
					reason: ["Manual suspension"]
				},
				"valid-trust-payload"
			);

			expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			expect(callback.onStateChanged).toHaveBeenCalledWith(
				"cb-suspend-consumer-01",
				DataspaceProtocolTransferProcessStateType.SUSPENDED
			);
			expect(callback.onSuspended).toHaveBeenCalledWith(
				"cb-suspend-consumer-01",
				"Manual suspension"
			);
			expect(callback.onStarted).not.toHaveBeenCalled();
			expect(callback.onCompleted).not.toHaveBeenCalled();
			expect(callback.onTerminated).not.toHaveBeenCalled();
		});
	});

	describe("Transfer Callbacks - terminateTransfer fires onTerminated for Consumer role", () => {
		test("should invoke onStateChanged(TERMINATED) and onTerminated when role is Consumer", async () => {
			const callback: ITransferCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerTransferCallback("test-cb", callback);

			await transferProcessStorage.set({
				id: "cb-terminate-internal-01",
				consumerPid: "cb-terminate-consumer-01",
				providerPid: "cb-terminate-provider-01",
				agreementId: "agreement-123",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				datasetId: "dataset-123",
				offerId: "offer-cb-terminate",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const result = await service.terminateTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferTerminationMessage",
					consumerPid: "cb-terminate-consumer-01",
					providerPid: "cb-terminate-provider-01",
					reason: ["End of transfer"]
				},
				"valid-trust-payload"
			);

			expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			expect(callback.onStateChanged).toHaveBeenCalledWith(
				"cb-terminate-consumer-01",
				DataspaceProtocolTransferProcessStateType.TERMINATED
			);
			expect(callback.onTerminated).toHaveBeenCalledWith(
				"cb-terminate-consumer-01",
				"End of transfer"
			);
			expect(callback.onStarted).not.toHaveBeenCalled();
			expect(callback.onCompleted).not.toHaveBeenCalled();
			expect(callback.onSuspended).not.toHaveBeenCalled();
		});
	});

	describe("prepareTransfer()", () => {
		test("should reject with guards error when agreementId is empty", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(
				service.prepareTransfer(
					"",
					"http://provider.example.com",
					"HttpData-PULL",
					"valid-trust-payload"
				)
			).rejects.toThrow();
		});

		test("should reject with guards error when providerEndpoint is empty", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(
				service.prepareTransfer("agreement-123", "", "HttpData-PULL", "valid-trust-payload")
			).rejects.toThrow();
		});

		test("should throw GeneralError when format is not a known DataspaceTransferFormat", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(
				service.prepareTransfer(
					"agreement-123",
					"http://provider.example.com",
					"not-a-valid-format",
					"valid-trust-payload"
				)
			).rejects.toThrow("unsupportedTransferFormat");
		});

		test("should throw GeneralError when agreement is not found", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(
				service.prepareTransfer(
					"agreement-does-not-exist",
					"http://provider.example.com",
					"HttpData-PULL",
					"valid-trust-payload"
				)
			).rejects.toThrow();
		});

		test("should throw UnauthorizedError when caller is not the agreement assignee", async () => {
			// Trust identity "did:iota:wrong-consumer" is NOT in agreement-123's assignee
			ComponentFactory.register("test-trust-wrong-assignee", () =>
				createMockTrustComponent("did:iota:wrong-consumer")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-wrong-assignee"
			});

			await expect(
				service.prepareTransfer(
					"agreement-123",
					"http://provider.example.com",
					"HttpData-PULL",
					"valid-trust-payload"
				)
			).rejects.toThrow();

			ComponentFactory.unregister("test-trust-wrong-assignee");
		});

		test("should return consumerPid and store the transfer process when provider accepts", async () => {
			const mockRemoteControlPlane = {
				className: () => "MockRemoteControlPlane",
				requestTransfer: vi.fn().mockResolvedValue({
					"@context": ["https://w3id.org/dspace/2024/1/context.json"],
					"@type": "TransferProcess",
					consumerPid: "generated-consumer-pid",
					providerPid: "provider-pid-from-remote",
					state: DataspaceProtocolTransferProcessStateType.REQUESTED
				})
			};

			ComponentFactory.register("test-remote-cp", () => mockRemoteControlPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				remoteControlPlaneComponentType: "test-remote-cp"
			});

			const result = await service.prepareTransfer(
				"agreement-123",
				"http://provider.example.com",
				"HttpData-PULL",
				"valid-trust-payload"
			);

			expect(result).toBeDefined();
			expect(result.consumerPid).toBeDefined();
			expect(typeof result.consumerPid).toBe("string");

			// Verify the remote control plane was called with a valid TransferRequestMessage and the trust
			// payload last (no consumer options; auto-start is a provider-side decision, never the consumer's).
			expect(mockRemoteControlPlane.requestTransfer).toHaveBeenCalledWith(
				expect.objectContaining({
					"@type": "TransferRequestMessage",
					agreementId: "agreement-123",
					format: "HttpData-PULL"
				}),
				expect.anything()
			);

			// Verify the TransferProcess was actually persisted with the correct initial state
			const stored = await transferProcessStorage.get(result.consumerPid, "consumerPid");
			expect(stored).toBeDefined();
			expect(stored?.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);
			expect(stored?.providerPid).toBe("provider-pid-from-remote");
			expect(stored?.agreementId).toBe("agreement-123");
			expect(stored?.consumerPid).toBe(result.consumerPid);

			ComponentFactory.unregister("test-remote-cp");
		});

		test("should include dataAddress with consumer /inbox for HttpData-PUSH format", async () => {
			const mockRemoteControlPlane = {
				className: () => "MockRemoteControlPlane",
				requestTransfer: vi.fn().mockResolvedValue({
					"@context": ["https://w3id.org/dspace/2024/1/context.json"],
					"@type": "TransferProcess",
					consumerPid: "generated-consumer-pid",
					providerPid: "provider-pid-push",
					state: DataspaceProtocolTransferProcessStateType.REQUESTED
				})
			};

			ComponentFactory.register("test-remote-cp-push", () => mockRemoteControlPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				remoteControlPlaneComponentType: "test-remote-cp-push"
			});

			const result = await service.prepareTransfer(
				"agreement-123",
				"http://provider.example.com",
				DataspaceTransferFormat.HttpDataPush,
				"valid-trust-payload"
			);

			expect(result.consumerPid).toBeDefined();

			// Verify the TransferRequestMessage sent to the provider includes the consumer /inbox
			expect(mockRemoteControlPlane.requestTransfer).toHaveBeenCalledWith(
				expect.objectContaining({
					"@type": "TransferRequestMessage",
					format: DataspaceTransferFormat.HttpDataPush,
					dataAddress: expect.objectContaining({
						endpoint: expect.stringContaining("/data-plane/data/inbox")
					})
				}),
				expect.anything()
			);

			// Verify the consumer-side storage entity also has dataAddress
			const stored = await transferProcessStorage.get(result.consumerPid, "consumerPid");
			expect(stored?.dataAddress).toBeDefined();
			expect(stored?.dataAddress?.endpoint).toContain("/data-plane/data/inbox");

			ComponentFactory.unregister("test-remote-cp-push");
		});

		test("should throw when HttpData-PUSH is requested but dataPlanePath is not configured", async () => {
			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				config: {}
			});

			await expect(
				service.prepareTransfer(
					"agreement-123",
					"http://provider.example.com",
					DataspaceTransferFormat.HttpDataPush,
					"valid-trust-payload"
				)
			).rejects.toThrow("pushTransferDataPathNotConfigured");
		});

		test("builds the consumer callbackAddress with the configured callbackPath and organization", async () => {
			const capturedRemote = {
				className: () => "MockRemoteControlPlane",
				requestTransfer: vi.fn().mockResolvedValue({
					"@context": ["https://w3id.org/dspace/2024/1/context.json"],
					"@type": "TransferProcess",
					consumerPid: "callback-test-consumer-pid",
					providerPid: "provider-pid-from-remote",
					state: DataspaceProtocolTransferProcessStateType.REQUESTED
				})
			};
			ComponentFactory.register("test-remote-cp-callback", () => capturedRemote);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				remoteControlPlaneComponentType: "test-remote-cp-callback",
				config: { dataPlanePath: "data-plane/data", callbackPath: "dataspace" }
			});

			await service.prepareTransfer(
				"agreement-123",
				"http://provider.example.com",
				"HttpData-PULL",
				"valid-trust-payload"
			);

			expect(capturedRemote.requestTransfer).toHaveBeenCalled();
			const sentMessage = capturedRemote.requestTransfer.mock.calls[0][0] as {
				callbackAddress: string;
			};
			// Control-plane mount path + organization query param, so the provider's TransferStart callback
			// routes back to the right consumer tenant. The org value is the CALLING node's ambient context
			// org (`resolveContextOrganizationId()`), which this shared fixture pins to
			// "did:iota:provider-node-xyz"; in a real consumer-initiated flow it is the consumer node's org.
			expect(sentMessage.callbackAddress).toBe(
				`https://test-origin.com/dataspace?${ContextIdKeys.Organization}=did%3Aiota%3Aprovider-node-xyz`
			);

			ComponentFactory.unregister("test-remote-cp-callback");
		});

		test("should throw GeneralError when provider returns a TransferError", async () => {
			const mockRemoteControlPlane = {
				className: () => "MockRemoteControlPlane",
				requestTransfer: vi.fn().mockResolvedValue({
					"@context": ["https://w3id.org/dspace/2024/1/context.json"],
					"@type": "TransferError",
					code: "GeneralError:policyViolation"
				})
			};

			ComponentFactory.register("test-remote-cp-error", () => mockRemoteControlPlane);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				remoteControlPlaneComponentType: "test-remote-cp-error"
			});

			await expect(
				service.prepareTransfer(
					"agreement-123",
					"http://provider.example.com",
					"HttpData-PULL",
					"valid-trust-payload"
				)
			).rejects.toThrow();

			ComponentFactory.unregister("test-remote-cp-error");
		});

		test("dispatches requestTransfer in-process when providerEndpoint is a local origin", async () => {
			// The remote REST client must never be used for a local-origin provider - the request
			// hop should run against this same instance (regression guard for #287).
			const mockRemoteControlPlane = {
				className: () => "MockRemoteControlPlane",
				requestTransfer: vi.fn().mockResolvedValue({
					"@context": ["https://w3id.org/dspace/2024/1/context.json"],
					"@type": "TransferProcess",
					consumerPid: "should-not-be-used",
					providerPid: "provider-pid-from-remote",
					state: DataspaceProtocolTransferProcessStateType.REQUESTED
				})
			};
			ComponentFactory.register("test-remote-cp-local", () => mockRemoteControlPlane);
			ComponentFactory.register("test-platform-local", () => ({
				...createSingleTenantPlatformComponent(),
				getLocalOriginContext: vi.fn().mockResolvedValue({
					[ContextIdKeys.Node]: "did:iota:test-node",
					[ContextIdKeys.Tenant]: "did:iota:test-tenant",
					[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
					[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
				})
			}));

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				remoteControlPlaneComponentType: "test-remote-cp-local",
				platformComponentType: "test-platform-local"
			});

			const result = await service.prepareTransfer(
				"agreement-123",
				"https://test-origin.com",
				"HttpData-PULL",
				"valid-trust-payload"
			);

			// Remote client was NOT used - the request ran in-process against this instance.
			expect(mockRemoteControlPlane.requestTransfer).not.toHaveBeenCalled();

			// Both role records were created and persisted in REQUESTED state (#318): the
			// provider record from the in-process requestTransfer and the consumer record
			// from prepareTransfer, sharing both pids but keyed on distinct internal ids.
			expect(result.consumerPid).toBeDefined();
			const records = (await transferProcessStorage.getStore()).filter(
				record => record.consumerPid === result.consumerPid
			);
			expect(records).toHaveLength(2);
			expect(records.map(record => record.localRole).sort()).toEqual([
				TransferProcessRole.Consumer,
				TransferProcessRole.Provider
			]);
			expect(records[0].id).not.toBe(records[1].id);
			for (const stored of records) {
				expect(stored.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);
				expect(stored.agreementId).toBe("agreement-123");
				// providerPid was minted by the real in-process requestTransfer (UUIDv7), not the
				// mock remote's static "provider-pid-from-remote".
				expect(stored.providerPid).toMatch(
					/^urn:uuid:[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i
				);
			}

			try {
				ComponentFactory.unregister("test-remote-cp-local");
				ComponentFactory.unregister("test-platform-local");
			} catch {}
		});
	});

	describe("resolveControlPlaneComponent() - locality-aware dispatch", () => {
		const LOCAL_CALLBACK = "https://local.example.com/callback";
		const REMOTE_CALLBACK = "https://remote.example.com/callback";

		async function seedProviderTransfer(
			consumerPid: string,
			callbackAddress: string
		): Promise<void> {
			await transferProcessStorage.set({
				id: consumerPid,
				consumerPid,
				providerPid: `provider-pid-for-${consumerPid}`,
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				agreementId: "agreement-123",
				datasetId: "dataset-123",
				offerId: "offer-123",
				format: DataspaceTransferFormat.HttpDataPull,
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				organizationIdentity: "did:iota:provider-node-xyz",
				localRole: TransferProcessRole.Provider,
				callbackAddress,
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});
		}

		test("dispatches to remote REST client when callbackAddress is not a local origin", async () => {
			const mockRemoteCP = {
				className: () => "MockRemoteCP",
				terminateTransfer: vi.fn().mockResolvedValue({
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
					consumerPid: "locality-remote-consumer",
					providerPid: "provider-pid-for-locality-remote-consumer",
					state: DataspaceProtocolTransferProcessStateType.TERMINATED
				})
			};
			ComponentFactory.register("test-locality-remote-cp", () => mockRemoteCP);
			ComponentFactory.register("test-locality-remote-platform", () => ({
				...createSingleTenantPlatformComponent(),
				getLocalOriginContext: vi.fn().mockResolvedValue(undefined)
			}));

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				remoteControlPlaneComponentType: "test-locality-remote-cp",
				platformComponentType: "test-locality-remote-platform"
			});

			await seedProviderTransfer("locality-remote-consumer", REMOTE_CALLBACK);

			await service.terminateTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferTerminationMessage",
					consumerPid: "locality-remote-consumer",
					providerPid: "provider-pid-for-locality-remote-consumer"
				},
				"valid-trust-payload"
			);

			expect(mockRemoteCP.terminateTransfer).toHaveBeenCalledOnce();

			try {
				ComponentFactory.unregister("test-locality-remote-cp");
				ComponentFactory.unregister("test-locality-remote-platform");
			} catch {}
		});

		test("dispatches in-process when callbackAddress is a local origin", async () => {
			const mockRemoteCP = {
				className: () => "MockRemoteCP",
				terminateTransfer: vi.fn().mockResolvedValue({
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
					consumerPid: "locality-local-consumer",
					providerPid: "provider-pid-for-locality-local-consumer",
					state: DataspaceProtocolTransferProcessStateType.TERMINATED
				})
			};
			ComponentFactory.register("test-locality-local-remote-cp", () => mockRemoteCP);
			ComponentFactory.register("test-locality-local-platform", () => ({
				...createSingleTenantPlatformComponent(),
				getLocalOriginContext: vi.fn().mockResolvedValue({
					[ContextIdKeys.Node]: "did:iota:test-node",
					[ContextIdKeys.Tenant]: "did:iota:test-tenant",
					[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
					[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
				})
			}));

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				remoteControlPlaneComponentType: "test-locality-local-remote-cp",
				platformComponentType: "test-locality-local-platform"
			});

			await seedProviderTransfer("locality-local-consumer", LOCAL_CALLBACK);

			await service.terminateTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferTerminationMessage",
					consumerPid: "locality-local-consumer",
					providerPid: "provider-pid-for-locality-local-consumer"
				},
				"valid-trust-payload"
			);

			// Remote component must NOT be invoked - the service called itself in-process.
			expect(mockRemoteCP.terminateTransfer).not.toHaveBeenCalled();

			try {
				ComponentFactory.unregister("test-locality-local-remote-cp");
				ComponentFactory.unregister("test-locality-local-platform");
			} catch {}
		});

		test("runs the in-process call under the target tenant context, not the caller context", async () => {
			// TARGET_CONTEXT deliberately uses a different Organization than the caller's ambient
			// "did:iota:provider-node-xyz" - this verifies the ContextIdStore.run receives the
			// context returned by getLocalOriginContext, not whatever the calling tenant happens to have.
			const TARGET_CONTEXT = {
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:consumer-tenant",
				[ContextIdKeys.Organization]: "did:iota:consumer-node-abc",
				[HttpContextIdKeys.PublicOrigin]: "https://local.example.com"
			};

			const mockRemoteCP = {
				className: () => "MockRemoteCP",
				terminateTransfer: vi.fn()
			};
			ComponentFactory.register("test-locality-ctx-cp", () => mockRemoteCP);
			ComponentFactory.register("test-locality-ctx-platform", () => ({
				...createSingleTenantPlatformComponent(),
				getLocalOriginContext: vi.fn().mockResolvedValue(TARGET_CONTEXT)
			}));

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				remoteControlPlaneComponentType: "test-locality-ctx-cp",
				platformComponentType: "test-locality-ctx-platform"
			});

			await seedProviderTransfer("locality-ctx-consumer", LOCAL_CALLBACK);

			const runSpy = vi.spyOn(ContextIdStore, "run");

			await service.terminateTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferTerminationMessage",
					consumerPid: "locality-ctx-consumer",
					providerPid: "provider-pid-for-locality-ctx-consumer"
				},
				"valid-trust-payload"
			);

			// Remote was not used - routing was in-process.
			expect(mockRemoteCP.terminateTransfer).not.toHaveBeenCalled();

			// ContextIdStore.run must have been called with exactly TARGET_CONTEXT so the inner
			// call executes in the target tenant's context, not the caller's.
			expect(runSpy).toHaveBeenCalledWith(TARGET_CONTEXT, expect.any(Function));

			runSpy.mockRestore();

			try {
				ComponentFactory.unregister("test-locality-ctx-cp");
				ComponentFactory.unregister("test-locality-ctx-platform");
			} catch {}
		});

		test("falls back to remote REST client when locality check throws", async () => {
			const mockRemoteCP = {
				className: () => "MockRemoteCP",
				terminateTransfer: vi.fn().mockResolvedValue({
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
					consumerPid: "locality-no-platform-consumer",
					providerPid: "provider-pid-for-locality-no-platform-consumer",
					state: DataspaceProtocolTransferProcessStateType.TERMINATED
				})
			};
			ComponentFactory.register("test-locality-no-platform-cp", () => mockRemoteCP);
			ComponentFactory.register("test-locality-throw-platform", () => ({
				...createSingleTenantPlatformComponent(),
				getLocalOriginContext: vi.fn().mockRejectedValue(new Error("platform unavailable"))
			}));

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				remoteControlPlaneComponentType: "test-locality-no-platform-cp",
				platformComponentType: "test-locality-throw-platform"
			});

			await seedProviderTransfer("locality-no-platform-consumer", REMOTE_CALLBACK);

			await service.terminateTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferTerminationMessage",
					consumerPid: "locality-no-platform-consumer",
					providerPid: "provider-pid-for-locality-no-platform-consumer"
				},
				"valid-trust-payload"
			);

			expect(mockRemoteCP.terminateTransfer).toHaveBeenCalledOnce();

			try {
				ComponentFactory.unregister("test-locality-no-platform-cp");
				ComponentFactory.unregister("test-locality-throw-platform");
			} catch {}
		});
	});

	describe("Stalled negotiation timeout (#225)", () => {
		test("cleanupStalledNegotiations notifies onTimeout for a timed-out negotiation and removes it", async () => {
			// A negative threshold forces any still-active negotiation to be treated as timed out, so the
			// assertion does not depend on wall-clock timing.
			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				config: { ...DEFAULT_SERVICE_OPTIONS.config, stalledNegotiationTimeoutMs: -1 }
			});

			const callbackSpy = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined),
				onTimeout: vi.fn().mockResolvedValue(undefined)
			};
			service.registerNegotiationCallback("timeout-listener", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "to-neg-001");
			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);
			expect(requester.getActiveNegotiations().has("to-neg-001")).toBe(true);

			await (
				service as unknown as { cleanupStalledNegotiations(): Promise<void> }
			).cleanupStalledNegotiations();

			expect(callbackSpy.onTimeout).toHaveBeenCalledWith("to-neg-001");
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
			expect(requester.getActiveNegotiations().has("to-neg-001")).toBe(false);
		});

		test("cleanupStalledNegotiations falls back to onFailed(negotiationStalled) when onTimeout is not implemented", async () => {
			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				config: { ...DEFAULT_SERVICE_OPTIONS.config, stalledNegotiationTimeoutMs: -1 }
			});

			const callbackSpy = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};
			service.registerNegotiationCallback("fallback-listener", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "to-neg-002");
			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"valid-trust-payload"
			);

			await (
				service as unknown as { cleanupStalledNegotiations(): Promise<void> }
			).cleanupStalledNegotiations();

			expect(callbackSpy.onFailed).toHaveBeenCalledWith("to-neg-002", "negotiationStalled");
		});
	});

	describe("Stalled transfer timeout (#226)", () => {
		async function seedRequestedTransfer(
			id: string,
			consumerPid: string,
			localRole: TransferProcessRole
		): Promise<void> {
			await transferProcessStorage.set({
				id,
				consumerPid,
				providerPid: "urn:uuid:provider-pid-stalled",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				agreementId: "agreement-stalled",
				datasetId: "urn:uuid:dataset-stalled",
				consumerIdentity: "did:iota:consumer",
				providerIdentity: "did:iota:provider",
				localRole,
				offerId: "agreement-stalled",
				format: "HttpData-PULL",
				organizationIdentity: "did:iota:provider-node-xyz",
				// 1970: far older than any threshold, so it is unambiguously past the timeout window.
				dateCreated: new Date(0).toISOString(),
				dateModified: new Date(0).toISOString()
			});
		}

		test("cleanupStalledTransfers notifies onTimeout for a stalled consumer transfer and removes it", async () => {
			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				config: { ...DEFAULT_SERVICE_OPTIONS.config, stalledTransferTimeoutMs: 0 }
			});

			const id = Converter.bytesToHex(RandomHelper.generate(32));
			const consumerPid = "urn:uuid:stalled-transfer-001";
			await seedRequestedTransfer(id, consumerPid, TransferProcessRole.Consumer);

			const callbackSpy = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined),
				onTimeout: vi.fn().mockResolvedValue(undefined)
			};
			service.registerTransferCallback("timeout-listener", callbackSpy);

			await (
				service as unknown as { cleanupStalledTransfers(): Promise<void> }
			).cleanupStalledTransfers();

			expect(callbackSpy.onTimeout).toHaveBeenCalledWith(consumerPid);
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
			expect(await transferProcessStorage.get(consumerPid, "consumerPid")).toBeUndefined();
		});

		test("cleanupStalledTransfers leaves a provider-side REQUESTED transfer alone", async () => {
			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				config: { ...DEFAULT_SERVICE_OPTIONS.config, stalledTransferTimeoutMs: 0 }
			});

			const id = Converter.bytesToHex(RandomHelper.generate(32));
			const consumerPid = "urn:uuid:provider-side-001";
			await seedRequestedTransfer(id, consumerPid, TransferProcessRole.Provider);

			const callbackSpy = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined),
				onTimeout: vi.fn().mockResolvedValue(undefined)
			};
			service.registerTransferCallback("provider-side-listener", callbackSpy);

			await (
				service as unknown as { cleanupStalledTransfers(): Promise<void> }
			).cleanupStalledTransfers();

			expect(callbackSpy.onTimeout).not.toHaveBeenCalled();
			expect(await transferProcessStorage.get(consumerPid, "consumerPid")).toBeDefined();
		});
	});

	describe("Provider transfer lifecycle policies (#240)", () => {
		const PROVIDER_IDENTITY = "did:iota:provider";

		/**
		 * Seed a Provider/Consumer transfer for the policy sweep tests. Defaults to a STARTED
		 * PULL record whose dateModified is 1970, far older than any threshold.
		 * @param consumerPid The consumerPid (indexed).
		 * @param localRole The persisted local role, or undefined for a legacy record.
		 * @param options Optional overrides.
		 * @param options.state The transfer state (defaults to STARTED).
		 * @param options.dateModified The last-modified timestamp (defaults to 1970).
		 * @param options.organizationIdentity The owning organization (defaults to the ambient test org).
		 * @param options.omitProviderIdentity Seed the record without a provider identity.
		 * @param options.format The transfer format (defaults to HttpData-PULL).
		 */
		async function seedPolicyTransfer(
			consumerPid: string,
			localRole: TransferProcessRole | undefined,
			options?: {
				state?: DataspaceProtocolTransferProcessStateType;
				dateModified?: string;
				organizationIdentity?: string;
				omitProviderIdentity?: boolean;
				format?: string;
			}
		): Promise<void> {
			await transferProcessStorage.set({
				id: Converter.bytesToHex(RandomHelper.generate(32)),
				consumerPid,
				providerPid: `provider-pid-for-${consumerPid}`,
				state: options?.state ?? DataspaceProtocolTransferProcessStateType.STARTED,
				agreementId: "agreement-policy",
				datasetId: "urn:uuid:dataset-policy",
				consumerIdentity: "did:iota:consumer",
				...(options?.omitProviderIdentity === true ? {} : { providerIdentity: PROVIDER_IDENTITY }),
				...(localRole === undefined ? {} : { localRole }),
				offerId: "agreement-policy",
				format: options?.format ?? "HttpData-PULL",
				organizationIdentity: options?.organizationIdentity ?? "did:iota:provider-node-xyz",
				dateCreated: new Date(0).toISOString(),
				dateModified: options?.dateModified ?? new Date(0).toISOString()
			});
		}

		/**
		 * Seed a retrieval marker for a transfer.
		 * @param consumerPid The consumerPid.
		 * @param dateLastRetrieved The last retrieval timestamp.
		 */
		async function seedRetrieval(consumerPid: string, dateLastRetrieved: string): Promise<void> {
			await transferRetrievalStorage.set({
				consumerPid,
				dateFirstRetrieved: dateLastRetrieved,
				dateLastRetrieved
			});
		}

		/**
		 * Seed the policy dataset with an idle override.
		 * @param transferIdleTimeoutMs The dataset-level idle window.
		 */
		async function seedDatasetOverride(transferIdleTimeoutMs: number): Promise<void> {
			await dataspaceAppDatasetStorage.set({
				id: "urn:uuid:dataset-policy",
				organizationIdentity: "did:iota:provider-node-xyz",
				appId: "policy-app",
				dataset: {},
				transferIdleTimeoutMs,
				dateCreated: new Date(0).toISOString(),
				dateModified: new Date(0).toISOString()
			});
		}

		/**
		 * Construct a service with the idle policy configured and a trust component resolving
		 * to the provider identity (required by the terminate auth gate).
		 * @param providerTransferIdleTimeoutMs The idle policy window.
		 * @returns The service.
		 */
		function createPolicyService(
			providerTransferIdleTimeoutMs?: number
		): DataspaceControlPlaneService {
			try {
				ComponentFactory.unregister("test-trust");
			} catch {}
			ComponentFactory.register("test-trust", () => createMockTrustComponent(PROVIDER_IDENTITY));
			return new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				config: { ...DEFAULT_SERVICE_OPTIONS.config, providerTransferIdleTimeoutMs }
			});
		}

		/**
		 * Creates a full transfer callback spy object.
		 * @param withOnTimeout Whether the spy implements the optional onTimeout hook.
		 * @returns The callback spy.
		 */
		function createCallbackSpy(withOnTimeout: boolean = true): ITransferCallback {
			return {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined),
				...(withOnTimeout ? { onTimeout: vi.fn().mockResolvedValue(undefined) } : {})
			};
		}

		/**
		 * Run the private policy sweep.
		 * @param service The service.
		 */
		async function runSweep(service: DataspaceControlPlaneService): Promise<void> {
			await (
				service as unknown as { applyProviderTransferPolicies(): Promise<void> }
			).applyProviderTransferPolicies();
		}

		test("applyProviderTransferPolicies terminates a never-retrieved transfer idle beyond the window", async () => {
			const service = createPolicyService(1);
			const consumerPid = "urn:uuid:policy-idle-001";
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider);

			const callbackSpy = createCallbackSpy();
			service.registerTransferCallback("policy-idle-listener", callbackSpy);

			await runSweep(service);

			const stored = await transferProcessStorage.get(consumerPid, "consumerPid");
			expect(stored?.state).toBe(DataspaceProtocolTransferProcessStateType.TERMINATED);
			expect(callbackSpy.onTimeout).toHaveBeenCalledWith(consumerPid);
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
			// Local onTerminated only fires for Consumer-role transitions; the provider role notifies
			// the consumer node via its callbackAddress instead (none is set here).
			expect(callbackSpy.onTerminated).not.toHaveBeenCalled();
		});

		test("applyProviderTransferPolicies falls back to onFailed(idleTimeout) when onTimeout is not implemented", async () => {
			const service = createPolicyService(1);
			const consumerPid = "urn:uuid:policy-idle-002";
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider);

			const callbackSpy = createCallbackSpy(false);
			service.registerTransferCallback("policy-fallback-listener", callbackSpy);

			await runSweep(service);

			expect(callbackSpy.onFailed).toHaveBeenCalledWith(
				consumerPid,
				TransferTerminationCode.IdleTimeout
			);
			expect((await transferProcessStorage.get(consumerPid, "consumerPid"))?.state).toBe(
				DataspaceProtocolTransferProcessStateType.TERMINATED
			);
		});

		test("applyProviderTransferPolicies leaves a transfer with a recent state change alone", async () => {
			const service = createPolicyService(60 * 60 * 1000);
			const consumerPid = "urn:uuid:policy-recent-001";
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider, {
				dateModified: new Date().toISOString()
			});

			const callbackSpy = createCallbackSpy();
			service.registerTransferCallback("policy-recent-listener", callbackSpy);

			await runSweep(service);

			expect((await transferProcessStorage.get(consumerPid, "consumerPid"))?.state).toBe(
				DataspaceProtocolTransferProcessStateType.STARTED
			);
			expect(callbackSpy.onTimeout).not.toHaveBeenCalled();
		});

		test("applyProviderTransferPolicies leaves a transfer with a recent retrieval alone", async () => {
			const service = createPolicyService(1);
			const consumerPid = "urn:uuid:policy-active-001";
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider);
			await seedRetrieval(consumerPid, new Date(Date.now() + 60000).toISOString());

			await runSweep(service);

			expect((await transferProcessStorage.get(consumerPid, "consumerPid"))?.state).toBe(
				DataspaceProtocolTransferProcessStateType.STARTED
			);
		});

		test("applyProviderTransferPolicies terminates a transfer whose retrieval and state are both stale", async () => {
			const service = createPolicyService(1);
			const consumerPid = "urn:uuid:policy-stale-001";
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider);
			await seedRetrieval(consumerPid, new Date(0).toISOString());

			await runSweep(service);

			expect((await transferProcessStorage.get(consumerPid, "consumerPid"))?.state).toBe(
				DataspaceProtocolTransferProcessStateType.TERMINATED
			);
			// The marker is removed once the transfer reaches a terminal state.
			expect(await transferRetrievalStorage.get(consumerPid)).toBeUndefined();
		});

		test("applyProviderTransferPolicies keeps a resumed transfer alive despite an old retrieval", async () => {
			const service = createPolicyService(1);
			const consumerPid = "urn:uuid:policy-resumed-001";
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider, {
				dateModified: new Date(Date.now() + 60000).toISOString()
			});
			await seedRetrieval(consumerPid, new Date(0).toISOString());

			await runSweep(service);

			expect((await transferProcessStorage.get(consumerPid, "consumerPid"))?.state).toBe(
				DataspaceProtocolTransferProcessStateType.STARTED
			);
		});

		test("a dataset-level idle override enables the policy without node config", async () => {
			const service = createPolicyService();
			const consumerPid = "urn:uuid:policy-dataset-001";
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider);
			await seedDatasetOverride(1);

			await runSweep(service);

			expect((await transferProcessStorage.get(consumerPid, "consumerPid"))?.state).toBe(
				DataspaceProtocolTransferProcessStateType.TERMINATED
			);
		});

		test("a dataset-level idle override of 0 disables the policy despite node config", async () => {
			const service = createPolicyService(1);
			const consumerPid = "urn:uuid:policy-dataset-002";
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider);
			await seedDatasetOverride(0);

			await runSweep(service);

			expect((await transferProcessStorage.get(consumerPid, "consumerPid"))?.state).toBe(
				DataspaceProtocolTransferProcessStateType.STARTED
			);
		});

		test("applyProviderTransferPolicies skips PUSH transfers", async () => {
			const service = createPolicyService(1);
			const consumerPid = "urn:uuid:policy-push-001";
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider, {
				format: "HttpData-PUSH"
			});

			await runSweep(service);

			expect((await transferProcessStorage.get(consumerPid, "consumerPid"))?.state).toBe(
				DataspaceProtocolTransferProcessStateType.STARTED
			);
		});

		test("applyProviderTransferPolicies skips the policy when the retrieval storage is not registered", async () => {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<TransferRetrieval>());
			try {
				const service = createPolicyService(1);
				const consumerPid = "urn:uuid:policy-nostorage-001";
				await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider);

				await runSweep(service);

				expect((await transferProcessStorage.get(consumerPid, "consumerPid"))?.state).toBe(
					DataspaceProtocolTransferProcessStateType.STARTED
				);
			} finally {
				EntityStorageConnectorFactory.register(
					nameofKebabCase<TransferRetrieval>(),
					() => transferRetrievalStorage
				);
			}
		});

		test("applyProviderTransferPolicies skips Consumer-role and legacy records without a localRole", async () => {
			const service = createPolicyService(1);
			await seedPolicyTransfer("urn:uuid:policy-consumer-001", TransferProcessRole.Consumer);
			await seedPolicyTransfer("urn:uuid:policy-legacy-001", undefined);

			const callbackSpy = createCallbackSpy();
			service.registerTransferCallback("policy-skip-listener", callbackSpy);

			await runSweep(service);

			expect(
				(await transferProcessStorage.get("urn:uuid:policy-consumer-001", "consumerPid"))?.state
			).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			expect(
				(await transferProcessStorage.get("urn:uuid:policy-legacy-001", "consumerPid"))?.state
			).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			expect(callbackSpy.onTimeout).not.toHaveBeenCalled();
		});

		test("applyProviderTransferPolicies skips transfers already in a terminal state", async () => {
			const service = createPolicyService(1);
			const consumerPid = "urn:uuid:policy-terminal-001";
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider, {
				state: DataspaceProtocolTransferProcessStateType.COMPLETED
			});

			await runSweep(service);

			expect((await transferProcessStorage.get(consumerPid, "consumerPid"))?.state).toBe(
				DataspaceProtocolTransferProcessStateType.COMPLETED
			);
		});

		test("a sweep termination racing an already-terminated transfer hits the idempotency guard", async () => {
			const service = createPolicyService(1);
			const consumerPid = "urn:uuid:policy-race-001";
			// The transfer was TERMINATED between the sweep's query and its transition: the DSP
			// idempotency guard must absorb the retry.
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider, {
				state: DataspaceProtocolTransferProcessStateType.TERMINATED
			});
			const staleEntity = await transferProcessStorage.get(consumerPid, "consumerPid");

			const result = await (
				service as unknown as {
					terminateProviderPolicyTransfer(
						t: TransferProcess,
						code: TransferTerminationCode
					): Promise<boolean>;
				}
			).terminateProviderPolicyTransfer(
				staleEntity as TransferProcess,
				TransferTerminationCode.IdleTimeout
			);

			expect(result).toBe(true);
			expect((await transferProcessStorage.get(consumerPid, "consumerPid"))?.state).toBe(
				DataspaceProtocolTransferProcessStateType.TERMINATED
			);
		});

		test("applyProviderTransferPolicies establishes the owning organization context for the transition", async () => {
			const service = createPolicyService(1);
			const consumerPid = "urn:uuid:policy-org-001";
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider, {
				organizationIdentity: "did:iota:other-org"
			});

			// Use the real context store: the sweep runs outside any request context (no ambient
			// Organization), so the transition only succeeds because the sweep establishes the
			// transfer's owning organization itself.
			vi.mocked(ContextIdStore.getContextIds).mockRestore();

			await runSweep(service);

			expect((await transferProcessStorage.get(consumerPid, "consumerPid"))?.state).toBe(
				DataspaceProtocolTransferProcessStateType.TERMINATED
			);
		});

		test("applyProviderTransferPolicies removes a Provider-side STARTED transfer without a provider identity", async () => {
			const service = createPolicyService(1);
			const consumerPid = "urn:uuid:policy-no-identity-001";
			await seedPolicyTransfer(consumerPid, TransferProcessRole.Provider, {
				omitProviderIdentity: true
			});

			await runSweep(service);

			expect(await transferProcessStorage.get(consumerPid, "consumerPid")).toBeUndefined();
		});

		test("start always registers the policy sweep task with the configured interval", async () => {
			const addTask = vi.fn().mockResolvedValue(undefined);
			const removeTask = vi.fn().mockResolvedValue(undefined);
			ComponentFactory.register("test-task-scheduler", () => ({
				className: () => "MockTaskScheduler",
				addTask,
				removeTask,
				tasksInfo: vi.fn()
			}));
			Factory.createFactory("engine-core").register("engine", () => createMockEngineCore());

			try {
				const defaultService = new DataspaceControlPlaneService({
					...DEFAULT_SERVICE_OPTIONS,
					taskSchedulerComponentType: "test-task-scheduler"
				});
				await defaultService.start();
				expect(addTask).toHaveBeenCalledTimes(3);
				expect(addTask).toHaveBeenCalledWith(
					"control-plane-transfer-policy",
					expect.anything(),
					expect.any(Function)
				);
				await defaultService.stop();
				expect(removeTask).toHaveBeenCalledTimes(3);

				addTask.mockClear();

				const intervalService = new DataspaceControlPlaneService({
					...DEFAULT_SERVICE_OPTIONS,
					taskSchedulerComponentType: "test-task-scheduler",
					config: {
						...DEFAULT_SERVICE_OPTIONS.config,
						providerTransferPolicySweepIntervalMs: 90000
					}
				});
				await intervalService.start();
				// 90000ms rounds to 2 whole minutes (the scheduler has minute granularity).
				expect(addTask).toHaveBeenCalledWith(
					"control-plane-transfer-policy",
					[expect.objectContaining({ intervalMinutes: 2 })],
					expect.any(Function)
				);
				await intervalService.stop();
			} finally {
				try {
					ComponentFactory.unregister("test-task-scheduler");
					Factory.createFactory("engine-core").unregister("engine");
				} catch {}
			}
		});
	});

	describe("Self transfer (#318)", () => {
		// Same actor on both sides: one node, one org partition, assigner === assignee.
		const SELF_IDENTITY = "did:iota:self-node-org";
		const SELF_AGREEMENT_ID = "agreement-self-318";
		const SELF_DATASET_ID = "urn:uuid:dataset-self-318";

		beforeEach(async () => {
			await mockPap.create({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": SELF_AGREEMENT_ID,
				uid: SELF_AGREEMENT_ID,
				assigner: SELF_IDENTITY,
				assignee: SELF_IDENTITY,
				target: SELF_DATASET_ID,
				permission: [{ action: "read" }]
			} as never);

			// Catalogue dataset whose offer is assigned by the SAME identity the agreement uses,
			// so the agreement-to-offer derivation check passes for the self actor.
			mockFedCat.addDataset(SELF_DATASET_ID, {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "dcat:Dataset",
				"@id": SELF_DATASET_ID,
				"dcterms:title": "Self Transfer Dataset 318",
				"dcat:distribution": [{ "dcterms:format": "HttpData-PULL" }],
				"odrl:hasPolicy": [
					{
						"@type": "odrl:Offer",
						"@id": "offer-self-318",
						assigner: SELF_IDENTITY,
						permission: [
							{
								action: "read"
							}
						]
					}
				]
			} as never);

			ComponentFactory.register("test-trust-self", () => createMockTrustComponent(SELF_IDENTITY));
			ComponentFactory.register("test-remote-cp-self", () => ({
				className: () => "MockRemoteControlPlane",
				requestTransfer: vi.fn(),
				startTransfer: vi.fn(),
				completeTransfer: vi.fn(),
				suspendTransfer: vi.fn(),
				terminateTransfer: vi.fn()
			}));
			ComponentFactory.register("test-platform-self", () => ({
				...createSingleTenantPlatformComponent(),
				// Every URL resolves as local, so the request hop and all callback deliveries
				// run in-process against the same service instance and storage partition.
				getLocalOriginContext: vi.fn().mockResolvedValue({
					[ContextIdKeys.Node]: "did:iota:test-node",
					[ContextIdKeys.Tenant]: "did:iota:test-tenant",
					[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
					[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
				})
			}));
		});

		afterEach(() => {
			try {
				ComponentFactory.unregister("test-trust-self");
				ComponentFactory.unregister("test-remote-cp-self");
				ComponentFactory.unregister("test-platform-self");
			} catch {}
		});

		function createSelfService(extraConfig?: {
			autoStartTransfers?: boolean;
			stalledTransferTimeoutMs?: number;
		}): DataspaceControlPlaneService {
			return new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-self",
				remoteControlPlaneComponentType: "test-remote-cp-self",
				platformComponentType: "test-platform-self",
				config: { ...DEFAULT_SERVICE_OPTIONS.config, ...extraConfig }
			});
		}

		/**
		 * Seed both role records of a self transfer, sharing both pids within one partition.
		 * @param state The state to seed both records with.
		 * @returns The shared pids.
		 */
		async function seedSelfTransferPair(
			state: DataspaceProtocolTransferProcessStateType
		): Promise<{ consumerPid: string; providerPid: string }> {
			const consumerPid = "urn:uuid:self-consumer-pid-318";
			const providerPid = "urn:uuid:self-provider-pid-318";
			const base = {
				consumerPid,
				providerPid,
				state,
				agreementId: SELF_AGREEMENT_ID,
				datasetId: SELF_DATASET_ID,
				offerId: SELF_AGREEMENT_ID,
				consumerIdentity: SELF_IDENTITY,
				providerIdentity: SELF_IDENTITY,
				organizationIdentity: "did:iota:provider-node-xyz",
				format: DataspaceTransferFormat.HttpDataPull,
				callbackAddress: "https://test-origin.com",
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			};
			await transferProcessStorage.set({
				...base,
				id: "self-provider-record",
				localRole: TransferProcessRole.Provider
			});
			await transferProcessStorage.set({
				...base,
				id: "self-consumer-record",
				localRole: TransferProcessRole.Consumer
			});
			return { consumerPid, providerPid };
		}

		async function getSelfRecords(consumerPid: string): Promise<TransferProcess[]> {
			return (await transferProcessStorage.getStore()).filter(
				record => record.consumerPid === consumerPid
			);
		}

		test("prepareTransfer persists one record per role instead of overwriting", async () => {
			const service = createSelfService();

			const result = await service.prepareTransfer(
				SELF_AGREEMENT_ID,
				"https://test-origin.com",
				"HttpData-PULL",
				"valid-trust-payload"
			);

			const records = await getSelfRecords(result.consumerPid);
			expect(records).toHaveLength(2);
			expect(records.map(record => record.localRole).sort()).toEqual([
				TransferProcessRole.Consumer,
				TransferProcessRole.Provider
			]);
			expect(records[0].id).not.toBe(records[1].id);
			expect(records[0].providerPid).toBe(records[1].providerPid);
			for (const record of records) {
				expect(record.consumerIdentity).toBe(SELF_IDENTITY);
				expect(record.providerIdentity).toBe(SELF_IDENTITY);
				expect(record.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);
			}
		});

		test("auto-start deterministically starts the provider record and cascades to the consumer record", async () => {
			const service = createSelfService({ autoStartTransfers: true });

			const startedPids: string[] = [];
			service.registerTransferCallback("self-autostart-listener", {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined),
				onStarted: async (consumerPid: string) => {
					startedPids.push(consumerPid);
				}
			});

			const result = await service.prepareTransfer(
				SELF_AGREEMENT_ID,
				"https://test-origin.com",
				"HttpData-PULL",
				"valid-trust-payload"
			);

			// runProviderStart is scheduled via setTimeout(0); wait until BOTH records reach
			// STARTED (provider via the auto-start, consumer via the in-process callback delivery).
			await vi.waitFor(async () => {
				const records = await getSelfRecords(result.consumerPid);
				expect(records).toHaveLength(2);
				for (const record of records) {
					expect(record.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
				}
			});

			expect(startedPids).toEqual([result.consumerPid]);
		});

		test("suspendTransfer transitions both role records through the in-process callback delivery", async () => {
			const { consumerPid, providerPid } = await seedSelfTransferPair(
				DataspaceProtocolTransferProcessStateType.STARTED
			);
			const service = createSelfService();

			const suspendedEvents: { pid: string; reason?: string }[] = [];
			service.registerTransferCallback("self-suspend-listener", {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined),
				onSuspended: async (pid: string, reason?: string) => {
					suspendedEvents.push({ pid, reason });
				}
			});

			const message: IDataspaceProtocolTransferSuspensionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferSuspensionMessage",
				consumerPid,
				providerPid,
				reason: ["Self suspension"]
			};
			const response = await service.suspendTransfer(message, "valid-trust-payload");

			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const records = await getSelfRecords(consumerPid);
			expect(records).toHaveLength(2);
			for (const record of records) {
				expect(record.state).toBe(DataspaceProtocolTransferProcessStateType.SUSPENDED);
			}
			// The consumer-record leg fired the internal callback.
			expect(suspendedEvents).toEqual([{ pid: consumerPid, reason: "Self suspension" }]);
		});

		test("terminateTransfer transitions both role records through the in-process callback delivery", async () => {
			const { consumerPid, providerPid } = await seedSelfTransferPair(
				DataspaceProtocolTransferProcessStateType.STARTED
			);
			const service = createSelfService();

			const terminatedPids: string[] = [];
			service.registerTransferCallback("self-terminate-listener", {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: async (pid: string) => {
					terminatedPids.push(pid);
				}
			});

			const message: IDataspaceProtocolTransferTerminationMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferTerminationMessage",
				consumerPid,
				providerPid,
				reason: ["Self termination"]
			};
			const response = await service.terminateTransfer(message, "valid-trust-payload");

			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const records = await getSelfRecords(consumerPid);
			expect(records).toHaveLength(2);
			for (const record of records) {
				expect(record.state).toBe(DataspaceProtocolTransferProcessStateType.TERMINATED);
			}
			expect(terminatedPids).toEqual([consumerPid]);
		});

		test("completeTransfer completes the consumer record first, then the provider record on a second call", async () => {
			const { consumerPid, providerPid } = await seedSelfTransferPair(
				DataspaceProtocolTransferProcessStateType.STARTED
			);
			const service = createSelfService();

			const completedPids: string[] = [];
			service.registerTransferCallback("self-complete-listener", {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined),
				onCompleted: async (pid: string) => {
					completedPids.push(pid);
				}
			});

			const message: IDataspaceProtocolTransferCompletionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferCompletionMessage",
				consumerPid,
				providerPid
			};

			// First call: the consumer record completes (and internal callbacks fire); completion
			// has no onward delivery, so the provider record intentionally stays STARTED.
			const firstResponse = await service.completeTransfer(message, "valid-trust-payload");
			expect(firstResponse["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			let records = await getSelfRecords(consumerPid);
			const consumerRecord = records.find(
				record => record.localRole === TransferProcessRole.Consumer
			);
			const providerRecord = records.find(
				record => record.localRole === TransferProcessRole.Provider
			);
			expect(consumerRecord?.state).toBe(DataspaceProtocolTransferProcessStateType.COMPLETED);
			expect(providerRecord?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			expect(completedPids).toEqual([consumerPid]);

			// Second call (the consumer→provider DSP hop): the provider record completes.
			const secondResponse = await service.completeTransfer(message, "valid-trust-payload");
			expect(secondResponse["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			records = await getSelfRecords(consumerPid);
			expect(records).toHaveLength(2);
			for (const record of records) {
				expect(record.state).toBe(DataspaceProtocolTransferProcessStateType.COMPLETED);
			}
			// The internal callback fired only for the consumer-record leg.
			expect(completedPids).toEqual([consumerPid]);
		});

		test("stalled cleanup removes only the consumer record of a self transfer", async () => {
			const { consumerPid } = await seedSelfTransferPair(
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);
			// Age both records far past any timeout window.
			for (const record of await getSelfRecords(consumerPid)) {
				await transferProcessStorage.set({ ...record, dateModified: new Date(0).toISOString() });
			}
			const service = createSelfService({ stalledTransferTimeoutMs: 0 });

			await (
				service as unknown as { cleanupStalledTransfers(): Promise<void> }
			).cleanupStalledTransfers();

			const records = await getSelfRecords(consumerPid);
			expect(records).toHaveLength(1);
			expect(records[0].localRole).toBe(TransferProcessRole.Provider);
		});
	});
});
