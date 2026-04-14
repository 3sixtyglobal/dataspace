// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ActivityProcessingStatus } from "./activityProcessingStatus.js";
import type { IActivityLogDetails } from "./IActivityLogDetails.js";
import type { IActivityTaskEntry } from "./IActivityTaskEntry.js";

/**
 * The details related to the processing of an Activity
 */
export interface IActivityLogEntry extends IActivityLogDetails {
	/**
	 * Status of the Activity Processing.
	 */
	status: ActivityProcessingStatus;

	/**
	 * The tasks that have to be run to process the Activity.
	 */
	tasks?: IActivityTaskEntry[];
}
