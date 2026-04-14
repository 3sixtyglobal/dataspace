// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IError } from "@twin.org/core";
import type { ActivityTaskStatus } from "./activityTaskStatus.js";

/**
 * Denotes a task associated with a Dataspace App
 */
export interface IActivityTaskEntry {
	/**
	 * Task Id.
	 */
	taskId: string;

	/**
	 * Dataspace App Id.
	 */
	dataspaceAppId: string;

	/**
	 * Task status.
	 */
	status: ActivityTaskStatus;

	/**
	 * Processing Group Id.
	 */
	processingGroupId?: string;

	/**
	 * Task processing start timestamp
	 */
	startDate?: string;

	/**
	 * Task processing end timestamp
	 */
	endDate?: string;

	/**
	 * The result of the task processing, if completed.
	 */
	result?: unknown;

	/**
	 * The error occurred during task processing, if any.
	 */
	error?: IError;
}
