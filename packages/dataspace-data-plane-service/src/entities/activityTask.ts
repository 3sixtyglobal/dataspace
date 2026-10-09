// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IActivityTaskEntry } from "@3sixty/dataspace-models";
import { entity, property } from "@3sixty/entity";

/**
 * Activity Task entity linking activity log entries to their background tasks.
 */
@entity()
export class ActivityTask {
	/**
	 * The entry Id.
	 */
	@property({ type: "string", isPrimary: true, maxLength: 255 })
	public activityLogEntryId!: string;

	/**
	 * The tasks.
	 */
	@property({ type: "array", format: "json" })
	public associatedTasks!: IActivityTaskEntry[];
}
