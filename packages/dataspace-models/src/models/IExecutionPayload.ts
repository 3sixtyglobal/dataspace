// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";

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
	activity: IActivityStreamsActivity;

	/**
	 * The executor App.
	 */
	executorApp: string;
}
