// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRouteEntryPoint } from "@twin.org/api-models";
import {
	generateRestRoutesDataspaceControlPlane,
	tagsDataspaceControlPlane
} from "./dataspaceControlPlaneRoutes.js";

/**
 * Entry points for the REST API.
 * Defines REST routes for DSP Transfer Process and Contract Negotiation Protocol.
 */
export const restEntryPoints: IRestRouteEntryPoint[] = [
	{
		name: "dataspace-control-plane",
		defaultBaseRoute: "dataspace-control-plane",
		tags: tagsDataspaceControlPlane,
		generateRoutes: generateRestRoutesDataspaceControlPlane
	}
];
