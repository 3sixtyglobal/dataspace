// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { nameof } from "@twin.org/nameof";
import { ActivityLogDetails } from "./entities/activityLogDetails.js";
import { ActivityTask } from "./entities/activityTask.js";
import { PushSubscription } from "./entities/pushSubscription.js";

/**
 * Inits schemas.
 */
export function initSchema(): void {
	EntitySchemaFactory.register(nameof<ActivityLogDetails>(), () =>
		EntitySchemaHelper.getSchema(ActivityLogDetails)
	);

	EntitySchemaFactory.register(nameof<ActivityTask>(), () =>
		EntitySchemaHelper.getSchema(ActivityTask)
	);

	EntitySchemaFactory.register(nameof<PushSubscription>(), () =>
		EntitySchemaHelper.getSchema(PushSubscription)
	);
}
