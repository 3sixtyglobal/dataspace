// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Dataspace Data Plane service configuration
 */
export interface IDataspaceDataPlaneServiceConfig {
	/**
	 * The amount of time in minutes to retain activity log entries until removal, set to -1 to keep forever.
	 * @default 10
	 */
	retainActivityLogsFor?: number;

	/**
	 * The interval in minutes in between activity log clean ups. -1 indicates no clean up shall be done.
	 * @default 60 minutes
	 */
	activityLogsCleanUpInterval?: number;

	/**
	 * The number of times to retry failed tasks, defaults to forever.
	 * @default undefined.
	 */
	retryCount?: number;

	/**
	 * Max HTTP retry attempts per push delivery task execution.
	 * @default 3
	 */
	pushRetryCount?: number;

	/**
	 * Base delay (ms) for exponential backoff between push HTTP retries.
	 * Effective delay = baseDelayMs * 2^attempt.
	 * @default 1000
	 */
	pushRetryBaseDelayMs?: number;

	/**
	 * Timeout (ms) for each push delivery HTTP POST request.
	 * @default 30000
	 */
	pushTimeoutMs?: number;

	/**
	 * Interval (ms) between orphaned PushSubscription cleanup scans.
	 * @default 3600000 (1 hour)
	 */
	pushSubscriptionCleanupIntervalMs?: number;
}
