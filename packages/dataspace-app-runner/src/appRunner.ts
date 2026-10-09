// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ContextIdStore } from "@3sixty/context";
import { Guards, Is } from "@3sixty/core";
import {
	DataspaceAppFactory,
	type IDataspaceApp,
	type IExecutionPayload
} from "@3sixty/dataspace-models";
import { ModuleHelper } from "@3sixty/modules";
import { nameof } from "@3sixty/nameof";

const APP_RUNNER_SOURCE = "appRunner";

let engine:
	| {
			start: () => Promise<void>;
			stop: () => Promise<void>;
	  }
	| undefined;

// Serialises concurrent startup+task dispatch: Node.js EventEmitter doesn't await async
// listeners, so appRunnerStart and appRunner can run concurrently in the worker thread.
let startupPromise: Promise<void> | undefined;

/**
 * Dataspace Task Startup Method.
 * @param engineCloneData Engine clone data used to initialise a worker-thread engine instance.
 * @param excludeComponents Verified regular expression patterns for component types to exclude from the clone.
 * @returns A promise that resolves when the engine has started and is ready to process tasks.
 */
export async function appRunnerStart(
	engineCloneData: unknown,
	excludeComponents?: string[]
): Promise<void> {
	startupPromise = (async () => {
		if (!Is.empty(engineCloneData)) {
			Guards.object(APP_RUNNER_SOURCE, nameof(engineCloneData), engineCloneData);
			const filteredCloneData = await ModuleHelper.execModuleMethod<unknown>(
				"@3sixty/engine-models",
				"EngineCloneHelper.filterCloneComponents",
				[engineCloneData, excludeComponents, true]
			);
			engine = await ModuleHelper.execModuleMethod<{
				start: () => Promise<void>;
				stop: () => Promise<void>;
			}>("@3sixty/engine-core", "EngineCoreBuilder.fromClone", [
				"engine",
				filteredCloneData,
				await ContextIdStore.getContextIds(),
				{ logLevel: "error" }
			]);
			await engine.start();
		}
	})();
	await startupPromise;
}

/**
 * Dataspace Task End.
 * @returns A promise that resolves when the engine has stopped and all resources are released.
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
 * @param engineCloneData Engine clone data used to initialise a worker-thread engine instance.
 * @param payload The execution payload describing the activity and target app.
 * @returns The result produced by the app's handleActivity method.
 */
export async function appRunner(
	engineCloneData: unknown,
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
