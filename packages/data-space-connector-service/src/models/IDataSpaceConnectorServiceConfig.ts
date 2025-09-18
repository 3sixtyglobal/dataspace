// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IDataSpaceConnectorAppDescriptor } from "@twin.org/data-space-connector-models";

/**
 * Data Space Connector service configuration
 */
export interface IDataSpaceConnectorServiceConfig {
	/**
	 * Data Space Connector App Descriptors to be registered initially
	 */
	dataSpaceConnectorAppDescriptors?: IDataSpaceConnectorAppDescriptor[];

	/**
	 * The amount of time in minutes to retain activity log entries until removal, set to -1 to keep forever.
	 * @default -1
	 */
	retainActivityLogsFor?: number;

	/**
	 * The interval in minutes in between activity log clean ups. -1 indicates no clean up shall be done.
	 * @default 60 minutes
	 */
	activityLogsCleanUpInterval?: number;
}
