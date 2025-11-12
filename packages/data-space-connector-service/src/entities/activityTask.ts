// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ITaskApp } from "@twin.org/data-space-connector-models";
import { entity, property } from "@twin.org/entity";

/**
 * Activity Log Details.
 */
@entity()
export class ActivityTask {
	/**
	 * The entry Id.
	 */
	@property({ type: "string", isPrimary: true })
	public activityLogEntryId!: string;

	/**
	 * The tasks.
	 */
	@property({ type: "array", format: "json" })
	public associatedTasks!: ITaskApp[];
}
