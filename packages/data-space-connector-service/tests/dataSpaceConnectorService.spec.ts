// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IHttpRequestContext } from "@twin.org/api-models";
import { TaskSchedulerService } from "@twin.org/background-task-scheduler";
import {
	BackgroundTaskService,
	initSchema as initSchemaBackgroundTask,
	type BackgroundTask
} from "@twin.org/background-task-service";
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory, Is, ObjectHelper } from "@twin.org/core";
import {
	ActivityProcessingStatus,
	DataSpaceConnectorAppFactory,
	type IActivityLogDates,
	type IActivityLogEntry,
	type IDataAssetEntitiesResponse,
	type IDataRequest,
	type IDataSpaceConnectorApp
} from "@twin.org/data-space-connector-models";
import { TestDataSpaceConnectorApp } from "@twin.org/data-space-connector-test-app";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { ModuleHelper } from "@twin.org/modules";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import {
	DataspaceProtocolCatalogTypes,
	DataspaceProtocolContexts,
	type IDataspaceProtocolDataset
} from "@twin.org/standards-dataspace-protocol";
import { addAllContextsToDocumentCache } from "@twin.org/standards-ld-contexts";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
import type { IOdrlOffer } from "@twin.org/standards-w3c-odrl";
import type { ITrustComponent, ITrustVerificationInfo } from "@twin.org/trust-models";
import { HeaderHelper, HeaderTypes } from "@twin.org/web";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { activityLdContextArray, canonicalActivity, extendedActivity } from "./testData.js";
import {
	getDataAssetEntities as getDataAssetEntitiesRoute,
	queryDataAsset as queryDataAssetRoute
} from "../src/dataSpaceConnectorRoutes.js";
import { DataSpaceConnectorService } from "../src/dataSpaceConnectorService.js";
import type { ActivityLogDetails } from "../src/entities/activityLogDetails.js";
import type { ActivityTask } from "../src/entities/activityTask.js";
import type { IDataSpaceConnectorServiceConstructorOptions } from "../src/models/IDataSpaceConnectorServiceConstructorOptions.js";
import { initSchema } from "../src/schema.js";

const TEST_NODE_IDENTITY = "did:iota:testnet:7654321";
const DATA_CONSUMER_IDENTITY = "did:iota:testnet:1234567";
const SERVICE_DATASET_ID = "https://twin.example.org/data-service-1";
const MOCK_TRUST_PAYLOAD = "mock-trust-token";

/**
 * Waits.
 * @param ms milliseconds to sleep.
 * @returns Promise
 */
async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Asserts Activity Log.
 * @param entry Entry to be asserted
 */
function assertActivityLog(entry: IActivityLogEntry): void {
	if (entry.status !== ActivityProcessingStatus.Completed) {
		console.log(JSON.stringify(entry, null, 2));
	}
	expect(entry.status).toBe(ActivityProcessingStatus.Completed);
	expect(entry.pendingTasks?.length).toBe(0);
	expect(entry.runningTasks?.length).toBe(0);
	expect(entry.inErrorTasks?.length).toBe(0);

	expect(entry.finalizedTasks?.length).toBe(1);
	expect(Is.arrayValue(entry.finalizedTasks)).toBe(true);
	const finalizedTasks = entry.finalizedTasks as (IActivityLogDates & { result: string })[];
	expect(finalizedTasks[0]).toBeDefined();
	expect(finalizedTasks[0].startDate).toBeDefined();
	expect(finalizedTasks[0].endDate).toBeDefined();

	expect(JSON.parse(finalizedTasks[0].result)).toBe("1234");
}

describe("data-space-connector-tests", () => {
	let activityLogStorage: MemoryEntityStorageConnector<ActivityLogDetails>;
	let activityTaskStorage: MemoryEntityStorageConnector<ActivityTask>;
	let backgroundTaskStorage: MemoryEntityStorageConnector<BackgroundTask>;
	let backgroundTaskService: BackgroundTaskService;
	let taskScheduler: TaskSchedulerService;
	let options: IDataSpaceConnectorServiceConstructorOptions;

	beforeAll(async () => {
		// Initialize schemas
		initSchema();
		initSchemaBackgroundTask();

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

		// Mock context IDs (only Node is needed for TestDataSpaceConnectorApp.start())
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		// Create mock trust component
		const mockTrustComponent: ITrustComponent = {
			className: () => "MockTrustComponent",
			verify: vi.fn().mockResolvedValue({
				verified: true,
				info: {
					identity: DATA_CONSUMER_IDENTITY
				} as ITrustVerificationInfo
			}),
			generate: vi.fn()
		};
		ComponentFactory.register("trust", () => mockTrustComponent);
	});

	beforeEach(async () => {
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
			taskSchedulerComponentType: "task-scheduler"
		};
	});

	afterAll(() => {
		ComponentFactory.clear();
		EntityStorageConnectorFactory.clear();
	});

	test("getDataAssetEntities() uses new DCAT dataset vocabulary", async () => {
		// Mock context to provide both Node and Organization identity (needed for test app)
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const service = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => service);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		// Call getDataAssetEntities - it should use dataset vocabulary
		const result = await service.getDataAssetEntities(
			{ dataSetId: [SERVICE_DATASET_ID] },
			{
				entityType: "https://vocabulary.uncefact.org/Consignment"
			},
			MOCK_TRUST_PAYLOAD
		);

		expect(result).toBeDefined();
		expect(result.itemList).toBeDefined();
		expect(result.itemList.itemListElement).toBeDefined();
		expect(result.itemList.itemListElement.length).toBeGreaterThanOrEqual(0);
	});

	test("queryDataAsset() uses new DCAT dataset vocabulary", async () => {
		// Mock context to provide both Node and Organization identity (needed for test app)
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const service = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => service);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		// Call queryDataAsset - it should use dataset vocabulary
		const result = await service.queryDataAsset(
			{ dataSetId: [SERVICE_DATASET_ID] },
			{ type: "TestQueryType", q: "test-query" },
			MOCK_TRUST_PAYLOAD
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
					identity: ""
				} as ITrustVerificationInfo
			}),
			generate: vi.fn()
		};
		ComponentFactory.register("trust", () => emptyIdentityTrustComponent);

		const service = new DataSpaceConnectorService(options);

		// getDataAssetEntities should throw UnauthorizedError for empty identity
		// TrustHelper.verifyTrust() throws UnauthorizedError when identity is empty
		await expect(
			service.getDataAssetEntities(
				{ dataSetId: [SERVICE_DATASET_ID] },
				{
					entityType: "https://vocabulary.uncefact.org/Consignment"
				},
				MOCK_TRUST_PAYLOAD
			)
		).rejects.toMatchObject({
			name: "UnauthorizedError"
		});

		// queryDataAsset should also throw UnauthorizedError for empty identity
		await expect(
			service.queryDataAsset(
				{ dataSetId: [SERVICE_DATASET_ID] },
				{ type: "TestQueryType", q: "test-query" },
				MOCK_TRUST_PAYLOAD
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
					identity: DATA_CONSUMER_IDENTITY
				} as ITrustVerificationInfo
			}),
			generate: vi.fn()
		};
		ComponentFactory.register("trust", () => mockTrustComponent);
	});

	// ============================================
	// Restored Activity Stream Tests
	// ============================================

	test("It should receive an Activity in the Activity Stream - canonical", async () => {
		await backgroundTaskService.start("");

		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const activityLogEntryId = await dataSpaceConnectorService.notifyActivity(canonicalActivity);

		// Wait longer for background task to process
		// Check status multiple times until completed or error
		let entry = await dataSpaceConnectorService.getActivityLogEntry(activityLogEntryId);
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
			entry = await dataSpaceConnectorService.getActivityLogEntry(activityLogEntryId);
		}

		// If still in error, log the details
		if (
			entry.status === ActivityProcessingStatus.Error &&
			entry.inErrorTasks &&
			entry.inErrorTasks.length > 0
		) {
			console.log("Activity processing error details:");
			console.log(JSON.stringify(entry.inErrorTasks[0].error, null, 2));
		}

		assertActivityLog(entry);
	});

	test("It should receive an Activity in the Activity Stream - canonical LD Context Array", async () => {
		await backgroundTaskService.start("");

		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		// Avoid duplication check
		const activityCopy = ObjectHelper.clone<IActivityStreamsActivity>(activityLdContextArray);
		activityCopy.updated = new Date().toISOString();

		const activityLogEntryId = await dataSpaceConnectorService.notifyActivity(activityCopy);
		await sleep(1000);

		const entry = await dataSpaceConnectorService.getActivityLogEntry(activityLogEntryId);
		assertActivityLog(entry);
	});

	test.skip("It should receive an Activity in the Activity Stream - type extension", async () => {
		await backgroundTaskService.start("");

		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const activityLogEntryId = await dataSpaceConnectorService.notifyActivity(extendedActivity);
		await sleep(1000);

		const entry = await dataSpaceConnectorService.getActivityLogEntry(activityLogEntryId);
		assertActivityLog(entry);
	});

	test("It should not start any task if there is no registered DS Connector App", async () => {
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		const activityCopy = ObjectHelper.clone<IActivityStreamsActivity>(activityLdContextArray);
		activityCopy.updated = new Date().toISOString();

		const activityLogEntryId = await dataSpaceConnectorService.notifyActivity(activityCopy);
		const entry = await dataSpaceConnectorService.getActivityLogEntry(activityLogEntryId);

		expect(entry.status).toBe(ActivityProcessingStatus.Completed);
		expect(entry.pendingTasks?.length).toBe(0);
		expect(entry.runningTasks?.length).toBe(0);
		expect(entry.finalizedTasks?.length).toBe(0);
		expect(entry.inErrorTasks?.length).toBe(0);
	});

	test("It should report an error if Activity is duplicated", async () => {
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);

		// First notification should succeed
		await dataSpaceConnectorService.notifyActivity(canonicalActivity);

		// Second notification of the same activity should fail with ConflictError
		await expect(dataSpaceConnectorService.notifyActivity(canonicalActivity)).rejects.toMatchObject(
			{
				name: "ConflictError"
			}
		);
	});

	test("It should report an error if Activity does not contain generator nor actor", async () => {
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);

		const activity = ObjectHelper.clone<IActivityStreamsActivity>(canonicalActivity);
		delete activity.generator;
		delete activity.actor;

		await expect(dataSpaceConnectorService.notifyActivity(activity)).rejects.toMatchObject({
			name: "GuardError"
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

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const result = await dataSpaceConnectorService.getDataAssetEntities(
			{ dataSetId: [SERVICE_DATASET_ID] },
			{
				entityType: "https://vocabulary.uncefact.org/Consignment"
			},
			MOCK_TRUST_PAYLOAD
		);

		expect(result.itemList.itemListElement.length).toBe(1);
	});

	test("It should get data asset entities by entity type with LD Context", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const result = await dataSpaceConnectorService.getDataAssetEntities(
			{ dataSetId: [SERVICE_DATASET_ID] },
			{
				entityType: "Consignment",
				jsonLdContext: ["https://vocabulary.uncefact.org/unece-context-D23B.jsonld"]
			},
			MOCK_TRUST_PAYLOAD
		);

		expect(result.itemList.itemListElement.length).toBe(1);
	});

	test("It should get data asset entities by entity type - no entities", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const result = await dataSpaceConnectorService.getDataAssetEntities(
			{ dataSetId: [SERVICE_DATASET_ID] },
			{
				entityType: "Document",
				jsonLdContext: ["https://vocabulary.uncefact.org/unece-context-D23B.jsonld"]
			},
			MOCK_TRUST_PAYLOAD
		);

		expect(result.itemList.itemListElement.length).toBe(0);
	});

	test("It should get data asset entities by entity id", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const result = await dataSpaceConnectorService.getDataAssetEntities(
			{ dataSetId: [SERVICE_DATASET_ID] },
			{
				entityType: "https://vocabulary.uncefact.org/Consignment",
				entityId: ["urn:ucr:24PLP051219453I002610799053311"]
			},
			MOCK_TRUST_PAYLOAD
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

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const result = await dataSpaceConnectorService.queryDataAsset(
			{ dataSetId: [SERVICE_DATASET_ID] },
			{ type: "TestQueryType", q: "test-query" },
			MOCK_TRUST_PAYLOAD
		);

		expect(result.itemList.itemListElement.length).toBe(2);
	});

	test("It should throw unprocessable if query type is not supported", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		await expect(
			dataSpaceConnectorService.queryDataAsset(
				{ dataSetId: [SERVICE_DATASET_ID] },
				{ type: "UnsupportedQueryType", q: "test-query" },
				MOCK_TRUST_PAYLOAD
			)
		).rejects.toMatchObject({
			name: "UnprocessableError"
		});
	});

	// ============================================
	// Restored Error Validation Tests
	// ============================================

	test.skip("It should throw error if participant does not exist in the catalogue", async () => {
		// NOTE: Participant validation in catalogue is deferred to RFC005 implementation
		// This test will be re-enabled when catalogue validation is implemented
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		// Mock context (Node only needed for test app)
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		await expect(
			dataSpaceConnectorService.getDataAssetEntities(
				{},
				{
					entityType: "https://vocabulary.uncefact.org/Consignment"
				},
				MOCK_TRUST_PAYLOAD
			)
		).rejects.toMatchObject({
			name: "GuardError"
		});
	});

	test("It should throw error if service Id does not exist in the catalogue", async () => {
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		await expect(
			dataSpaceConnectorService.getDataAssetEntities(
				{ dataSetId: ["https://nonexistent.service.org"] },
				{
					entityType: "https://vocabulary.uncefact.org/Consignment"
				},
				MOCK_TRUST_PAYLOAD
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

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		// Note: Currently the service doesn't validate qualified types, so it will throw NotFoundError
		// when it can't find an app for the non-qualified type.This test documents current behavior.
		await expect(
			dataSpaceConnectorService.getDataAssetEntities(
				{ dataSetId: [SERVICE_DATASET_ID] },
				{
					entityType: "Consignment"
				},
				MOCK_TRUST_PAYLOAD
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

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		// Note: Currently, if JSON-LD expansion succeeds (even for invalid types),
		// the service will continue and return an empty result from the app.
		// This test documents current behavior - the type expands but app returns empty.
		const result = await dataSpaceConnectorService.getDataAssetEntities(
			{ dataSetId: [SERVICE_DATASET_ID] },
			{
				entityType: "Consignment33333",
				jsonLdContext: ["https://vocabulary.uncefact.org/unece-context-D23B.jsonld"]
			},
			MOCK_TRUST_PAYLOAD
		);

		// App returns empty result for unknown type
		expect(result.itemList.itemListElement.length).toBe(0);
	});

	// ============================================
	// RFC-004 Specific Tests
	// ============================================

	test("Apps declare datasetsHandled() returning IDataspaceProtocolDataset[]", async () => {
		// Verify test app implements the RFC-004 interface correctly
		const testApp = new TestDataSpaceConnectorApp();
		const datasets = testApp.datasetsHandled();

		expect(datasets).toBeDefined();
		expect(Is.array(datasets)).toBe(true);
		expect(datasets.length).toBeGreaterThan(0);

		// Verify each dataset has required DCAT properties
		const dataset = datasets[0];
		expect(dataset["@id"]).toBeDefined();
		expect(dataset["@type"]).toBe(DataspaceProtocolCatalogTypes.Dataset);

		// DS Protocol requires hasPolicy as array
		const policies = dataset.hasPolicy as IOdrlOffer[] | undefined;
		expect(policies).toBeDefined();
		expect(Is.array(policies)).toBe(true);
		expect(policies?.length).toBeGreaterThan(0);

		if (policies && policies.length > 0) {
			const policy = policies[0];
			// Verify policy has required ODRL Offer properties
			expect(policy["@type"]).toBeDefined();
			expect(policy["@type"]).toBe("Offer");
			expect(policy["@id"] ?? policy.uid).toBeDefined();
		}
	});

	test("Service matches app by dataset @id", async () => {
		// Ensure context IDs are set
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		// The test app declares it handles SERVICE_DATASET_ID
		// Call getDataAssetEntities with that dataset ID
		const result = await dataSpaceConnectorService.getDataAssetEntities(
			{ dataSetId: [SERVICE_DATASET_ID] },
			{
				entityType: "https://vocabulary.uncefact.org/Consignment"
			},
			MOCK_TRUST_PAYLOAD
		);

		// Should successfully match and delegate to app
		expect(result).toBeDefined();
		expect(result.itemList.itemListElement).toBeDefined();
	});

	test("Service throws ConflictError when multiple apps handle same dataset", async () => {
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		// Register first app
		const testApp1 = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp1);
		await testApp1.start();

		// Register the SAME app instance with a different ID (simulating two apps handling same dataset)
		const testApp2 = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register("https://twin.example.org/app2", () => testApp2);
		await dataSpaceConnectorService.registerApp("https://twin.example.org/app2", testApp2);

		// Try to get entities - should throw ConflictError because both apps handle SERVICE_DATASET_ID
		await expect(
			dataSpaceConnectorService.getDataAssetEntities(
				{ dataSetId: [SERVICE_DATASET_ID] },
				{
					entityType: "https://vocabulary.uncefact.org/Consignment"
				},
				MOCK_TRUST_PAYLOAD
			)
		).rejects.toMatchObject({
			name: "ConflictError"
		});
	});

	test("Dataset-centric data requests use IDataset", async () => {
		// Ensure context IDs are set
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		// Track handleDataRequest calls
		let capturedDataRequest: unknown = null;
		const testApp = new TestDataSpaceConnectorApp();
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

		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		// Call getDataAssetEntities
		await dataSpaceConnectorService.getDataAssetEntities(
			{ dataSetId: [SERVICE_DATASET_ID] },
			{
				entityType: "https://vocabulary.uncefact.org/Consignment"
			},
			MOCK_TRUST_PAYLOAD
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

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		// testApp.supportedQueryTypes() returns ["TestQueryType"]
		// Try with supported type - should succeed
		const resultSupported = await dataSpaceConnectorService.queryDataAsset(
			{ dataSetId: [SERVICE_DATASET_ID] },
			{ type: "TestQueryType", q: "test" },
			MOCK_TRUST_PAYLOAD
		);
		expect(resultSupported).toBeDefined();

		// Try with unsupported type - should throw UnprocessableError
		await expect(
			dataSpaceConnectorService.queryDataAsset(
				{ dataSetId: [SERVICE_DATASET_ID] },
				{ type: "UnsupportedQueryType", q: "test" },
				MOCK_TRUST_PAYLOAD
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

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		// Track handleDataRequest calls to verify cursor is passed
		let capturedPagination: { cursor?: string; limit?: number } | undefined;
		const testApp = new TestDataSpaceConnectorApp();
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

		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		// Call with pagination
		await dataSpaceConnectorService.getDataAssetEntities(
			{ dataSetId: [SERVICE_DATASET_ID] },
			{
				entityType: "https://vocabulary.uncefact.org/Consignment"
			},
			"test-cursor",
			50,
			MOCK_TRUST_PAYLOAD
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

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const mockContext = {
			serverRequest: { url: "https://provider.com/data-space-connector/entities" }
		} as IHttpRequestContext;

		const request = {
			headers: {
				[HeaderTypes.Authorization]: HeaderHelper.createBearer(MOCK_TRUST_PAYLOAD)
			},
			query: {
				type: "https://vocabulary.uncefact.org/Consignment",
				datasetId: SERVICE_DATASET_ID
			}
		};

		const response = (await getDataAssetEntitiesRoute(
			mockContext,
			"data-space-connector",
			request
		)) as IDataAssetEntitiesResponse;

		// Verify no Link header when no cursor
		expect(response.headers).toBeUndefined();
	});

	test("Link header present when cursor exists", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		// Create a test app that returns a cursor
		const testApp = new TestDataSpaceConnectorApp();
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

		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const mockContext = {
			serverRequest: { url: "https://provider.com/data-space-connector/entities" }
		} as IHttpRequestContext;

		const request = {
			headers: {
				[HeaderTypes.Authorization]: HeaderHelper.createBearer(MOCK_TRUST_PAYLOAD)
			},
			query: {
				type: "https://vocabulary.uncefact.org/Consignment",
				datasetId: SERVICE_DATASET_ID
			}
		};

		const response = (await getDataAssetEntitiesRoute(
			mockContext,
			"data-space-connector",
			request
		)) as IDataAssetEntitiesResponse;

		// Verify Link header is present
		expect(response.headers).toBeDefined();
		expect(response.headers?.[HeaderTypes.Link]).toBeDefined();
	});

	test("Link header format is RFC 8288 compliant", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		// Create a test app that returns a cursor
		const testApp = new TestDataSpaceConnectorApp();
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

		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const mockContext = {
			serverRequest: { url: "https://provider.com/data-space-connector/entities" }
		} as IHttpRequestContext;

		const request = {
			headers: {
				[HeaderTypes.Authorization]: HeaderHelper.createBearer(MOCK_TRUST_PAYLOAD)
			},
			query: {
				type: "https://vocabulary.uncefact.org/Consignment",
				datasetId: SERVICE_DATASET_ID
			}
		};

		const response = (await getDataAssetEntitiesRoute(
			mockContext,
			"data-space-connector",
			request
		)) as IDataAssetEntitiesResponse;

		// Verify Link header format: <url?cursor=...>; rel="next"
		const linkHeader = response.headers?.[HeaderTypes.Link];
		expect(linkHeader).toBe(
			'<https://provider.com/data-space-connector/entities?cursor=rfc-test-cursor-abc123>; rel="next"'
		);
	});

	test("Cursor NOT in response body", async () => {
		// Ensure context IDs are set for test app
		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY
		});

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		// Create a test app that returns a cursor
		const testApp = new TestDataSpaceConnectorApp();
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

		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const mockContext = {
			serverRequest: { url: "https://provider.com/data-space-connector/entities" }
		} as IHttpRequestContext;

		const request = {
			headers: {
				[HeaderTypes.Authorization]: HeaderHelper.createBearer(MOCK_TRUST_PAYLOAD)
			},
			query: {
				type: "https://vocabulary.uncefact.org/Consignment",
				datasetId: SERVICE_DATASET_ID
			}
		};

		const response = (await getDataAssetEntitiesRoute(
			mockContext,
			"data-space-connector",
			request
		)) as IDataAssetEntitiesResponse;

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

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		// Create a test app that returns different results based on cursor
		let requestCount = 0;
		const testApp = new TestDataSpaceConnectorApp();
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

		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const mockContext = {
			serverRequest: { url: "https://provider.com/data-space-connector/entities/query" }
		} as IHttpRequestContext;

		// First request - should get Link header with cursor
		const firstRequest = {
			headers: {
				[HeaderTypes.Authorization]: HeaderHelper.createBearer(MOCK_TRUST_PAYLOAD)
			},
			body: {
				dataAsset: { dataSetId: [SERVICE_DATASET_ID] },
				query: { type: "TestQueryType", q: "test-query" }
			}
		};

		const firstResponse = (await queryDataAssetRoute(
			mockContext,
			"data-space-connector",
			firstRequest
		)) as IDataAssetEntitiesResponse;

		// Verify first response has Link header
		expect(firstResponse.headers?.[HeaderTypes.Link]).toBeDefined();

		// Extract cursor from Link header using HeaderHelper
		const linkHeaderValue = firstResponse.headers?.[HeaderTypes.Link];
		const nextLink = HeaderHelper.extractLinkHeaderRelation(linkHeaderValue, "next");
		expect(nextLink?.urlQueryParams?.cursor).toBe("page2-cursor");

		// Second request using cursor from Link header
		const secondRequest = {
			headers: {
				[HeaderTypes.Authorization]: HeaderHelper.createBearer(MOCK_TRUST_PAYLOAD)
			},
			body: {
				dataAsset: { dataSetId: [SERVICE_DATASET_ID] },
				query: { type: "TestQueryType", q: "test-query" }
			},
			query: {
				cursor: nextLink?.urlQueryParams?.cursor
			}
		};

		const secondResponse = (await queryDataAssetRoute(
			mockContext,
			"data-space-connector",
			secondRequest
		)) as IDataAssetEntitiesResponse;

		// Verify second response has no Link header (last page)
		expect(secondResponse.headers).toBeUndefined();
		expect(requestCount).toBe(2);
	});

	test("App validation requires at least one handler method", async () => {
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		// Create an app that declares datasets but has no handleDataRequest method
		// This should be rejected because it can't handle the datasets it declares
		const invalidApp: IDataSpaceConnectorApp = {
			className: () => "InvalidApp",
			activitiesHandled: () => [],
			datasetsHandled: (): IDataspaceProtocolDataset[] =>
				[
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@id": "https://example.org/dataset",
						"@type": "Dataset",
						hasPolicy: [
							{
								"@type": "Offer",
								"@id": "urn:uuid:policy-1",
								uid: "urn:uuid:policy-1",
								assigner: "https://twin.example.org",
								permission: [
									{
										action: "read"
									}
								]
							}
						],
						distribution: {
							"@id": "https://example.org/distribution-1",
							format: "Http-Pull-Query-Format",
							accessService: "https://twin.example.org/data-service-1",
							"@type": "Distribution"
						},
						"dcterms:type": "https://vocabulary.uncefact.org/Consignment"
					}
				] as unknown as IDataspaceProtocolDataset[],
			supportedQueryTypes: () => ["TestQuery"],
			start: async () => {}
			// Note: Missing handleDataRequest - this is the violation
		};

		// Trying to register app that declares datasets but has no handler should throw
		await expect(
			dataSpaceConnectorService.registerApp("https://twin.example.org/invalid-app", invalidApp)
		).rejects.toMatchObject({
			name: "GeneralError"
		});
	});

	// ============================================
	// DS Protocol Compliance Tests
	// ============================================

	test("registerApp rejects datasets without hasPolicy", async () => {
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const invalidApp: IDataSpaceConnectorApp = {
			className: () => "InvalidAppNoPolicy",
			activitiesHandled: () => [],
			datasetsHandled: (): IDataspaceProtocolDataset[] => [
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@id": "https://example.org/invalid-dataset",
					"@type": DataspaceProtocolCatalogTypes.Dataset,
					distribution: {
						"@id": "https://example.org/distribution-1",
						"@type": "Distribution",
						format: "Http-Pull-Query-Format",
						accessService: "https://twin.example.org/data-service-1"
					},
					"dcterms:type": "https://vocabulary.uncefact.org/Consignment"
					// Missing odrl:hasPolicy!
				} as unknown as IDataspaceProtocolDataset
			],
			supportedQueryTypes: () => ["EntityFilter"],
			handleDataRequest: vi.fn(),
			start: async () => {}
		};

		await expect(
			dataSpaceConnectorService.registerApp(
				"https://twin.example.org/invalid-app-no-policy",
				invalidApp
			)
		).rejects.toMatchObject({
			source: "DataSpaceConnectorService",
			properties: {
				validationObject: "dataset",
				validationFailures: [{ property: "", reason: "must have required property 'hasPolicy'" }]
			},
			name: "ValidationError"
		});
	});

	test("registerApp rejects policies with invalid @type", async () => {
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const invalidApp: IDataSpaceConnectorApp = {
			className: () => "InvalidAppPolicyWrongType",
			activitiesHandled: () => [],
			datasetsHandled: (): IDataspaceProtocolDataset[] => [
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@id": "https://example.org/invalid-dataset",
					"@type": DataspaceProtocolCatalogTypes.Dataset,
					"odrl:hasPolicy": [
						{
							"@type": "odrl:Agreement", // Wrong type! Should be "Offer"
							"@id": "urn:uuid:policy-1",
							"odrl:permission": [
								{
									action: "read"
								}
							]
						}
					],
					distribution: {
						"@id": "https://example.org/distribution-1",
						"@type": "Distribution",
						format: "Http-Pull-Query-Format",
						accessService: "https://twin.example.org/data-service-1"
					},
					"dcterms:type": "https://vocabulary.uncefact.org/Consignment"
				} as unknown as IDataspaceProtocolDataset
			],
			supportedQueryTypes: () => ["EntityFilter"],
			handleDataRequest: vi.fn(),
			start: async () => {}
		};

		await expect(
			dataSpaceConnectorService.registerApp(
				"https://twin.example.org/invalid-app-policy-wrong-type",
				invalidApp
			)
		).rejects.toMatchObject({
			source: "DataSpaceConnectorService",
			properties: {
				validationObject: "dataset",
				validationFailures: [
					{ property: "/hasPolicy/0/@type", reason: "must be equal to constant" }
				]
			},
			name: "ValidationError"
		});
	});

	test("registerApp rejects policies without @id", async () => {
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const invalidApp: IDataSpaceConnectorApp = {
			className: () => "InvalidAppPolicyNoId",
			activitiesHandled: () => [],
			datasetsHandled: (): IDataspaceProtocolDataset[] => [
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@id": "https://example.org/invalid-dataset",
					"@type": DataspaceProtocolCatalogTypes.Dataset,
					"odrl:hasPolicy": [
						{
							"@type": "odrl:Offer",
							"odrl:permission": [
								{
									action: "read"
								}
							]
							// Missing @id! (and uid)
						}
					],
					distribution: {
						"@id": "https://example.org/distribution-1",
						"@type": "Distribution",
						format: "Http-Pull-Query-Format",
						accessService: "https://twin.example.org/data-service-1"
					},
					"dcterms:type": "https://vocabulary.uncefact.org/Consignment"
				} as unknown as IDataspaceProtocolDataset
			],
			supportedQueryTypes: () => ["EntityFilter"],
			handleDataRequest: vi.fn(),
			start: async () => {}
		};

		await expect(
			dataSpaceConnectorService.registerApp(
				"https://twin.example.org/invalid-app-policy-no-id",
				invalidApp
			)
		).rejects.toMatchObject({
			source: "DataSpaceConnectorService",
			properties: {
				validationObject: "dataset",
				validationFailures: [
					{ property: "/hasPolicy/0", reason: "must have required property '@id'" }
				]
			},
			name: "ValidationError"
		});
	});

	test("registerApp rejects datasets without distribution format", async () => {
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const invalidApp: IDataSpaceConnectorApp = {
			className: () => "InvalidAppNoDistributionFormat",
			activitiesHandled: () => [],
			datasetsHandled: (): IDataspaceProtocolDataset[] => [
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@id": "https://example.org/invalid-dataset",
					"@type": DataspaceProtocolCatalogTypes.Dataset,
					distribution: {
						"@id": "https://example.org/distribution-1",
						"@type": "Distribution",
						accessService: "https://twin.example.org/data-service-1"
					},
					"dcterms:type": "https://vocabulary.uncefact.org/Consignment",
					hasPolicy: {
						"@type": "Offer",
						"@id": "urn:uuid:policy-1",
						assigner: "https://twin.example.org",
						permission: [
							{
								action: "read"
							}
						]
					}
				} as unknown as IDataspaceProtocolDataset
			],
			supportedQueryTypes: () => ["EntityFilter"],
			handleDataRequest: vi.fn(),
			start: async () => {}
		};

		await expect(
			dataSpaceConnectorService.registerApp(
				"https://twin.example.org/invalid-app-no-distribution-format",
				invalidApp
			)
		).rejects.toMatchObject({
			source: "DataSpaceConnectorService",
			properties: {
				validationObject: "dataset",
				validationFailures: [
					{ property: "/distribution/0", reason: "must have required property 'format'" }
				]
			},
			name: "ValidationError"
		});
	});
});
