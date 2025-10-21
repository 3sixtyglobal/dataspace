// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GuardError, Guards, Is } from "@twin.org/core";
import {
	type IDataSpaceConnectorApp,
	type IExecutionPayload,
	DataSpaceConnectorAppFactory
} from "@twin.org/data-space-connector-models";
import { EngineCore } from "@twin.org/engine-core";
import type { IEngineCore, IEngineCoreClone } from "@twin.org/engine-models";
import { nameof } from "@twin.org/nameof";
import type { IActivity } from "@twin.org/standards-w3c-activity-streams";

const CLASS_NAME = "DataSpaceAppRunner";

/**
 * Data Space Connector Task.
 * @param engineCloneData The Engine.
 * @param payload The payload
 * @returns The execution result.
 */
export async function appRunner<T>(
	engineCloneData: IEngineCoreClone,
	payload: IExecutionPayload
): Promise<T> {
	Guards.objectValue<IExecutionPayload>(CLASS_NAME, nameof(payload), payload);
	Guards.stringValue(CLASS_NAME, nameof(payload.executorApp), payload.executorApp);
	Guards.stringValue(CLASS_NAME, nameof(payload.activityLogEntryId), payload.activityLogEntryId);
	Guards.object<IActivity>(CLASS_NAME, nameof(payload.activity), payload.activity);

	let engine: IEngineCore | undefined;
	try {
		if (!Is.empty(engineCloneData)) {
			// If the clone data is not empty we use it to create a new engine as it's a new thread
			// otherwise we assume the factories are already populated.
			engine = new EngineCore();
			engine.populateClone(engineCloneData, true);
			await engine.start();
		}

		const app = DataSpaceConnectorAppFactory.get<IDataSpaceConnectorApp>(payload.executorApp);
		if (!Is.function(app.handleActivity)) {
			throw new GuardError(
				CLASS_NAME,
				"invalidDataSpaceConnectorApp",
				nameof(app.handleActivity),
				app.handleActivity
			);
		}

		return app.handleActivity<T>(payload.activity);
	} finally {
		if (!Is.empty(engine)) {
			await engine.stop();
		}
	}
}
