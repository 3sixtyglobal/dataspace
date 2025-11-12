// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ITaskApp } from "./ITaskApp.js";

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
	associatedTasks: ITaskApp[];
}
