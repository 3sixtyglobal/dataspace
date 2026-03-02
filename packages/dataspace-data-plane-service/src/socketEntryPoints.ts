// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ISocketRouteEntryPoint } from "@twin.org/api-models";
import { tagsDataspaceDataPlane } from "./dataspaceDataPlaneRoutes.js";
import { generateSocketRoutesDataspaceDataPlane } from "./dataspaceDataPlaneSocketRoutes.js";

export const socketEntryPoints: ISocketRouteEntryPoint[] = [
	{
		name: "dataspace-data-plane",
		defaultBaseRoute: "dataspace-data-plane",
		tags: tagsDataspaceDataPlane,
		generateRoutes: generateSocketRoutesDataspaceDataPlane
	}
];
