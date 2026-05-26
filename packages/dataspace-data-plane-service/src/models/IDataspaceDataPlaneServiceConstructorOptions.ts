// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceDataPlaneServiceConfig } from "./IDataspaceDataPlaneServiceConfig.js";

/**
 * Dataspace Data Plane service options
 */
export interface IDataspaceDataPlaneServiceConstructorOptions {
	/**
	 * Logging component type.
	 * @default logging
	 */
	loggingComponentType?: string;

	/**
	 * Background task component.
	 * @default background-task
	 */
	backgroundTaskComponentType?: string;

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
	 * The entity storage type for Transfer Process entities.
	 * Used to read Transfer Process state from shared storage.
	 * @default transfer-process
	 */
	transferProcessEntityStorageType?: string;

	/**
	 * The entity storage type for PushSubscription entities.
	 * @default push-subscription
	 */
	pushSubscriptionEntityStorageType?: string;

	/**
	 * The entity storage type for Dataspace App Dataset entities.
	 * @default dataspace-app-dataset
	 */
	dataspaceAppDatasetEntityStorageType?: string;

	/**
	 * The keys to use from the context ids to cleanup partitions.
	 */
	partitionContextIds?: string[];

	/**
	 * Trust component type.
	 * @default trust
	 */
	trustComponentType?: string;

	/**
	 * Policy enforcement point component type for ODRL policy enforcement.
	 * @default policy-enforcement-point-service
	 */
	pepComponentType?: string;

	/**
	 * Tenant admin component type.
	 * @default tenant-admin
	 */
	tenantAdminType?: string;

	/**
	 * The configuration of the Dataspace Data Plane Service.
	 */
	config?: IDataspaceDataPlaneServiceConfig;
}
