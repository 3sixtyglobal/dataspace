// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRouteEntryPoint } from "@3sixty/api-models";
import {
	generateRestRoutesDataspaceDataPlane,
	tagsDataspaceDataPlane
} from "./dataspaceDataPlaneRoutes.js";

/**
 * Entry points for the REST API.
 * Defines REST routes for the Dataspace Data Plane.
 */
export const restEntryPoints: IRestRouteEntryPoint[] = [
	{
		name: "dataspace-data-plane",
		defaultBaseRoute: "dataspace-data-plane",
		tags: tagsDataspaceDataPlane,
		generateRoutes: generateRestRoutesDataspaceDataPlane
	}
];
