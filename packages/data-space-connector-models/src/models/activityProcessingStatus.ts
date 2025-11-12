// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Activity processing statuses.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ActivityProcessingStatus = {
	/**
	 * Pending: Activity Processing has not started yet.
	 */
	Pending: "pending",

	/**
	 * Running Activity processing is running.
	 */
	Running: "running",

	/**
	 * Completed: Activity processing completed without error.
	 */
	Completed: "completed",

	/**
	 * Error: Activity processing cannot be performed and marked as in error. (Depends on application).
	 */
	Error: "error",

	/**
	 * Transient state. The background tasks associated with the activity are still being registered.
	 */
	Registering: "registering"
} as const;

/**
 * The type exported.
 */
export type ActivityProcessingStatus =
	(typeof ActivityProcessingStatus)[keyof typeof ActivityProcessingStatus];
