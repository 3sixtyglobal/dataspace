// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceDataPlaneServiceConfig } from "./IDataspaceDataPlaneServiceConfig.js";

/**
 * Dataspace Data Plane service options
 */
export interface IDataspaceDataPlaneServiceConstructorOptions {
	/**
	 * Logging component type.
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
	 * The entity storage type for Transfer Retrieval entities; when not registered no retrievals
	 * are recorded. Must match the Control Plane's setting.
	 * @default transfer-retrieval
	 */
	transferRetrievalEntityStorageType?: string;

	/**
	 * The entity storage type for Dataspace App Dataset entities.
	 * @default dataspace-app-dataset
	 */
	dataspaceAppDatasetEntityStorageType?: string;

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
	 * Platform component type.
	 * @default platform
	 */
	platformComponentType?: string;

	/**
	 * Policy administration point component type.
	 * The data plane fetches fresh agreements from PAP at access time (with a short-TTL
	 * in-memory cache) so that revoked or updated agreements take effect promptly.
	 * @default policy-administration-point
	 */
	papComponentType?: string;

	/**
	 * The component type for the optional telemetry component used for metrics, defaults to no telemetry.
	 */
	telemetryComponentType?: string;

	/**
	 * The configuration of the Dataspace Data Plane Service.
	 */
	config?: IDataspaceDataPlaneServiceConfig;
}
