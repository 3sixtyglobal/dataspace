// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Activity task statuses.
 */
export const ActivityTaskStatus = {
	/**
	 * Pending.
	 */
	Pending: "pending",

	/**
	 * Processing.
	 */
	Processing: "processing",

	/**
	 * Success.
	 */
	Success: "success",

	/**
	 * Failed.
	 */
	Failed: "failed"
} as const;

/**
 * Activity task statuses.
 */
export type ActivityTaskStatus = (typeof ActivityTaskStatus)[keyof typeof ActivityTaskStatus];
