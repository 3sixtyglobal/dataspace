// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IActivityTaskEntry } from "./IActivityTaskEntry.js";

/**
 * Denotes a task associated with an Activity
 */
export interface IActivityTask {
	/**
	 * The activity log entry.
	 */
	activityLogEntryId: string;

	/**
	 * The associated tasks
	 */
	associatedTasks: IActivityTaskEntry[];
}
