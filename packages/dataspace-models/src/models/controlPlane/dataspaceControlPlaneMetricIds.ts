// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Metric IDs for the dataspace control plane service.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataspaceControlPlaneMetricIds = {
	/**
	 * Number of transfer processes requested.
	 */
	TransfersRequested: "dcp_transfers_requested",

	/**
	 * Number of transfer processes prepared by the consumer.
	 */
	TransfersPrepared: "dcp_transfers_prepared",

	/**
	 * Number of transfer processes started.
	 */
	TransfersStarted: "dcp_transfers_started",

	/**
	 * Number of transfer processes completed.
	 */
	TransfersCompleted: "dcp_transfers_completed",

	/**
	 * Number of transfer processes suspended.
	 */
	TransfersSuspended: "dcp_transfers_suspended",

	/**
	 * Number of transfer processes terminated.
	 */
	TransfersTerminated: "dcp_transfers_terminated",

	/**
	 * Number of contract negotiations initiated.
	 */
	NegotiationsInitiated: "dcp_negotiations_initiated",

	/**
	 * Number of app datasets created.
	 */
	AppDatasetsCreated: "dcp_app_datasets_created",

	/**
	 * Number of app datasets updated.
	 */
	AppDatasetsUpdated: "dcp_app_datasets_updated",

	/**
	 * Number of app datasets deleted.
	 */
	AppDatasetsDeleted: "dcp_app_datasets_deleted",

	/**
	 * Number of agreements removed by the agreement sweep.
	 */
	AgreementsSwept: "dcp_agreements_swept"
} as const;

/**
 * Metric IDs for the dataspace control plane service.
 */
export type DataspaceControlPlaneMetricIds =
	(typeof DataspaceControlPlaneMetricIds)[keyof typeof DataspaceControlPlaneMetricIds];
