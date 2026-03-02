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
}
