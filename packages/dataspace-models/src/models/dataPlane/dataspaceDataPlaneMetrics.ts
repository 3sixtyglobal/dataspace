// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { type ITelemetryMetric, MetricType } from "@3sixty/telemetry-models";
import { DataspaceDataPlaneMetricIds } from "./dataspaceDataPlaneMetricIds.js";

/**
 * Metrics registered by the dataspace data plane service.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataspaceDataPlaneMetrics: ITelemetryMetric[] = [
	{
		id: DataspaceDataPlaneMetricIds.ActivitiesNotified,
		label: "Activities notified",
		type: MetricType.Counter
	},
	{
		id: DataspaceDataPlaneMetricIds.DataAssetsQueried,
		label: "Data assets queried",
		type: MetricType.Counter
	},
	{
		id: DataspaceDataPlaneMetricIds.DataAssetsRetrieved,
		label: "Data assets retrieved",
		type: MetricType.Counter
	},
	{
		id: DataspaceDataPlaneMetricIds.PushSubscriptionsCreated,
		label: "Push subscriptions created",
		type: MetricType.Counter
	},
	{
		id: DataspaceDataPlaneMetricIds.PushSubscriptionsRemoved,
		label: "Push subscriptions removed",
		type: MetricType.Counter
	},
	{
		id: DataspaceDataPlaneMetricIds.PushActivitiesScheduled,
		label: "Push activities scheduled",
		type: MetricType.Counter
	}
];
