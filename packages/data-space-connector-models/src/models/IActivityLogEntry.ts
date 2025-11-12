// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IError } from "@twin.org/core";
import type { ActivityProcessingStatus } from "./activityProcessingStatus.js";
import type { IActivityLogDates } from "./IActivityLogDates.js";
import type { IActivityLogDetails } from "./IActivityLogDetails.js";
import type { ITaskApp } from "./ITaskApp.js";

/**
 * The details related to the processing of an Activity
 */
export interface IActivityLogEntry extends IActivityLogDetails {
	/**
	 * Status of the Activity Processing.
	 */
	status: ActivityProcessingStatus;
	/**
	 * The pending tasks that have to be run to process the Activity.
	 */
	pendingTasks?: ITaskApp[];

	/**
	 * The running tasks that are processing the Activity.
	 */
	runningTasks?: (ITaskApp & IActivityLogDates)[];

	/**
	 * The tasks that have already finalized.
	 */
	finalizedTasks?: (ITaskApp &
		IActivityLogDates & {
			/**
			 * The task result.
			 */
			result: string;
		})[];

	/**
	 * The tasks that are in error.
	 */
	inErrorTasks?: (ITaskApp & {
		/**
		 * The error that happened
		 */
		error: IError;
	})[];
}
