// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { TaskStatus } from "@3sixty/background-task-models";

/**
 * The status supplied to clients of the Dataspace Data Plane
 */
export interface IActivityLogStatusNotification {
	/**
	 * The activity log entry id.
	 */
	activityLogEntryId: string;

	/**
	 * The activity Id.
	 */
	activityId?: string;

	/**
	 * The activity processing status through the associated tasks.
	 */
	taskProcessingStatus: {
		/**
		 * The task reported.
		 */
		taskId: string;

		/**
		 * The Dataspace App.
		 */
		dataspaceAppId: string;

		/**
		 * The status of the task reported. Only terminated and error are reported.
		 */
		taskStatus: TaskStatus;
	};
}
