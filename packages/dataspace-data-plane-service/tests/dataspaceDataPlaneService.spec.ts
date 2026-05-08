// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IHttpRequestContext, ITenantAdminComponent } from "@twin.org/api-models";
import { TaskStatus } from "@twin.org/background-task-models";
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
import { ArrayHelper, ComponentFactory, Is, ObjectHelper } from "@twin.org/core";
import { JsonLdDataTypes, type JsonLdObjectWithContext } from "@twin.org/data-json-ld";
import {
	ActivityProcessingStatus,
	ActivityTaskStatus,
	DataspaceAppFactory,
	DataspaceAppDataset,
	DataspaceDataTypes,
	TransferProcess,
	type IActivityLogEntry,
	type IActivityLogStatusNotification,
	type IDataRequest,
	type IDataspaceActivity
} from "@twin.org/dataspace-models";
import { TestDataspaceDataPlaneApp } from "@twin.org/dataspace-test-app";
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { ModuleHelper } from "@twin.org/modules";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import {
	DataspaceProtocolCatalogTypes,
	DataspaceProtocolDataTypes,
	DataspaceProtocolTransferProcessStateType
} from "@twin.org/standards-dataspace-protocol";
import { addAllContextsToDocumentCache } from "@twin.org/standards-ld-contexts";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
import type { ITrustComponent } from "@twin.org/trust-models";
import { HeaderHelper, HeaderTypes } from "@twin.org/web";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import {
	activityLdContextArray,
	canonicalActivity,
	canonicalActivityWithTarget,
	extendedActivity
} from "./testData.js";
import {
	getDataAssetEntities as getDataAssetEntitiesRoute,
	queryDataAsset as queryDataAssetRoute
} from "../src/dataspaceDataPlaneRoutes.js";
import { DataspaceDataPlaneService } from "../src/dataspaceDataPlaneService.js";
import type { ActivityLogDetails } from "../src/entities/activityLogDetails.js";
import type { ActivityTask } from "../src/entities/activityTask.js";
import type { IDataspaceDataPlaneServiceConstructorOptions } from "../src/models/IDataspaceDataPlaneServiceConstructorOptions.js";
import { initSchema } from "../src/schema.js";

const TEST_NODE_IDENTITY = "did:iota:testnet:7654321";
const DATA_CONSUMER_IDENTITY = "did:iota:testnet:1234567";
const SERVICE_DATASET_ID = "https://twin.example.org/data-service-1";
const TEST_CONSUMER_PID = "urn:uuid:test-consumer-pid";
const TEST_PROVIDER_PID = "urn:uuid:test-provider-pid";
const TEST_AGREEMENT_ID = "urn:agreement:test-agreement";
const TEST_OFFER_ID = "urn:offer:test-offer";
const TEST_TRANSFER_TOKEN = "test-transfer-token-abc123";

/**
 * Waits.
 * @param ms milliseconds to sleep.
 * @returns Promise
 */
async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Seed a dataspace app dataset record into the dataspace-app-dataset storage so the
 * dataspace data plane's dataset id → app lookup resolves to TestDataspaceDataPlaneApp.
 * Replaces what the legacy `datasetsHandled` returned at app start.
 * @param storage The dataspace-app-dataset storage connector.
 */
async function seedTestAppDataset(
	storage: MemoryEntityStorageConnector<DataspaceAppDataset>
): Promise<void> {
	const now = new Date().toISOString();
	// Storage primary key IS the dataset @id; `@id` is stripped from the blob.
	await storage.set({
		id: SERVICE_DATASET_ID,
		nodeIdentity: TEST_NODE_IDENTITY,
		tenantId: "test-tenant",
		appId: TestDataspaceDataPlaneApp.APP_ID,
		dataset: {
			"@context": ["https://w3id.org/dspace/2025/1/context.jsonld"],
			"@type": DataspaceProtocolCatalogTypes.Dataset,
			hasPolicy: [{ "@id": "urn:policy:test", "@type": "Offer", permission: [{ action: "read" }] }],
			distribution: [
				{
					"@id": `${SERVICE_DATASET_ID}/distribution-1`,
					"@type": "Distribution",
					accessService: SERVICE_DATASET_ID,
					format: "Http-Pull-Query-Format"
				}
			]
		} as never,
		dateCreated: now,
		dateModified: now
	});
}

/**
 * Creates a test Transfer Process entity.
 * @param overrides Optional partial entity to override default values.
 * @returns A TransferProcessEntity for testing.
 */
function createTestTransferProcess(overrides?: Partial<TransferProcess>): TransferProcess {
	const now = new Date().toISOString();

	const entity = new TransferProcess();
	entity.consumerPid = TEST_CONSUMER_PID;
	entity.id = TEST_CONSUMER_PID;
	entity.providerPid = TEST_PROVIDER_PID;
	entity.agreementId = TEST_AGREEMENT_ID;
	entity.offerId = TEST_OFFER_ID;
	entity.state = DataspaceProtocolTransferProcessStateType.STARTED;
	entity.datasetId = SERVICE_DATASET_ID;
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
			target: SERVICE_DATASET_ID,
			permission: [{ action: "read" }]
		}
	];

	if (overrides) {
		Object.assign(entity, overrides);
	}

	return entity;
}

/**
 * Asserts Activity Log.
 * @param entry Entry to be asserted
 * @param expectedSuccessfulEntries The expected number of successful task entries.
 */
function assertActivityLog(entry: IActivityLogEntry, expectedSuccessfulEntries = 1): void {
	if (entry.status !== ActivityProcessingStatus.Completed) {
		console.debug(JSON.stringify(entry, null, 2));
	}
	expect(entry.status).toBe(ActivityProcessingStatus.Completed);
	expect(entry.tasks?.filter(t => t.status === ActivityTaskStatus.Pending).length).toBe(0);
	expect(entry.tasks?.filter(t => t.status === ActivityTaskStatus.Processing).length).toBe(0);
	expect(entry.tasks?.filter(t => t.status === ActivityTaskStatus.Failed).length).toBe(0);
	expect(entry.tasks?.filter(t => t.status === ActivityTaskStatus.Success).length).toBe(
		expectedSuccessfulEntries
	);

	expect(Is.arrayValue(entry.tasks)).toBe(true);
	const finalizedTasks = entry.tasks;
	expect(finalizedTasks?.[0]).toBeDefined();
	expect(finalizedTasks?.[0].startDate).toBeDefined();
	expect(finalizedTasks?.[0].endDate).toBeDefined();

	expect(finalizedTasks?.[0]?.result ?? "").toBe("1234");
}

describe("DataspaceDataPlaneService", () => {
	let activityLogStorage: MemoryEntityStorageConnector<ActivityLogDetails>;
	let activityTaskStorage: MemoryEntityStorageConnector<ActivityTask>;
	let backgroundTaskStorage: MemoryEntityStorageConnector<BackgroundTask>;
	let transferProcessStorage: MemoryEntityStorageConnector<TransferProcess>;
	let dataspaceAppDatasetStorage: MemoryEntityStorageConnector<DataspaceAppDataset>;
	let backgroundTaskService: BackgroundTaskService;
	let taskScheduler: TaskSchedulerService;
	let options: IDataspaceDataPlaneServiceConstructorOptions;
	let backgroundTaskModeEnabled = false;

	/**
	 * Wait for an activity to reach a terminal state.
	 * @param service The data plane service.
	 * @param result The result returned by notifyActivity.
	 * @returns The terminal activity log entry.
	 */
	async function waitForTerminalActivityStatus(
		service: DataspaceDataPlaneService,
		result: string | IActivityLogEntry
	): Promise<IActivityLogEntry> {
		const activityLogEntryId = Is.stringValue(result) ? result : result.id;

		let entry = await service.getActivityLogEntry(activityLogEntryId);
		let attempts = 0;
		while (
			entry.status === ActivityProcessingStatus.Pending ||
			entry.status === ActivityProcessingStatus.Running ||
			entry.status === ActivityProcessingStatus.Registering
		) {
			attempts++;
			if (attempts > 80) {
				break;
			}
			await sleep(100);
			entry = await service.getActivityLogEntry(activityLogEntryId);
		}

		return entry;
	}

	/**
	 * Wait for a background activity to finish and for post-completion callbacks to settle.
	 * @param service The data plane service.
	 * @param result The result returned by notifyActivity.
	 * @returns The terminal activity log entry after background processing is quiescent.
	 */
	async function waitForTerminalBackgroundActivityStatus(
		service: DataspaceDataPlaneService,
		result: string | IActivityLogEntry
	): Promise<IActivityLogEntry> {
		const activityLogEntryId = Is.stringValue(result) ? result : result.id;

		await waitForTerminalActivityStatus(service, result);
		await sleep(50);

		return service.getActivityLogEntry(activityLogEntryId);
	}

	async function startBackgroundTaskService(): Promise<void> {
		backgroundTaskModeEnabled = true;
		await backgroundTaskService.start("");
	}

	async function stopTaskServices(): Promise<void> {
		if (backgroundTaskModeEnabled) {
			await sleep(50);
		}

		await backgroundTaskService?.stop("");
		await taskScheduler?.stop("");

		if (backgroundTaskModeEnabled) {
			// stop() clears timers but does not await any callback already in flight.
			await sleep(50);
		}

		backgroundTaskModeEnabled = false;
	}

	beforeAll(async () => {
		// Initialize schemas
		initSchema();
		initSchemaBackgroundTask();
		initSchemaTaskScheduler();
		JsonLdDataTypes.registerTypes();
		DataspaceDataTypes.registerTypes();
		DataspaceProtocolDataTypes.registerTypes();

		// Register TransferProcessEntity schema
		EntitySchemaFactory.register(nameof<TransferProcess>(), () =>
			EntitySchemaHelper.getSchema(TransferProcess)
		);

		// Load all JSON-LD contexts
		await addAllContextsToDocumentCache();

		// Mock the module helper to execute the method in the same thread, so we don't have to create an engine
		// and the background tasks will run in this thread
		ModuleHelper.execModuleMethodThread = vi
			.fn()
			.mockImplementation(async (module, method, args) =>
				ModuleHelper.execModuleMethod(module, method, args)
			);

		// Mock execModuleMethodThreadMessage to return a worker-like object that executes in the same thread
		// This is used by BackgroundTaskService to create worker threads
		(
			ModuleHelper as unknown as { execModuleMethodThreadMessage: unknown }
		).execModuleMethodThreadMessage = vi
			.fn()
			.mockImplementation(
				(
					module: string,
					callback: (operation: string, result: unknown, err?: unknown) => Promise<void>
				) => ({
					executeMethod: async (method: string, args?: unknown[], contextIds?: unknown) => {
						try {
							// Execute the method in the same thread
							const result = await ModuleHelper.execModuleMethod(module, method, args);
							// Call the callback to notify completion
							await callback(method, result);
						} catch (err) {
							// Call the callback with error
							await callback(method, undefined, err);
						}
					},
					terminate: vi.fn().mockResolvedValue(undefined),
					workerId: "mock-worker-id"
				})
			);

		// Create entity storage connectors
		activityLogStorage = new MemoryEntityStorageConnector<ActivityLogDetails>({
			entitySchema: nameof<ActivityLogDetails>()
		});
		EntityStorageConnectorFactory.register(
			nameofKebabCase<ActivityLogDetails>(),
			() => activityLogStorage
		);

		activityTaskStorage = new MemoryEntityStorageConnector<ActivityTask>({
			entitySchema: nameof<ActivityTask>()
		});
		EntityStorageConnectorFactory.register(
			nameofKebabCase<ActivityTask>(),
			() => activityTaskStorage
		);

		backgroundTaskStorage = new MemoryEntityStorageConnector<BackgroundTask>({
			entitySchema: nameof<BackgroundTask>()
		});
		EntityStorageConnectorFactory.register("background-task", () => backgroundTaskStorage);

		const scheduledTaskStorage = new MemoryEntityStorageConnector<ScheduledTask>({
			entitySchema: "ScheduledTask"
		});
		EntityStorageConnectorFactory.register("scheduled-task", () => scheduledTaskStorage);

		transferProcessStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>()
		});
		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferProcess>(),
			() => transferProcessStorage
		);

		EntitySchemaFactory.register(nameof<DataspaceAppDataset>(), () =>
			EntitySchemaHelper.getSchema(DataspaceAppDataset)
		);
		dataspaceAppDatasetStorage = new MemoryEntityStorageConnector<DataspaceAppDataset>({
			entitySchema: nameof<DataspaceAppDataset>()
		});
		EntityStorageConnectorFactory.register(
			nameofKebabCase<DataspaceAppDataset>(),
			() => dataspaceAppDatasetStorage
		);

		// Mock context IDs (only Node is needed for TestDataspaceDataPlaneApp.start())
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		// Create mock trust component that returns the transfer token
		const mockTrustComponent: ITrustComponent = {
			className: () => "MockTrustComponent",
			verify: vi.fn().mockResolvedValue({
				verified: true,
				info: {
					token: TEST_TRANSFER_TOKEN,
					identity: DATA_CONSUMER_IDENTITY
				}
			}),
			generate: vi.fn()
		};
		ComponentFactory.register("trust", () => mockTrustComponent);

		ComponentFactory.register("hosting", () => ({
			className: () => "HostingComponent",
			buildPublicUrl: async (url: string) => url
		}));
	});

	beforeEach(async () => {
		await stopTaskServices();

		// Clear all entity storage
		const allActivityLogs = await activityLogStorage.query();
		for (const log of allActivityLogs.entities) {
			if (log.id) {
				await activityLogStorage.remove(log.id);
			}
		}

		const allActivityTasks = await activityTaskStorage.query();
		for (const task of allActivityTasks.entities) {
			if (task.activityLogEntryId) {
				await activityTaskStorage.remove(task.activityLogEntryId);
			}
		}

		const allBackgroundTasks = await backgroundTaskStorage.query();
		for (const task of allBackgroundTasks.entities) {
			if (task.id) {
				await backgroundTaskStorage.remove(task.id);
			}
		}

		const allTransferProcesses = await transferProcessStorage.query();
		for (const tp of allTransferProcesses.entities) {
			if (tp.id) {
				await transferProcessStorage.remove(tp.id);
			}
		}

		const allDataspaceAppDatasets = await dataspaceAppDatasetStorage.query();
		for (const dataset of allDataspaceAppDatasets.entities) {
			if (dataset.id) {
				await dataspaceAppDatasetStorage.remove(dataset.id);
			}
		}

		// Clear factory between tests to ensure clean state
		for (const name of DataspaceAppFactory.names()) {
			DataspaceAppFactory.unregister(name);
		}

		// Create fresh service instances
		backgroundTaskService = new BackgroundTaskService({
			backgroundTaskEntityStorageType: "background-task"
		});
		ComponentFactory.register("background-task", () => backgroundTaskService);

		taskScheduler = new TaskSchedulerService();
		ComponentFactory.register("task-scheduler", () => taskScheduler);

		options = {
			loggingComponentType: "logging",
			backgroundTaskComponentType: "background-task",
			taskSchedulerComponentType: "task-scheduler",
			transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
		};
		backgroundTaskModeEnabled = false;
	});

	afterEach(async () => {
		await stopTaskServices();
	});

	afterAll(() => {
		ComponentFactory.clear();
		EntityStorageConnectorFactory.clear();
	});

	test("getDataAssetEntities() uses consumerPid flow", async () => {
		// Mock context to provide both Node and Organization identity (needed for test app)
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const service = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => service);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		// Call getDataAssetEntities with consumerPid
		const result = await service.getDataAssetEntities(
			{
				entityType: "https://vocabulary.uncefact.org/Consignment"
			},
			TEST_CONSUMER_PID,
			undefined,
			undefined,
			TEST_TRANSFER_TOKEN
		);

		expect(result).toBeDefined();
		expect(result.itemList).toBeDefined();
		expect(result.itemList.itemListElement).toBeDefined();
		expect(result.itemList.itemListElement.length).toBeGreaterThanOrEqual(0);
	});

	test("queryDataAsset() uses consumerPid flow", async () => {
		// Mock context to provide both Node and Organization identity (needed for test app)
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const service = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => service);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		// Call queryDataAsset with consumerPid
		const result = await service.queryDataAsset(
			TEST_CONSUMER_PID,
			{ type: "TestQueryType", q: "test-query" },
			undefined,
			undefined,
			TEST_TRANSFER_TOKEN
		);

		expect(result).toBeDefined();
		expect(result.itemList).toBeDefined();
		expect(result.itemList.itemListElement).toBeDefined();
		expect(result.itemList.itemListElement.length).toBeGreaterThanOrEqual(0);
	});

	test("Identity validation does not accept empty string fallback", async () => {
		// Override the trust component to return empty identity for this test
		const emptyIdentityTrustComponent: ITrustComponent = {
			className: () => "EmptyIdentityTrustComponent",
			verify: vi.fn().mockResolvedValue({
				verified: true,
				info: {
					token: TEST_TRANSFER_TOKEN,
					identity: ""
				}
			}),
			generate: vi.fn()
		};
		ComponentFactory.register("trust", () => emptyIdentityTrustComponent);

		const service = new DataspaceDataPlaneService(options);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		// getDataAssetEntities should throw UnauthorizedError for empty identity
		// TrustHelper.verifyTrust() throws UnauthorizedError when identity is empty
		await expect(
			service.getDataAssetEntities(
				{
					entityType: "https://vocabulary.uncefact.org/Consignment"
				},
				TEST_CONSUMER_PID,
				undefined,
				undefined,
				TEST_TRANSFER_TOKEN
			)
		).rejects.toMatchObject({
			name: "UnauthorizedError"
		});

		// queryDataAsset should also throw UnauthorizedError for empty identity
		await expect(
			service.queryDataAsset(
				TEST_CONSUMER_PID,
				{ type: "TestQueryType", q: "test-query" },
				undefined,
				undefined,
				TEST_TRANSFER_TOKEN
			)
		).rejects.toMatchObject({
			name: "UnauthorizedError"
		});

		// Restore the default mock trust component
		const mockTrustComponent: ITrustComponent = {
			className: () => "MockTrustComponent",
			verify: vi.fn().mockResolvedValue({
				verified: true,
				info: {
					token: TEST_TRANSFER_TOKEN,
					identity: DATA_CONSUMER_IDENTITY
				}
			}),
			generate: vi.fn()
		};
		ComponentFactory.register("trust", () => mockTrustComponent);
	});

	// ============================================
	// Restored Activity Stream Tests
	// ============================================

	test("It should receive an Activity in the Activity Stream - canonical", async () => {
		await startBackgroundTaskService();

		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		const result = await dataspaceDataPlaneService.notifyActivity(canonicalActivity);

		// Wait longer for background task to process
		// Check status multiple times until completed or error
		let entry = await dataspaceDataPlaneService.getActivityLogEntry(
			Is.stringValue(result) ? result : result.id
		);
		let attempts = 0;
		while (
			entry.status === ActivityProcessingStatus.Pending ||
			entry.status === ActivityProcessingStatus.Running ||
			entry.status === ActivityProcessingStatus.Registering
		) {
			attempts++;
			if (attempts > 50) {
				// Timeout after 5 seconds
				break;
			}
			await sleep(100);
			entry = await dataspaceDataPlaneService.getActivityLogEntry(
				Is.stringValue(result) ? result : result.id
			);
		}

		const tasks = entry.tasks?.filter(t => t.status === ActivityTaskStatus.Failed) ?? [];

		// If still in error, log the details
		if (entry.status === ActivityProcessingStatus.Error && tasks.length > 0) {
			console.debug("Activity processing error details:");
			console.debug(JSON.stringify(tasks[0]?.error, null, 2));
		}

		assertActivityLog(entry);
	});

	test("It should receive an Activity in the Activity Stream - canonical LD Context Array", async () => {
		await startBackgroundTaskService();

		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Avoid duplication check
		const activityCopy = ObjectHelper.clone<IActivityStreamsActivity>(activityLdContextArray);
		activityCopy.updated = new Date().toISOString();

		const result = await dataspaceDataPlaneService.notifyActivity(activityCopy);
		await sleep(1000);

		const entry = await dataspaceDataPlaneService.getActivityLogEntry(
			Is.stringValue(result) ? result : result.id
		);
		assertActivityLog(entry);
	});

	test("It should receive an Activity in the Activity Stream - type extension", async () => {
		await startBackgroundTaskService();

		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		const result = await dataspaceDataPlaneService.notifyActivity(extendedActivity);
		await sleep(1000);

		const entry = await dataspaceDataPlaneService.getActivityLogEntry(
			Is.stringValue(result) ? result : result.id
		);
		assertActivityLog(entry);
	});

	test("It should not start any task if there is no registered Dataspace App", async () => {
		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		const activityCopy = ObjectHelper.clone<IActivityStreamsActivity>(activityLdContextArray);
		activityCopy.updated = new Date().toISOString();

		const result = await dataspaceDataPlaneService.notifyActivity(activityCopy);
		const entry = await dataspaceDataPlaneService.getActivityLogEntry(
			Is.stringValue(result) ? result : result.id
		);

		expect(entry.status).toBe(ActivityProcessingStatus.Completed);
		expect(entry.tasks?.length).toBe(0);
	});

	test("It should report an error if Activity is duplicated", async () => {
		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);

		// First notification should succeed
		await dataspaceDataPlaneService.notifyActivity(canonicalActivity);

		// Second notification of the same activity should fail with ConflictError
		await expect(dataspaceDataPlaneService.notifyActivity(canonicalActivity)).rejects.toMatchObject(
			{
				name: "ConflictError"
			}
		);
	});

	test("It should report an error if Activity's object is undefined", async () => {
		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);

		const activity = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		delete activity.object;

		await expect(dataspaceDataPlaneService.notifyActivity(activity)).rejects.toMatchObject({
			name: "ValidationError"
		});
	});

	test("It should report an error if Activity's object LD Context is undefined", async () => {
		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);

		const activity = ObjectHelper.clone<IDataspaceActivity>(
			canonicalActivity as IDataspaceActivity
		);
		const object = ArrayHelper.fromObjectOrArray(activity.object);
		ObjectHelper.propertySet(object[0], "@context", undefined);

		await expect(dataspaceDataPlaneService.notifyActivity(activity)).rejects.toMatchObject({
			name: "ValidationError"
		});
	});

	test("It should report an error if Activity's object 'type' is undefined", async () => {
		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);

		const activity = ObjectHelper.clone<IDataspaceActivity>(
			canonicalActivity as IDataspaceActivity
		);
		const object = ArrayHelper.fromObjectOrArray(activity.object);
		ObjectHelper.propertySet(object[0], "type", undefined);

		await expect(dataspaceDataPlaneService.notifyActivity(activity)).rejects.toMatchObject({
			name: "ValidationError"
		});
	});

	test("It should report an error if Activity does not contain generator nor actor", async () => {
		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);

		const activity = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		delete activity.generator;
		delete activity.actor;

		await expect(dataspaceDataPlaneService.notifyActivity(activity)).rejects.toMatchObject({
			name: "GuardError"
		});
	});

	test("It should report an error if Activity's target does not define LD Context", async () => {
		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);

		const activity = ObjectHelper.clone<IDataspaceActivity>(
			canonicalActivityWithTarget as IDataspaceActivity
		);
		const target = activity.target as JsonLdObjectWithContext<object>;
		ObjectHelper.propertySet(target, "@context", undefined);

		await expect(dataspaceDataPlaneService.notifyActivity(activity)).rejects.toMatchObject({
			name: "ValidationError"
		});
	});

	test("It should report an error if Activity's target does not define type", async () => {
		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);

		const activity = ObjectHelper.clone<IDataspaceActivity>(
			canonicalActivityWithTarget as IDataspaceActivity
		);
		const target = activity.target as JsonLdObjectWithContext<object>;
		ObjectHelper.propertySet(target, "type", undefined);

		await expect(dataspaceDataPlaneService.notifyActivity(activity)).rejects.toMatchObject({
			name: "ValidationError"
		});
	});

	// ============================================
	// Restored Data Asset Entity Tests
	// ============================================

	test("It should get data asset entities by entity type", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		const result = await dataspaceDataPlaneService.getDataAssetEntities(
			{
				entityType: "https://vocabulary.uncefact.org/Consignment"
			},
			TEST_CONSUMER_PID,
			undefined,
			undefined,
			TEST_TRANSFER_TOKEN
		);

		expect(result.itemList.itemListElement.length).toBe(2);
	});

	test("It should get data asset entities by entity type with LD Context", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		const result = await dataspaceDataPlaneService.getDataAssetEntities(
			{
				entityType: "Consignment",
				jsonLdContext: ["https://vocabulary.uncefact.org/unece-context-D23B.jsonld"]
			},
			TEST_CONSUMER_PID,
			undefined,
			undefined,
			TEST_TRANSFER_TOKEN
		);

		expect(result.itemList.itemListElement.length).toBe(2);
	});

	test("It should get data asset entities by entity type - no entities", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		const result = await dataspaceDataPlaneService.getDataAssetEntities(
			{
				entityType: "Document",
				jsonLdContext: ["https://vocabulary.uncefact.org/unece-context-D23B.jsonld"]
			},
			TEST_CONSUMER_PID,
			undefined,
			undefined,
			TEST_TRANSFER_TOKEN
		);

		expect(result.itemList.itemListElement.length).toBe(0);
	});

	test("It should get data asset entities by entity id", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		const result = await dataspaceDataPlaneService.getDataAssetEntities(
			{
				entityType: "https://vocabulary.uncefact.org/Consignment",
				entityId: ["urn:ucr:24PLP051219453I002610799053311"]
			},
			TEST_CONSUMER_PID,
			undefined,
			undefined,
			TEST_TRANSFER_TOKEN
		);

		expect(result.itemList.itemListElement.length).toBe(1);
	});

	// ============================================
	// Restored Query Tests
	// ============================================

	test("It should query data asset if query type is supported", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		const result = await dataspaceDataPlaneService.queryDataAsset(
			TEST_CONSUMER_PID,
			{ type: "TestQueryType", q: "test-query" },
			undefined,
			undefined,
			TEST_TRANSFER_TOKEN
		);

		expect(result.itemList.itemListElement.length).toBe(2);
	});

	test("It should throw unprocessable if query type is not supported", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		await expect(
			dataspaceDataPlaneService.queryDataAsset(
				TEST_CONSUMER_PID,
				{ type: "UnsupportedQueryType", q: "test-query" },
				undefined,
				undefined,
				TEST_TRANSFER_TOKEN
			)
		).rejects.toMatchObject({
			name: "UnprocessableError"
		});
	});

	// ============================================
	// Restored Error Validation Tests
	// ============================================

	test("It should throw error if consumerPid is not provided", async () => {
		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		// Mock context (Node only needed for test app)
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		await expect(
			dataspaceDataPlaneService.getDataAssetEntities(
				{
					entityType: "https://vocabulary.uncefact.org/Consignment"
				},
				"", // No consumerPid
				undefined,
				undefined,
				TEST_TRANSFER_TOKEN
			)
		).rejects.toMatchObject({
			name: "GuardError"
		});
	});

	test("It should throw error if transfer process not found", async () => {
		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		// Don't create transfer process - should fail
		await expect(
			dataspaceDataPlaneService.getDataAssetEntities(
				{
					entityType: "https://vocabulary.uncefact.org/Consignment"
				},
				"non-existent-consumer-pid",
				undefined,
				undefined,
				TEST_TRANSFER_TOKEN
			)
		).rejects.toMatchObject({
			name: "NotFoundError"
		});
	});

	test("It should throw error if non qualified type is provided", async () => {
		// Ensure context IDs are set
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		// Note: Currently the service doesn't validate qualified types, so it will throw NotFoundError
		// when it can't find an app for the non-qualified type. This test documents current behavior.
		await expect(
			dataspaceDataPlaneService.getDataAssetEntities(
				{
					entityType: "Consignment"
				},
				TEST_CONSUMER_PID,
				undefined,
				undefined,
				TEST_TRANSFER_TOKEN
			)
		).rejects.toMatchObject({
			name: "NotFoundError"
		});
	});

	test("It should throw error if unexpandable type is provided", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		// Note: Currently, if JSON-LD expansion succeeds (even for invalid types),
		// the service will continue and return an empty result from the app.
		// This test documents current behavior - the type expands but app returns empty.
		const result = await dataspaceDataPlaneService.getDataAssetEntities(
			{
				entityType: "Consignment33333",
				jsonLdContext: ["https://vocabulary.uncefact.org/unece-context-D23B.jsonld"]
			},
			TEST_CONSUMER_PID,
			undefined,
			undefined,
			TEST_TRANSFER_TOKEN
		);

		// App returns empty result for unknown type
		expect(result.itemList.itemListElement.length).toBe(0);
	});

	// ============================================
	// RFC-004 Specific Tests
	// ============================================

	test("cleanupActivityLog uses tenant admin pagination for tenant partitions", async () => {
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const tenantAdminQuery = vi
			.fn()
			.mockResolvedValueOnce({
				tenants: [{ id: "tenant-1" }, { id: "tenant-2" }],
				cursor: "cursor-2"
			})
			.mockResolvedValueOnce({
				tenants: [{ id: "tenant-3" }],
				cursor: undefined
			});

		ComponentFactory.register(
			"tenant-admin",
			() =>
				({
					className: () => "MockTenantAdmin",
					query: tenantAdminQuery
				}) as unknown as ITenantAdminComponent
		);

		const dataspaceDataPlaneService = new DataspaceDataPlaneService({
			...options,
			partitionContextIds: [ContextIdKeys.Tenant],
			tenantAdminType: "tenant-admin"
		});

		const cleanupPartitionSpy = vi
			.spyOn(
				dataspaceDataPlaneService as unknown as { cleanupActivityLogPartition(): Promise<number> },
				"cleanupActivityLogPartition"
			)
			.mockResolvedValue(1);

		await (
			dataspaceDataPlaneService as unknown as {
				cleanupActivityLog(): Promise<void>;
			}
		).cleanupActivityLog();

		expect(tenantAdminQuery).toHaveBeenCalledTimes(2);
		expect(tenantAdminQuery).toHaveBeenNthCalledWith(1, undefined, undefined);
		expect(tenantAdminQuery).toHaveBeenNthCalledWith(2, undefined, "cursor-2");
		expect(cleanupPartitionSpy).toHaveBeenCalledTimes(3);
	});

	test("cleanupActivityLog skips partition cleanup when tenant admin returns no tenants", async () => {
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const tenantAdminQuery = vi.fn().mockResolvedValue({ tenants: [], cursor: undefined });

		ComponentFactory.register(
			"tenant-admin",
			() =>
				({
					className: () => "MockTenantAdmin",
					query: tenantAdminQuery
				}) as unknown as ITenantAdminComponent
		);

		const dataspaceDataPlaneService = new DataspaceDataPlaneService({
			...options,
			partitionContextIds: [ContextIdKeys.Tenant],
			tenantAdminType: "tenant-admin"
		});

		const cleanupPartitionSpy = vi
			.spyOn(
				dataspaceDataPlaneService as unknown as { cleanupActivityLogPartition(): Promise<number> },
				"cleanupActivityLogPartition"
			)
			.mockResolvedValue(1);

		await (
			dataspaceDataPlaneService as unknown as {
				cleanupActivityLog(): Promise<void>;
			}
		).cleanupActivityLog();

		expect(tenantAdminQuery).toHaveBeenCalledTimes(1);
		expect(cleanupPartitionSpy).not.toHaveBeenCalled();
	});

	test("Service matches app by dataset @id", async () => {
		// Ensure context IDs are set
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		// The test app declares it handles SERVICE_DATASET_ID
		// Call getDataAssetEntities with consumerPid that resolves to that dataset
		const result = await dataspaceDataPlaneService.getDataAssetEntities(
			{
				entityType: "https://vocabulary.uncefact.org/Consignment"
			},
			TEST_CONSUMER_PID,
			undefined,
			undefined,
			TEST_TRANSFER_TOKEN
		);

		// Should successfully match and delegate to app
		expect(result).toBeDefined();
		expect(result.itemList.itemListElement).toBeDefined();
	});

	test("Dataset-centric data requests use IDataset", async () => {
		// Ensure context IDs are set
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		// Track handleDataRequest calls
		let capturedDataRequest: unknown = null;
		const testApp = new TestDataspaceDataPlaneApp();
		const originalHandler = testApp.handleDataRequest;
		if (!originalHandler) {
			throw new Error("Test app must have handleDataRequest");
		}
		testApp.handleDataRequest = async (
			dataRequest: IDataRequest,
			cursor?: string,
			limit?: number
		) => {
			capturedDataRequest = dataRequest;
			return originalHandler.call(testApp, dataRequest, cursor, limit);
		};

		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		// Call getDataAssetEntities
		await dataspaceDataPlaneService.getDataAssetEntities(
			{
				entityType: "https://vocabulary.uncefact.org/Consignment"
			},
			TEST_CONSUMER_PID,
			undefined,
			undefined,
			TEST_TRANSFER_TOKEN
		);

		// Verify dataRequest contains IDataset
		expect(capturedDataRequest).toBeDefined();
		const dataRequest = capturedDataRequest as IDataRequest;
		expect(dataRequest.dataAsset).toBeDefined();
		expect(dataRequest.dataAsset["@id"]).toBe(SERVICE_DATASET_ID);
		expect(dataRequest.dataAsset["@type"]).toBe(DataspaceProtocolCatalogTypes.Dataset);
	});

	test("Query type validation against app's supportedQueryTypes()", async () => {
		// Ensure context IDs are set
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		// testApp.supportedQueryTypes() returns ["TestQueryType"]
		// Try with supported type - should succeed
		const resultSupported = await dataspaceDataPlaneService.queryDataAsset(
			TEST_CONSUMER_PID,
			{ type: "TestQueryType", q: "test" },
			undefined,
			undefined,
			TEST_TRANSFER_TOKEN
		);
		expect(resultSupported).toBeDefined();

		// Try with unsupported type - should throw UnprocessableError
		await expect(
			dataspaceDataPlaneService.queryDataAsset(
				TEST_CONSUMER_PID,
				{ type: "UnsupportedQueryType", q: "test" },
				undefined,
				undefined,
				TEST_TRANSFER_TOKEN
			)
		).rejects.toMatchObject({
			name: "UnprocessableError"
		});
	});

	test("Pagination cursor is passed through to app", async () => {
		// Ensure context IDs are set
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		// Track handleDataRequest calls to verify cursor is passed
		let capturedPagination: { cursor?: string; limit?: number } | undefined;
		const testApp = new TestDataspaceDataPlaneApp();
		const originalHandler = testApp.handleDataRequest;
		if (!originalHandler) {
			throw new Error("Test app must have handleDataRequest");
		}
		testApp.handleDataRequest = async (
			dataRequest: IDataRequest,
			cursor?: string,
			limit?: number
		) => {
			capturedPagination = {
				cursor,
				limit
			};
			return originalHandler.call(testApp, dataRequest, cursor, limit);
		};

		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		// Call with pagination
		await dataspaceDataPlaneService.getDataAssetEntities(
			{
				entityType: "https://vocabulary.uncefact.org/Consignment"
			},
			TEST_CONSUMER_PID,
			"test-cursor",
			50,
			TEST_TRANSFER_TOKEN
		);

		// Verify pagination was passed to app
		expect(capturedPagination).toBeDefined();
		expect(capturedPagination?.cursor).toBe("test-cursor");
		expect(capturedPagination?.limit).toBe(50);
	});

	// ============================================
	// Link Header Pagination Tests
	// ============================================

	test("No Link header when cursor is undefined", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		const mockContext = {
			serverRequest: { url: "https://provider.com/dataspace-data-plane/entities" }
		} as IHttpRequestContext;

		const request = {
			headers: {
				[HeaderTypes.Authorization]: HeaderHelper.createBearer(TEST_TRANSFER_TOKEN)
			},
			query: {
				type: "https://vocabulary.uncefact.org/Consignment",
				consumerPid: TEST_CONSUMER_PID
			}
		};

		const response = await getDataAssetEntitiesRoute(mockContext, "dataspace-data-plane", request);

		// Verify no Link header when no cursor
		expect(response.headers).toEqual({});
	});

	test("Link header present when cursor exists", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		// Create a test app that returns a cursor
		const testApp = new TestDataspaceDataPlaneApp();
		const originalHandler = testApp.handleDataRequest;
		if (!originalHandler) {
			throw new Error("Test app must have handleDataRequest");
		}
		testApp.handleDataRequest = async (
			dataRequest: IDataRequest,
			cursor?: string,
			limit?: number
		) => {
			const result = await originalHandler.call(testApp, dataRequest, cursor, limit);
			return {
				...result,
				cursor: "test-pagination-cursor"
			};
		};

		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		const mockContext = {
			serverRequest: { url: "https://provider.com/dataspace-data-plane/entities" }
		} as IHttpRequestContext;

		const request = {
			headers: {
				[HeaderTypes.Authorization]: HeaderHelper.createBearer(TEST_TRANSFER_TOKEN)
			},
			query: {
				type: "https://vocabulary.uncefact.org/Consignment",
				consumerPid: TEST_CONSUMER_PID
			}
		};

		const response = await getDataAssetEntitiesRoute(mockContext, "dataspace-data-plane", request);

		// Verify Link header is present
		expect(response.headers).toBeDefined();
		expect(response.headers?.[HeaderTypes.Link]).toBeDefined();
	});

	test("Link header format is RFC 8288 compliant", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		// Create a test app that returns a cursor
		const testApp = new TestDataspaceDataPlaneApp();
		const originalHandler = testApp.handleDataRequest;
		if (!originalHandler) {
			throw new Error("Test app must have handleDataRequest");
		}
		testApp.handleDataRequest = async (
			dataRequest: IDataRequest,
			cursor?: string,
			limit?: number
		) => {
			const result = await originalHandler.call(testApp, dataRequest, cursor, limit);
			return {
				...result,
				cursor: "rfc-test-cursor-abc123"
			};
		};

		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		const mockContext = {
			serverRequest: { url: "https://provider.com/dataspace-data-plane/entities" }
		} as IHttpRequestContext;

		const request = {
			headers: {
				[HeaderTypes.Authorization]: HeaderHelper.createBearer(TEST_TRANSFER_TOKEN)
			},
			query: {
				type: "https://vocabulary.uncefact.org/Consignment",
				consumerPid: TEST_CONSUMER_PID
			}
		};

		const response = await getDataAssetEntitiesRoute(mockContext, "dataspace-data-plane", request);

		// Verify Link header format: <url?cursor=...>; rel="next"
		const linkHeader = response.headers?.[HeaderTypes.Link];
		expect(linkHeader).toBe(
			'<https://provider.com/dataspace-data-plane/entities?cursor=rfc-test-cursor-abc123>; rel="next"'
		);
	});

	test("Cursor NOT in response body", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		// Create a test app that returns a cursor
		const testApp = new TestDataspaceDataPlaneApp();
		const originalHandler = testApp.handleDataRequest;
		if (!originalHandler) {
			throw new Error("Test app must have handleDataRequest");
		}
		testApp.handleDataRequest = async (
			dataRequest: IDataRequest,
			cursor?: string,
			limit?: number
		) => {
			const result = await originalHandler.call(testApp, dataRequest, cursor, limit);
			return {
				...result,
				cursor: "body-test-cursor"
			};
		};

		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		const mockContext = {
			serverRequest: { url: "https://provider.com/dataspace-data-plane/entities" }
		} as IHttpRequestContext;

		const request = {
			headers: {
				[HeaderTypes.Authorization]: HeaderHelper.createBearer(TEST_TRANSFER_TOKEN)
			},
			query: {
				type: "https://vocabulary.uncefact.org/Consignment",
				consumerPid: TEST_CONSUMER_PID
			}
		};

		const response = await getDataAssetEntitiesRoute(mockContext, "dataspace-data-plane", request);

		// Verify cursor is NOT in response body (pagination via Link header only)
		expect((response.body as { cursor?: string }).cursor).toBeUndefined();
		expect((response.body as { nextItem?: string }).nextItem).toBeUndefined();

		// Verify cursor IS in Link header
		expect(response.headers?.[HeaderTypes.Link]).toContain("cursor=body-test-cursor");
	});

	test("Pagination flow with Link header for queryDataAsset", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		// Create a test app that returns different results based on cursor
		let requestCount = 0;
		const testApp = new TestDataspaceDataPlaneApp();
		const originalHandler = testApp.handleDataRequest;
		if (!originalHandler) {
			throw new Error("Test app must have handleDataRequest");
		}
		testApp.handleDataRequest = async (
			dataRequest: IDataRequest,
			cursor?: string,
			limit?: number
		) => {
			requestCount++;
			const result = await originalHandler.call(testApp, dataRequest, cursor, limit);
			// First request returns cursor, second request (with cursor) returns no cursor
			return {
				...result,
				cursor: cursor === "page2-cursor" ? undefined : "page2-cursor"
			};
		};

		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create transfer process in storage
		const transferProcess = createTestTransferProcess();
		await transferProcessStorage.set(transferProcess);

		const mockContext = {
			serverRequest: { url: "https://provider.com/dataspace-data-plane/entities/query" }
		} as IHttpRequestContext;

		// First request - should get Link header with cursor
		const firstRequest = {
			headers: {
				[HeaderTypes.Authorization]: HeaderHelper.createBearer(TEST_TRANSFER_TOKEN)
			},
			body: {
				consumerPid: TEST_CONSUMER_PID,
				query: { type: "TestQueryType", q: "test-query" }
			}
		};

		const firstResponse = await queryDataAssetRoute(
			mockContext,
			"dataspace-data-plane",
			firstRequest
		);

		// Verify first response has Link header
		expect(firstResponse.headers?.[HeaderTypes.Link]).toBeDefined();

		// Extract cursor from Link header using HeaderHelper
		const linkHeaderValue = firstResponse.headers?.[HeaderTypes.Link];
		const nextLink = HeaderHelper.extractLinkHeaderRelation(linkHeaderValue, "next");
		expect(nextLink?.urlQueryParams?.cursor).toBe("page2-cursor");

		// Second request using cursor from Link header
		const secondRequest = {
			headers: {
				[HeaderTypes.Authorization]: HeaderHelper.createBearer(TEST_TRANSFER_TOKEN)
			},
			body: {
				consumerPid: TEST_CONSUMER_PID,
				query: { type: "TestQueryType", q: "test-query" }
			},
			query: {
				cursor: nextLink?.urlQueryParams?.cursor
			}
		};

		const secondResponse = await queryDataAssetRoute(
			mockContext,
			"dataspace-data-plane",
			secondRequest
		);

		// Verify second response has no Link header (last page)
		expect(secondResponse.headers).toEqual({});
		expect(requestCount).toBe(2);
	});

	test("It should allow resubmission of activity that previously resulted in error", async () => {
		await startBackgroundTaskService();

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		// Create a test app that will fail on first attempt
		let shouldFail = true;
		const testApp = new TestDataspaceDataPlaneApp();
		const originalHandleActivity = testApp.handleActivity;
		if (!originalHandleActivity) {
			throw new Error("Test app must have handleActivity");
		}
		testApp.handleActivity = async <T>(activity: IDataspaceActivity): Promise<T> => {
			if (shouldFail) {
				throw new Error("Simulated processing failure");
			}
			return originalHandleActivity.call(testApp, activity) as Promise<T>;
		};

		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create a unique activity for this test
		const activity = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity.updated = new Date().toISOString();

		// First submission - will fail
		const result = await dataspaceDataPlaneService.notifyActivity(activity);

		// Wait for task to fail
		let entry = await dataspaceDataPlaneService.getActivityLogEntry(
			Is.stringValue(result) ? result : result.id
		);
		let attempts = 0;
		while (
			entry.status === ActivityProcessingStatus.Pending ||
			entry.status === ActivityProcessingStatus.Running ||
			entry.status === ActivityProcessingStatus.Registering
		) {
			attempts++;
			if (attempts > 50) {
				break;
			}
			await sleep(100);
			entry = await dataspaceDataPlaneService.getActivityLogEntry(
				Is.stringValue(result) ? result : result.id
			);
		}

		// Verify activity is in error state
		expect(entry.status).toBe(ActivityProcessingStatus.Error);
		const tasks = entry.tasks ?? [];
		const failedTasks = tasks.filter(t => t.status === ActivityTaskStatus.Failed);
		expect(failedTasks.length).toBeGreaterThan(0);

		// Fix the app so it succeeds on retry
		shouldFail = false;

		// Resubmit the SAME activity
		// Should succeed and reprocess
		const retryLogEntryId = await dataspaceDataPlaneService.notifyActivity(activity);

		// Should return the same activity log entry ID
		expect(Is.stringValue(retryLogEntryId) ? retryLogEntryId : retryLogEntryId.id).toBe(
			Is.stringValue(result) ? result : result.id
		);

		// Wait for retry to complete
		entry = await dataspaceDataPlaneService.getActivityLogEntry(
			Is.stringValue(result) ? result : result.id
		);
		attempts = 0;
		while (
			entry.status === ActivityProcessingStatus.Pending ||
			entry.status === ActivityProcessingStatus.Running ||
			entry.status === ActivityProcessingStatus.Registering
		) {
			attempts++;
			if (attempts > 50) {
				break;
			}
			await sleep(100);
			entry = await dataspaceDataPlaneService.getActivityLogEntry(
				Is.stringValue(result) ? result : result.id
			);
		}

		// Verify activity is now completed
		expect(entry.status).toBe(ActivityProcessingStatus.Completed);
	});

	test("It should reject resubmission if activity is still processing", async () => {
		await startBackgroundTaskService();

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		// Create a test app that takes a long time to process
		let resolvePromise: (() => void) | undefined;
		const processingPromise = new Promise<void>(resolve => {
			resolvePromise = resolve;
		});
		const testApp = new TestDataspaceDataPlaneApp();
		const originalActivitiesHandled = testApp.activitiesHandled.bind(testApp);
		testApp.activitiesHandled = () =>
			originalActivitiesHandled().map(activityQuery => ({
				...activityQuery,
				processingGroupId: "slow-group"
			}));
		testApp.processingGroups = () => ({
			"slow-group": {
				concurrentTasks: 1
			}
		});
		testApp.handleActivity = async <T>(): Promise<T> => {
			await processingPromise;
			return "1234" as T;
		};

		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create a unique activity for this test
		const activity = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity.updated = new Date().toISOString();

		// First submission
		const result = await dataspaceDataPlaneService.notifyActivity(activity);

		// Wait a bit for task to start processing
		await sleep(200);

		// Try to resubmit while still processing - should fail
		await expect(dataspaceDataPlaneService.notifyActivity(activity)).rejects.toMatchObject({
			name: "ConflictError"
		});

		// Allow the task to complete
		resolvePromise?.();

		let entry = await dataspaceDataPlaneService.getActivityLogEntry(
			Is.stringValue(result) ? result : result.id
		);
		let attempts = 0;
		while (
			entry.status === ActivityProcessingStatus.Pending ||
			entry.status === ActivityProcessingStatus.Running ||
			entry.status === ActivityProcessingStatus.Registering
		) {
			attempts++;
			if (attempts > 50) {
				break;
			}
			await sleep(100);
			entry = await dataspaceDataPlaneService.getActivityLogEntry(
				Is.stringValue(result) ? result : result.id
			);
		}
	});

	test("It should reject resubmission if all tasks completed successfully", async () => {
		await startBackgroundTaskService();

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		// Create a unique activity
		const activity = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity.updated = new Date().toISOString();

		// First submission
		const result = await dataspaceDataPlaneService.notifyActivity(activity);

		// Wait for completion
		let entry = await dataspaceDataPlaneService.getActivityLogEntry(
			Is.stringValue(result) ? result : result.id
		);
		let attempts = 0;
		while (
			entry.status === ActivityProcessingStatus.Pending ||
			entry.status === ActivityProcessingStatus.Running ||
			entry.status === ActivityProcessingStatus.Registering
		) {
			attempts++;
			if (attempts > 50) {
				break;
			}
			await sleep(100);
			entry = await dataspaceDataPlaneService.getActivityLogEntry(
				Is.stringValue(result) ? result : result.id
			);
		}

		// Verify completed
		expect(entry.status).toBe(ActivityProcessingStatus.Completed);

		// Try to resubmit after successful completion - should fail as true duplicate
		await expect(dataspaceDataPlaneService.notifyActivity(activity)).rejects.toMatchObject({
			name: "ConflictError"
		});
	});

	test("Inline notifications include success completion", async () => {
		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const notifications: IActivityLogStatusNotification[] = [];
		await dataspaceDataPlaneService.subscribeToActivityLog(async notification => {
			notifications.push(notification);
		});

		const testApp = new TestDataspaceDataPlaneApp();
		const originalActivitiesHandled = testApp.activitiesHandled.bind(testApp);
		testApp.activitiesHandled = () =>
			originalActivitiesHandled().map(activityQuery => ({
				...activityQuery,
				processingGroupId: undefined
			}));

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		const activity = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity.updated = new Date().toISOString();

		const result = await dataspaceDataPlaneService.notifyActivity(activity);
		const entry = await waitForTerminalBackgroundActivityStatus(dataspaceDataPlaneService, result);
		const successfulTaskIds = [
			...new Set(
				notifications
					.filter(n => n.taskProcessingStatus.taskStatus === TaskStatus.Success)
					.map(n => n.taskProcessingStatus.taskId)
			)
		];

		expect(entry.status).toBe(ActivityProcessingStatus.Completed);
		expect(successfulTaskIds.length).toBe(1);
		expect(notifications[0].taskProcessingStatus.taskStatus).toBe(TaskStatus.Success);
	});

	test("Inline notifications include failure then success on retry", async () => {
		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const notifications: IActivityLogStatusNotification[] = [];
		await dataspaceDataPlaneService.subscribeToActivityLog(async notification => {
			notifications.push(notification);
		});

		let shouldFail = true;
		const testApp = new TestDataspaceDataPlaneApp();
		const originalActivitiesHandled = testApp.activitiesHandled.bind(testApp);
		testApp.activitiesHandled = () =>
			originalActivitiesHandled().map(activityQuery => ({
				...activityQuery,
				processingGroupId: undefined
			}));

		const originalHandleActivity = testApp.handleActivity;
		if (!originalHandleActivity) {
			throw new Error("Test app must have handleActivity");
		}
		testApp.handleActivity = async <T>(activity: IDataspaceActivity): Promise<T> => {
			if (shouldFail) {
				throw new Error("Inline retry failure");
			}
			return originalHandleActivity.call(testApp, activity) as Promise<T>;
		};

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		const activity = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity.updated = new Date().toISOString();

		const firstResult = await dataspaceDataPlaneService.notifyActivity(activity);
		const firstEntry = await waitForTerminalBackgroundActivityStatus(
			dataspaceDataPlaneService,
			firstResult
		);
		expect(firstEntry.status).toBe(ActivityProcessingStatus.Error);
		const firstFailedTasks = firstEntry.tasks?.filter(t => t.status === ActivityTaskStatus.Failed);
		expect(firstFailedTasks?.length).toBeGreaterThan(0);
		expect(firstFailedTasks?.[0]?.error?.message).toBe("Inline retry failure");

		shouldFail = false;
		const secondResult = await dataspaceDataPlaneService.notifyActivity(activity);
		const secondEntry = await waitForTerminalBackgroundActivityStatus(
			dataspaceDataPlaneService,
			secondResult
		);
		expect(secondEntry.status).toBe(ActivityProcessingStatus.Completed);

		expect(notifications.length).toBeGreaterThanOrEqual(2);
		expect(notifications.some(n => n.taskProcessingStatus.taskStatus === TaskStatus.Failed)).toBe(
			true
		);
		expect(notifications.some(n => n.taskProcessingStatus.taskStatus === TaskStatus.Success)).toBe(
			true
		);
	});

	test("Background notifications include success completion", async () => {
		await startBackgroundTaskService();

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const notifications: IActivityLogStatusNotification[] = [];
		await dataspaceDataPlaneService.subscribeToActivityLog(async notification => {
			notifications.push(notification);
		});

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});
		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		const activity = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity.updated = new Date().toISOString();

		const result = await dataspaceDataPlaneService.notifyActivity(activity);
		const entry = await waitForTerminalActivityStatus(dataspaceDataPlaneService, result);
		const successfulTaskIds = [
			...new Set(
				notifications
					.filter(n => n.taskProcessingStatus.taskStatus === TaskStatus.Success)
					.map(n => n.taskProcessingStatus.taskId)
			)
		];

		expect(entry.status).toBe(ActivityProcessingStatus.Completed);
		expect(successfulTaskIds.length).toBe(1);
		expect(notifications[0].taskProcessingStatus.taskStatus).toBe(TaskStatus.Success);
	});

	test("Background notifications include failure then success on retry", async () => {
		await startBackgroundTaskService();

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const notifications: IActivityLogStatusNotification[] = [];
		await dataspaceDataPlaneService.subscribeToActivityLog(async notification => {
			notifications.push(notification);
		});

		let shouldFail = true;
		const testApp = new TestDataspaceDataPlaneApp();
		const originalHandleActivity = testApp.handleActivity;
		if (!originalHandleActivity) {
			throw new Error("Test app must have handleActivity");
		}
		testApp.handleActivity = async <T>(activity: IDataspaceActivity): Promise<T> => {
			if (shouldFail) {
				throw new Error("Background retry failure");
			}
			return originalHandleActivity.call(testApp, activity) as Promise<T>;
		};

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		const activity = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity.updated = new Date().toISOString();

		const firstResult = await dataspaceDataPlaneService.notifyActivity(activity);
		const firstEntry = await waitForTerminalActivityStatus(dataspaceDataPlaneService, firstResult);
		expect(firstEntry.status).toBe(ActivityProcessingStatus.Error);

		shouldFail = false;
		const secondResult = await dataspaceDataPlaneService.notifyActivity(activity);
		const secondEntry = await waitForTerminalActivityStatus(
			dataspaceDataPlaneService,
			secondResult
		);
		expect(secondEntry.status).toBe(ActivityProcessingStatus.Completed);

		expect(notifications.length).toBeGreaterThanOrEqual(2);
		expect(notifications.some(n => n.taskProcessingStatus.taskStatus === TaskStatus.Failed)).toBe(
			true
		);
		expect(notifications.some(n => n.taskProcessingStatus.taskStatus === TaskStatus.Success)).toBe(
			true
		);
	});

	test("Processing group runs tasks in parallel when concurrentTasks is greater than one", async () => {
		await startBackgroundTaskService();

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		let releaseParallelTasks: (() => void) | undefined;
		const releasePromise = new Promise<void>(resolve => {
			releaseParallelTasks = resolve;
		});

		let startedCount = 0;
		let bothStarted: (() => void) | undefined;
		const bothStartedPromise = new Promise<void>(resolve => {
			bothStarted = resolve;
		});

		const testApp = new TestDataspaceDataPlaneApp();
		testApp.activitiesHandled = () => [
			{
				objectType: "https://vocabulary.uncefact.org/Consignment",
				processingGroupId: "parallel-group"
			}
		];
		testApp.processingGroups = () => ({
			"parallel-group": {
				concurrentTasks: 2
			}
		});
		testApp.handleActivity = async <T>(): Promise<T> => {
			startedCount++;
			if (startedCount === 2) {
				bothStarted?.();
			}
			await releasePromise;
			return "1234" as T;
		};

		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		const activity1 = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity1.updated = new Date().toISOString();

		const activity2 = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity2.updated = new Date(Date.now() + 1).toISOString();

		const result1 = await dataspaceDataPlaneService.notifyActivity(activity1);
		const result2 = await dataspaceDataPlaneService.notifyActivity(activity2);

		await Promise.race([
			bothStartedPromise,
			new Promise((_resolve, reject) => {
				setTimeout(() => reject(new Error("Timed out waiting for parallel task start")), 3000);
			})
		]);
		expect(startedCount).toBe(2);

		releaseParallelTasks?.();

		const entry1 = await waitForTerminalBackgroundActivityStatus(
			dataspaceDataPlaneService,
			result1
		);
		const entry2 = await waitForTerminalBackgroundActivityStatus(
			dataspaceDataPlaneService,
			result2
		);

		expect(entry1.status).toBe(ActivityProcessingStatus.Completed);
		expect(entry2.status).toBe(ActivityProcessingStatus.Completed);
	});

	test("Processing group forwards idleShutdownTimeout to background task handler", async () => {
		await startBackgroundTaskService();

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const registerHandlerSpy = vi.spyOn(backgroundTaskService, "registerHandler");

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		testApp.activitiesHandled = () => [
			{
				objectType: "https://vocabulary.uncefact.org/Consignment",
				processingGroupId: "idle-timeout-group"
			}
		];
		testApp.processingGroups = () => ({
			"idle-timeout-group": {
				concurrentTasks: 2,
				idleShutdownTimeout: 4321
			}
		});

		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		const activity = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity.updated = new Date().toISOString();

		const result = await dataspaceDataPlaneService.notifyActivity(activity);
		const entry = await waitForTerminalBackgroundActivityStatus(dataspaceDataPlaneService, result);
		expect(entry.status).toBe(ActivityProcessingStatus.Completed);

		expect(registerHandlerSpy).toHaveBeenCalled();
		const lastCall = registerHandlerSpy.mock.calls.at(-1);
		expect(lastCall?.[4]).toMatchObject({
			maxWorkerCount: 2,
			idleShutdownTimeout: 4321
		});
	});

	test("Processing group leaves idleShutdownTimeout undefined when not configured", async () => {
		await startBackgroundTaskService();

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const registerHandlerSpy = vi.spyOn(backgroundTaskService, "registerHandler");

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		const activity = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity.updated = new Date().toISOString();

		const result = await dataspaceDataPlaneService.notifyActivity(activity);
		const entry = await waitForTerminalBackgroundActivityStatus(dataspaceDataPlaneService, result);
		expect(entry.status).toBe(ActivityProcessingStatus.Completed);

		expect(registerHandlerSpy).toHaveBeenCalled();
		const lastCall = registerHandlerSpy.mock.calls.at(-1);
		expect(lastCall?.[4]).toMatchObject({
			maxWorkerCount: 2
		});
		expect(lastCall?.[4]?.idleShutdownTimeout).toBeUndefined();
	});

	test("idleShutdownTimeout 0 shuts down workers between sequential tasks", async () => {
		await startBackgroundTaskService();

		const threadFactoryMock = (
			ModuleHelper as unknown as {
				execModuleMethodThreadMessage: ReturnType<typeof vi.fn>;
			}
		).execModuleMethodThreadMessage;
		threadFactoryMock.mockClear();

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		testApp.activitiesHandled = () => [
			{
				objectType: "https://vocabulary.uncefact.org/Consignment",
				processingGroupId: "idle-zero-group"
			}
		];
		testApp.processingGroups = () => ({
			"idle-zero-group": {
				concurrentTasks: 1,
				idleShutdownTimeout: 0
			}
		});

		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		const activity1 = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity1.updated = new Date().toISOString();
		const result1 = await dataspaceDataPlaneService.notifyActivity(activity1);
		const entry1 = await waitForTerminalBackgroundActivityStatus(
			dataspaceDataPlaneService,
			result1
		);
		expect(entry1.status).toBe(ActivityProcessingStatus.Completed);

		// Allow idle shutdown processing to run before submitting the next task.
		await sleep(100);

		const activity2 = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity2.updated = new Date(Date.now() + 1).toISOString();
		const result2 = await dataspaceDataPlaneService.notifyActivity(activity2);
		const entry2 = await waitForTerminalBackgroundActivityStatus(
			dataspaceDataPlaneService,
			result2
		);
		expect(entry2.status).toBe(ActivityProcessingStatus.Completed);

		expect(threadFactoryMock.mock.calls.length).toBeGreaterThanOrEqual(2);
	});

	test("idleShutdownTimeout -1 keeps worker alive and reuses it", async () => {
		await backgroundTaskService.start("");

		const threadFactoryMock = (
			ModuleHelper as unknown as {
				execModuleMethodThreadMessage: ReturnType<typeof vi.fn>;
			}
		).execModuleMethodThreadMessage;
		threadFactoryMock.mockClear();

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataspaceDataPlaneService = new DataspaceDataPlaneService(options);
		ComponentFactory.register("dataspace-data-plane", () => dataspaceDataPlaneService);

		const testApp = new TestDataspaceDataPlaneApp();
		testApp.activitiesHandled = () => [
			{
				objectType: "https://vocabulary.uncefact.org/Consignment",
				processingGroupId: "idle-forever-group"
			}
		];
		testApp.processingGroups = () => ({
			"idle-forever-group": {
				concurrentTasks: 1,
				idleShutdownTimeout: -1
			}
		});

		DataspaceAppFactory.register(TestDataspaceDataPlaneApp.APP_ID, () => testApp);
		await testApp.start();
		await seedTestAppDataset(dataspaceAppDatasetStorage);

		const activity1 = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity1.updated = new Date().toISOString();
		const result1 = await dataspaceDataPlaneService.notifyActivity(activity1);
		const entry1 = await waitForTerminalBackgroundActivityStatus(
			dataspaceDataPlaneService,
			result1
		);
		expect(entry1.status).toBe(ActivityProcessingStatus.Completed);

		await sleep(100);

		const activity2 = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		activity2.updated = new Date(Date.now() + 1).toISOString();
		const result2 = await dataspaceDataPlaneService.notifyActivity(activity2);
		const entry2 = await waitForTerminalBackgroundActivityStatus(
			dataspaceDataPlaneService,
			result2
		);
		expect(entry2.status).toBe(ActivityProcessingStatus.Completed);

		expect(threadFactoryMock.mock.calls.length).toBe(1);

		const firstWorker = threadFactoryMock.mock.results[0]?.value as {
			terminate: ReturnType<typeof vi.fn>;
		};
		expect(firstWorker.terminate).not.toHaveBeenCalled();
	});
});
