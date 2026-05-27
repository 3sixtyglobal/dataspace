// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ContextIdStore } from "@twin.org/context";
import { Guards, Is } from "@twin.org/core";
import {
	DataspaceAppFactory,
	type IDataspaceApp,
	type IExecutionPayload
} from "@twin.org/dataspace-models";
import { EngineCore } from "@twin.org/engine-core";
import {
	EngineCoreFactory,
	type IEngineCore,
	type IEngineCoreClone
} from "@twin.org/engine-models";
import { nameof } from "@twin.org/nameof";

const APP_RUNNER_SOURCE = "appRunner";

let engine: IEngineCore | undefined;

// Serialises concurrent startup+task dispatch: Node.js EventEmitter doesn't await async
// listeners, so appRunnerStart and appRunner can run concurrently in the worker thread.
let startupPromise: Promise<void> | undefined;

/**
 * Dataspace Task Startup Method.
 * @param engineCloneData The Engine.
 * @returns Nothing.
 */
export async function appRunnerStart(engineCloneData: IEngineCoreClone): Promise<void> {
	startupPromise = (async () => {
		if (!Is.empty(engineCloneData)) {
			// If the clone data is not empty we use it to create a new engine as it's a new thread
			// otherwise we assume the factories are already populated.
			// We also must return a fixed instance of the engine from the factory in case another
			// background task is started in the same process, otherwise if the app runner ends
			// and removes the engine the factory would have a reference undefined.
			const newEngine = new EngineCore();
			EngineCoreFactory.register("engine", () => newEngine);

			newEngine.populateClone(engineCloneData, await ContextIdStore.getContextIds(), true);
			await newEngine.start();
			engine = newEngine;
		}
	})();
	await startupPromise;
}

/**
 * Dataspace Task End.
 * @returns Nothing.
 */
export async function appRunnerEnd(): Promise<void> {
	if (!Is.empty(engine)) {
		await engine.stop();
		engine = undefined;
	}
	startupPromise = undefined;
}

/**
 * Dataspace Task.
 * @param engineCloneData The Engine.
 * @param payload The payload
 * @returns The execution result.
 */
export async function appRunner(
	engineCloneData: IEngineCoreClone,
	payload: IExecutionPayload
): Promise<unknown> {
	// startupPromise is assigned as the first synchronous statement of appRunnerStart (before
	// any await) and MessagePort dispatch is FIFO, so it is always set by the time this runs
	// when both messages are dispatched from the same worker initialisation sequence.
	if (startupPromise) {
		await startupPromise;
	}

	Guards.objectValue<IExecutionPayload>(APP_RUNNER_SOURCE, nameof(payload), payload);
	Guards.stringValue(APP_RUNNER_SOURCE, nameof(payload.dataspaceAppId), payload.dataspaceAppId);
	Guards.stringValue(
		APP_RUNNER_SOURCE,
		nameof(payload.activityLogEntryId),
		payload.activityLogEntryId
	);
	Guards.object<IDataspaceApp>(APP_RUNNER_SOURCE, nameof(payload.activity), payload.activity);

	const app = DataspaceAppFactory.get<IDataspaceApp>(payload.dataspaceAppId);

	const handleActivity = app?.handleActivity?.bind(app);
	Guards.function(APP_RUNNER_SOURCE, nameof(handleActivity), handleActivity);
	const result = await handleActivity(payload.activity);
	return result;
}
