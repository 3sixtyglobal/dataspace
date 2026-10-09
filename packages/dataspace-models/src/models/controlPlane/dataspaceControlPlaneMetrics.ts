// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { type ITelemetryMetric, MetricType } from "@3sixty/telemetry-models";
import { DataspaceControlPlaneMetricIds } from "./dataspaceControlPlaneMetricIds.js";

/**
 * Metrics registered by the dataspace control plane service.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataspaceControlPlaneMetrics: ITelemetryMetric[] = [
	{
		id: DataspaceControlPlaneMetricIds.TransfersRequested,
		label: "Transfers requested",
		type: MetricType.Counter
	},
	{
		id: DataspaceControlPlaneMetricIds.TransfersPrepared,
		label: "Transfers prepared",
		type: MetricType.Counter
	},
	{
		id: DataspaceControlPlaneMetricIds.TransfersStarted,
		label: "Transfers started",
		type: MetricType.Counter
	},
	{
		id: DataspaceControlPlaneMetricIds.TransfersCompleted,
		label: "Transfers completed",
		type: MetricType.Counter
	},
	{
		id: DataspaceControlPlaneMetricIds.TransfersSuspended,
		label: "Transfers suspended",
		type: MetricType.Counter
	},
	{
		id: DataspaceControlPlaneMetricIds.TransfersTerminated,
		label: "Transfers terminated",
		type: MetricType.Counter
	},
	{
		id: DataspaceControlPlaneMetricIds.NegotiationsInitiated,
		label: "Negotiations initiated",
		type: MetricType.Counter
	},
	{
		id: DataspaceControlPlaneMetricIds.AppDatasetsCreated,
		label: "App datasets created",
		type: MetricType.Counter
	},
	{
		id: DataspaceControlPlaneMetricIds.AppDatasetsUpdated,
		label: "App datasets updated",
		type: MetricType.Counter
	},
	{
		id: DataspaceControlPlaneMetricIds.AppDatasetsDeleted,
		label: "App datasets deleted",
		type: MetricType.Counter
	},
	{
		id: DataspaceControlPlaneMetricIds.AgreementsSwept,
		label: "Agreements removed by the sweep",
		type: MetricType.Counter
	}
];
