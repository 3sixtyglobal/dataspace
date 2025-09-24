// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IDataSpaceConnectorServiceConfig } from "./IDataSpaceConnectorServiceConfig";

/**
 * Data Space Connector service options
 */
export interface IDataSpaceConnectorServiceConstructorOptions {
	/**
	 * Logging component type.
	 * @default logging
	 */
	loggingComponentType?: string;

	/**
	 * Background task connector.
	 * @default background-task
	 */
	backgroundTaskConnectorType?: string;

	/**
	 * Task Scheduler Component Type.
	 * @default task-scheduler
	 */
	taskSchedulerComponentType?: string;

	/**
	 * The entity storage for activity log details.
	 * @default activity-log-details
	 */
	activityLogEntityStorageType?: string;

	/**
	 * The entity storage for the association between Activities and Tasks.
	 * @default activity-task
	 */
	activityTaskEntityStorageType?: string;

	/**
	 * The configuration of the Data Space Connector Service.
	 */
	config?: IDataSpaceConnectorServiceConfig;
}
