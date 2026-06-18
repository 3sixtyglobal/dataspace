// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Metric IDs for the dataspace data plane service.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataspaceDataPlaneMetricIds = {
	/**
	 * Number of activities notified.
	 */
	ActivitiesNotified: "ddp_activities_notified",

	/**
	 * Number of data asset queries executed.
	 */
	DataAssetsQueried: "ddp_data_assets_queried",

	/**
	 * Number of data asset entity retrievals.
	 */
	DataAssetsRetrieved: "ddp_data_assets_retrieved",

	/**
	 * Number of push subscriptions created.
	 */
	PushSubscriptionsCreated: "ddp_push_subscriptions_created",

	/**
	 * Number of push subscriptions removed.
	 */
	PushSubscriptionsRemoved: "ddp_push_subscriptions_removed",

	/**
	 * Number of outbound activities scheduled for push delivery.
	 */
	PushActivitiesScheduled: "ddp_push_activities_scheduled"
} as const;

/**
 * Metric IDs for the dataspace data plane service.
 */
export type DataspaceDataPlaneMetricIds =
	(typeof DataspaceDataPlaneMetricIds)[keyof typeof DataspaceDataPlaneMetricIds];
