// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Guards, Is } from "@twin.org/core";
import {
	DataSpaceConnectorAppFactory,
	type IDataSpaceConnectorApp,
	type IExecutionPayload
} from "@twin.org/data-space-connector-models";
import { EngineCore } from "@twin.org/engine-core";
import type { IEngineCore, IEngineCoreClone } from "@twin.org/engine-models";
import { nameof } from "@twin.org/nameof";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";

const CLASS_NAME = "DataSpaceAppRunner";

let engine: IEngineCore | undefined;

/**
 * Data Space Connector Task Startup Method.
 * @param engineCloneData The Engine.
 * @returns Nothing.
 */
export async function appRunnerStart(engineCloneData: IEngineCoreClone): Promise<void> {
	if (!Is.empty(engineCloneData)) {
		// If the clone data is not empty we use it to create a new engine as it's a new thread
		// otherwise we assume the factories are already populated.
		engine = new EngineCore();
		engine.populateClone(engineCloneData, true);
		await engine.start();
	}
}

/**
 * Data Space Connector Task End.
 * @returns Nothing.
 */
export async function appRunnerEnd(): Promise<void> {
	if (!Is.empty(engine)) {
		await engine.stop();
		engine = undefined;
	}
}

/**
 * Data Space Connector Task.
 * @param engineCloneData The Engine.
 * @param payload The payload
 * @returns The execution result.
 */
export async function appRunner(
	engineCloneData: IEngineCoreClone,
	payload: IExecutionPayload
): Promise<unknown> {
	Guards.objectValue<IExecutionPayload>(CLASS_NAME, nameof(payload), payload);
	Guards.stringValue(CLASS_NAME, nameof(payload.executorApp), payload.executorApp);
	Guards.stringValue(CLASS_NAME, nameof(payload.activityLogEntryId), payload.activityLogEntryId);
	Guards.object<IActivityStreamsActivity>(CLASS_NAME, nameof(payload.activity), payload.activity);

	const app = DataSpaceConnectorAppFactory.get<IDataSpaceConnectorApp>(payload.executorApp);

	const handleActivity = app?.handleActivity?.bind(app);
	Guards.function(CLASS_NAME, nameof(handleActivity), handleActivity);
	const result = await handleActivity(payload.activity);
	return result;
}
