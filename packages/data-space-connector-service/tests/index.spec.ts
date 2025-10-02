// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import path from "node:path";
import {
	EntityStorageBackgroundTaskConnector,
	initSchema as initSchemaBackgroundTask,
	type BackgroundTask
} from "@twin.org/background-task-connector-entity-storage";
import {
	BackgroundTaskConnectorFactory,
	type ITaskSchedulerComponent
} from "@twin.org/background-task-models";
import { TaskSchedulerService } from "@twin.org/background-task-scheduler";
import { ComponentFactory, Is, ObjectHelper } from "@twin.org/core";
import {
	ActivityProcessingStatus,
	type IActivityLogDates,
	type IActivityLogEntry
} from "@twin.org/data-space-connector-models";
import { DataSpaceConnectorAppFactory } from "@twin.org/data-space-connector-models";
import { TestDataSpaceConnectorApp } from "@twin.org/data-space-connector-test-app";
import { FileEntityStorageConnector } from "@twin.org/entity-storage-connector-file";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { ModuleHelper } from "@twin.org/modules";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import { addAllContextsToDocumentCache } from "@twin.org/standards-ld-contexts";
import type { IActivity } from "@twin.org/standards-w3c-activity-streams";
import { cleanupTestEnv, setupTestEnv } from "./setupTestEnv";
import { activityLdContextArray, canonicalActivity, extendedActivity } from "./testData";
import { DataSpaceConnectorService } from "../src/dataSpaceConnectorService";
import type { ActivityLogDetails } from "../src/entities/activityLogDetails";
import type { ActivityTask } from "../src/entities/activityTask";
import type { IDataSpaceConnectorServiceConstructorOptions } from "../src/models/IDataSpaceConnectorServiceConstructorOptions";
import { initSchema } from "../src/schema";

let activityLogStore: FileEntityStorageConnector<ActivityLogDetails>;
let activityTasksStore: FileEntityStorageConnector<ActivityTask>;

let options: IDataSpaceConnectorServiceConstructorOptions;

let backgroundTaskStorage: FileEntityStorageConnector<BackgroundTask>;
let backgroundTaskConnectorEntityStorage: EntityStorageBackgroundTaskConnector;
let taskScheduler: ITaskSchedulerComponent;

const BASE_STORE_DIR = "./tests/.tmp";

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
	beforeAll(async () => {
		await setupTestEnv();

		// Mock the module helper to execute the method in the same thread
		ModuleHelper.execModuleMethodThread = vi
			.fn()
			.mockImplementation(async (module, method, args) =>
				ModuleHelper.execModuleMethod(module, method, args)
			);

		addAllContextsToDocumentCache();

		initSchema();
		initSchemaBackgroundTask();

		options = {
			loggingComponentType: "logging",
			backgroundTaskConnectorType: "background-task",
			config: {}
		};
	});

	afterAll(async () => {
		await cleanupTestEnv();
	});

	beforeEach(async () => {
		activityLogStore = new FileEntityStorageConnector<ActivityLogDetails>({
			entitySchema: nameof<ActivityLogDetails>(),
			config: {
				directory: `${path.join(BASE_STORE_DIR, "/activity-log-store")}`
			}
		});
		await activityLogStore.bootstrap();

		activityTasksStore = new FileEntityStorageConnector<ActivityTask>({
			entitySchema: nameof<ActivityTask>(),
			config: {
				directory: `${path.join(BASE_STORE_DIR, "/activity-task-store")}`
			}
		});
		await activityTasksStore.bootstrap();

		EntityStorageConnectorFactory.register(
			nameofKebabCase<ActivityLogDetails>(),
			() => activityLogStore
		);
		EntityStorageConnectorFactory.register(
			nameofKebabCase<ActivityTask>(),
			() => activityTasksStore
		);

		backgroundTaskStorage = new FileEntityStorageConnector<BackgroundTask>({
			entitySchema: nameof<BackgroundTask>(),
			config: { directory: `${path.join(BASE_STORE_DIR, "/background-task-store")}` }
		});
		await backgroundTaskStorage.bootstrap();
		EntityStorageConnectorFactory.register("background-task", () => backgroundTaskStorage);
		backgroundTaskConnectorEntityStorage = new EntityStorageBackgroundTaskConnector({
			backgroundTaskEntityStorageType: "background-task"
		});
		BackgroundTaskConnectorFactory.register(
			"background-task",
			() => backgroundTaskConnectorEntityStorage
		);
		taskScheduler = new TaskSchedulerService();
		ComponentFactory.register("task-scheduler", () => taskScheduler);
	});

	test("It should receive an Activity in the Activity Stream - canonical", async () => {
		await backgroundTaskConnectorEntityStorage.start("");

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const activityLogEntryId = await dataSpaceConnectorService.notifyActivity(canonicalActivity);
		await sleep(1500);

		const entry = await dataSpaceConnectorService.getActivityLogEntry(activityLogEntryId);
		assertActivityLog(entry);
	});

	test("It should receive an Activity in the Activity Stream - canonical LD Context Array", async () => {
		await backgroundTaskConnectorEntityStorage.start("");

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		// Avoid duplication check
		activityLdContextArray.updated = new Date().toISOString();

		const activityLogEntryId =
			await dataSpaceConnectorService.notifyActivity(activityLdContextArray);
		await sleep(1500);

		const entry = await dataSpaceConnectorService.getActivityLogEntry(activityLogEntryId);
		assertActivityLog(entry);
	});

	test.skip("It should receive an Activity in the Activity Stream - type extension", async () => {
		await backgroundTaskConnectorEntityStorage.start("");

		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		ComponentFactory.register("data-space-connector", () => dataSpaceConnectorService);

		const testApp = new TestDataSpaceConnectorApp();
		DataSpaceConnectorAppFactory.register(TestDataSpaceConnectorApp.APP_ID, () => testApp);
		await testApp.start();

		const activityLogEntryId = await dataSpaceConnectorService.notifyActivity(extendedActivity);
		await sleep(1500);

		const entry = await dataSpaceConnectorService.getActivityLogEntry(activityLogEntryId);
		assertActivityLog(entry);
	});

	test("It should not start any task if there is no registered DS Connector App", async () => {
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);
		activityLdContextArray.updated = new Date().toISOString();

		const activityLogEntryId =
			await dataSpaceConnectorService.notifyActivity(activityLdContextArray);
		const entry = await dataSpaceConnectorService.getActivityLogEntry(activityLogEntryId);

		expect(entry.status).toBe(ActivityProcessingStatus.Completed);
		expect(entry.pendingTasks?.length).toBe(0);
		expect(entry.runningTasks?.length).toBe(0);
		expect(entry.finalizedTasks?.length).toBe(0);
		expect(entry.inErrorTasks?.length).toBe(0);
	});

	test("It should report an error if Activity is duplicated", async () => {
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);

		await expect(dataSpaceConnectorService.notifyActivity(canonicalActivity)).rejects.toMatchObject(
			{
				name: "ConflictError"
			}
		);
	});

	test("It should report an error if Activity does not contain generator nor actor", async () => {
		const dataSpaceConnectorService = new DataSpaceConnectorService(options);

		const activity = ObjectHelper.clone<IActivity>(canonicalActivity);
		delete activity.generator;
		delete activity.actor;

		await expect(dataSpaceConnectorService.notifyActivity(activity)).rejects.toMatchObject({
			name: "GuardError"
		});
	});
});
