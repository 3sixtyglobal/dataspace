// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Tests for concurrent startup and task dispatch in pushDeliveryRunner.
 *
 * BackgroundTaskService sends both the initialisation message (pushDeliveryRunnerStart) and
 * the task message (pushDeliveryRunner) to the worker thread as fire-and-forget postMessage
 * calls. Because the worker's message handler is async but not serialised, both invocations
 * can run concurrently.
 *
 * pushDeliveryRunnerStart assigns its startup body to startupPromise; pushDeliveryRunner
 * awaits it before proceeding. The test below uses a Promise barrier to create a deterministic
 * concurrent window and verifies pushDeliveryRunner correctly suspends until startup completes.
 */

import { ContextIdStore } from "@twin.org/context";
import { ComponentFactory } from "@twin.org/core";
import type { IPushDeliveryPayload } from "@twin.org/dataspace-models";
import { ModuleHelper } from "@twin.org/modules";
import { FetchHelper } from "@twin.org/web";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
	pushDeliveryRunner,
	pushDeliveryRunnerEnd,
	pushDeliveryRunnerStart
} from "../src/pushDeliveryRunner.js";

// No consumerAuthToken - forces the body to call ComponentFactory.get("trust"), which is
// only registered inside the start mock, giving the test a genuine dependency on startup.
const MOCK_PAYLOAD: IPushDeliveryPayload = {
	consumerPid: "urn:uuid:consumer-push-test",
	providerPid: "urn:uuid:provider-push-test",
	generatorPid: "did:iota:testnet:provider",
	consumerEndpoint: "https://consumer.example.com/inbox",
	agreement: {} as never,
	data: { "@context": "https://schema.org" },
	entityType: "https://schema.org/Document"
};

const MOCK_TRUST = {
	generate: vi.fn().mockResolvedValue("mock-jwt-token")
};

const MOCK_CLONE = {
	config: { types: {}, debug: false, silent: true },
	state: {},
	typeInitialisers: [],
	entitySchemas: {},
	contextIdKeys: []
} as never;

describe("pushDeliveryRunner - concurrent startup and task dispatch", () => {
	let mockEngineStart: () => Promise<void>;

	beforeEach(() => {
		mockEngineStart = vi.fn().mockResolvedValue(undefined);

		ComponentFactory.clear();
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({});
		vi.spyOn(FetchHelper, "fetchJson").mockResolvedValue(undefined);

		vi.spyOn(ModuleHelper, "execModuleMethod").mockImplementation(async () => ({
			className: () => "MockPushRunnerEngine",
			start: async () => mockEngineStart(),
			stop: vi.fn().mockResolvedValue(undefined),
			getRegisteredInstanceTypeOptional: () => undefined
		}));
	});

	afterEach(async () => {
		await pushDeliveryRunnerEnd();
		vi.restoreAllMocks();
		ComponentFactory.clear();
	});

	it("pushDeliveryRunner succeeds when called concurrently with pushDeliveryRunnerStart", async () => {
		let releaseStartup!: () => void;
		const startupBarrier = new Promise<void>(resolve => {
			releaseStartup = resolve;
		});

		// Startup blocks on the barrier, then registers the trust component.
		// Without the fix, pushDeliveryRunner reaches ComponentFactory.get("trust") before
		// startup completes and throws factory.noGet.
		mockEngineStart = async () => {
			await startupBarrier;
			ComponentFactory.register("trust", () => MOCK_TRUST as never);
		};

		// Both calls are fire-and-forget, mirroring BackgroundTaskService dispatch.
		// pushDeliveryRunner suspends at `await startupPromise` while startup is blocked.
		const startupPromise = pushDeliveryRunnerStart(MOCK_CLONE);
		const runnerPromise = pushDeliveryRunner(MOCK_CLONE, MOCK_PAYLOAD);

		// Releasing the barrier lets startup complete and register the trust component,
		// after which pushDeliveryRunner resumes and resolves.
		releaseStartup();

		await expect(runnerPromise).resolves.toEqual({ success: true });
		await startupPromise;
	});

	it("pushDeliveryRunner rejects with the same error when startup fails", async () => {
		const startupError = new Error("engine start failed");
		mockEngineStart = async () => {
			throw startupError;
		};

		const startupPromise = pushDeliveryRunnerStart(MOCK_CLONE);
		const runnerPromise = pushDeliveryRunner(MOCK_CLONE, MOCK_PAYLOAD);

		await expect(runnerPromise).rejects.toThrow("engine start failed");
		await expect(startupPromise).rejects.toThrow("engine start failed");
	});

	it("pushDeliveryRunner passes through instantly when startupPromise is already resolved", async () => {
		mockEngineStart = async () => {
			ComponentFactory.register("trust", () => MOCK_TRUST as never);
		};

		await pushDeliveryRunnerStart(MOCK_CLONE);

		await expect(pushDeliveryRunner(MOCK_CLONE, MOCK_PAYLOAD)).resolves.toEqual({
			success: true
		});
		await expect(pushDeliveryRunner(MOCK_CLONE, MOCK_PAYLOAD)).resolves.toEqual({
			success: true
		});
	});
});
