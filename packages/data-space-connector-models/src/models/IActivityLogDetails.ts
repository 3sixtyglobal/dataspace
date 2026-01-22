// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The details related to the processing of an Activity
 */
export interface IActivityLogDetails {
	/**
	 * The Id of the Activity Log entry.
	 */
	id: string;

	/**
	 * The activity Id that this entry refers to.
	 */
	activityId?: string;

	/**
	 * The identity of the Activity's generator.
	 */
	generator: string;

	/**
	 * The creation date of this object.
	 */
	dateCreated: string;

	/**
	 * The last update date of this object.
	 */
	dateModified: string;

	/**
	 * Number of times this activity has been retried.
	 */
	retryCount?: number;
}
