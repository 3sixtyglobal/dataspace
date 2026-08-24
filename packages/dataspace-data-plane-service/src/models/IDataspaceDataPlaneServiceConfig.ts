// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Dataspace Data Plane service configuration
 */
export interface IDataspaceDataPlaneServiceConfig {
	/**
	 * The amount of time in ms to retain activity log entries until removal, set to -1 to keep forever.
	 * @default 600000
	 */
	retainActivityLogsForMs?: number;

	/**
	 * The interval in ms between activity log clean ups. -1 indicates no clean up shall be done.
	 * @default 3600000
	 */
	activityLogsCleanUpIntervalMs?: number;

	/**
	 * The number of times to retry failed tasks, defaults to no retries.
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

	/**
	 * TTL in ms for the in-memory PAP agreement cache.
	 * Applies only when a PAP component is registered.
	 * @default 30000 (30 seconds)
	 */
	agreementCacheTtlMs?: number;

	/**
	 * Maximum time in ms to wait for the agreement cache mutex during a getOrSet call.
	 * @default undefined (LruCache default)
	 */
	agreementCacheMutexTimeoutMs?: number;
}
