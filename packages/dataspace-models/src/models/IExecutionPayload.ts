// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceActivity } from "./IDataspaceActivity.js";

/**
 * Execution payload.
 */
export interface IExecutionPayload {
	/**
	 * The Activity Log Entry Id.
	 */
	activityLogEntryId: string;

	/**
	 * The activity
	 */
	activity: IDataspaceActivity;

	/**
	 * The executor App.
	 */
	executorApp: string;
}
