// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Tests for concurrent startup and task dispatch in appRunner.
 *
 * BackgroundTaskService sends both the initialisation message (appRunnerStart) and the task
 * message (appRunner) to the worker thread as fire-and-forget postMessage calls. Because the
 * worker's message handler is async but not serialised, both invocations can run concurrently.
 *
 * appRunnerStart assigns its startup body to startupPromise; appRunner awaits it before
 * accessing DataspaceAppFactory. The tests below use a Promise barrier to create a deterministic
 * concurrent window and verify appRunner correctly suspends until startup completes.
 */

import { ContextIdStore } from "@twin.org/context";
import {
	DataspaceAppFactory,
	type IActivityQuery,
	type IDataspaceApp,
	type IExecutionPayload,
	type IProcessingGroupOptions
} from "@twin.org/dataspace-models";
import { ModuleHelper } from "@twin.org/modules";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { appRunner, appRunnerEnd, appRunnerStart } from "../src/appRunner.js";

const APP_ID = "https://twin.example.org/test-app";

const MOCK_APP: IDataspaceApp = {
	className: () => "MockRaceTestApp",
	activitiesHandled: (): IActivityQuery[] => [],
	supportedQueryTypes: () => [],
	processingGroups: (): { [id: string]: IProcessingGroupOptions } => ({}),
	handleActivity: vi.fn().mockResolvedValue("ok")
};

const MOCK_PAYLOAD: IExecutionPayload = {
	activityLogEntryId: "urn:x-activity-log:race-test-001",
	dataspaceAppId: APP_ID,
	activity: {
		"@context": "https://www.w3.org/ns/activitystreams",
		type: "Create",
		generator: "did:iota:testnet:generator",
		actor: "did:iota:testnet:actor",
		object: { type: "Document" }
	} as never
};

const MOCK_CLONE = {
	config: { types: {}, debug: false, silent: true },
	state: {},
	typeInitialisers: [],
	entitySchemas: {},
	contextIdKeys: []
} as never;

describe("appRunner - concurrent startup and task dispatch", () => {
	let mockEngineStart: () => Promise<void>;

	beforeEach(() => {
		mockEngineStart = vi.fn().mockResolvedValue(undefined);

		DataspaceAppFactory.clear();
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({});

		vi.spyOn(ModuleHelper, "execModuleMethod").mockImplementation(async () => ({
			className: () => "MockAppRunnerEngine",
			start: async () => mockEngineStart(),
			stop: vi.fn().mockResolvedValue(undefined)
		}));
	});

	afterEach(async () => {
		await appRunnerEnd();
		vi.restoreAllMocks();
		DataspaceAppFactory.clear();
	});

	it("appRunner succeeds when called concurrently with appRunnerStart", async () => {
		let releaseStartup!: () => void;
		const startupBarrier = new Promise<void>(resolve => {
			releaseStartup = resolve;
		});

		// Block startup until we explicitly release it, then register the DS App.
		mockEngineStart = async () => {
			await startupBarrier;
			DataspaceAppFactory.register(APP_ID, () => MOCK_APP);
		};

		// Both calls are fire-and-forget, mirroring BackgroundTaskService dispatch.
		// appRunner suspends at `await startupPromise` while startup is blocked.
		const startupPromise = appRunnerStart(MOCK_CLONE);
		const runnerPromise = appRunner(MOCK_CLONE, MOCK_PAYLOAD);

		// Releasing the barrier lets startup complete and register the DS App,
		// after which appRunner resumes and resolves.
		releaseStartup();

		await expect(runnerPromise).resolves.toBe("ok");
		await startupPromise;
	});

	it("appRunner rejects with the same error when startup fails", async () => {
		const startupError = new Error("engine start failed");
		mockEngineStart = async () => {
			throw startupError;
		};

		const startupPromise = appRunnerStart(MOCK_CLONE);
		const runnerPromise = appRunner(MOCK_CLONE, MOCK_PAYLOAD);

		await expect(runnerPromise).rejects.toThrow("engine start failed");
		await expect(startupPromise).rejects.toThrow("engine start failed");
	});

	it("appRunner passes through instantly when startupPromise is already resolved", async () => {
		mockEngineStart = async () => {
			DataspaceAppFactory.register(APP_ID, () => MOCK_APP);
		};

		await appRunnerStart(MOCK_CLONE);

		await expect(appRunner(MOCK_CLONE, MOCK_PAYLOAD)).resolves.toBe("ok");
		await expect(appRunner(MOCK_CLONE, MOCK_PAYLOAD)).resolves.toBe("ok");
	});
});
