// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ISocketRouteEntryPoint } from "@3sixty/api-models";
import { tagsDataspaceDataPlane } from "./dataspaceDataPlaneRoutes.js";
import { generateSocketRoutesDataspaceDataPlane } from "./dataspaceDataPlaneSocketRoutes.js";

/**
 * Entry points for the WebSocket API.
 * Defines socket routes for the Dataspace Data Plane activity log subscription.
 */
export const socketEntryPoints: ISocketRouteEntryPoint[] = [
	{
		name: "dataspace-data-plane",
		defaultBaseRoute: "dataspace-data-plane",
		tags: tagsDataspaceDataPlane,
		generateRoutes: generateSocketRoutesDataspaceDataPlane
	}
];
