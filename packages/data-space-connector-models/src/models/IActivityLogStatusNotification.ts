// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { TaskStatus } from "@twin.org/background-task-models";

/**
 * The status supplied to clients of the Data Space Connector
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
		 * The Data Space Connector App.
		 */
		dataSpaceConnectorAppId: string;

		/**
		 * The status of the task reported. Only terminated and error are reported.
		 */
		taskStatus: TaskStatus;
	};
}
