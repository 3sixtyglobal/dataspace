// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRouteEntryPoint } from "@twin.org/api-models";
import {
	generateRestRoutesDataspaceDataPlane,
	tagsDataspaceDataPlane
} from "./dataspaceDataPlaneRoutes.js";

export const restEntryPoints: IRestRouteEntryPoint[] = [
	{
		name: "dataspace-data-plane",
		defaultBaseRoute: "dataspace-data-plane",
		tags: tagsDataspaceDataPlane,
		generateRoutes: generateRestRoutesDataspaceDataPlane
	}
];
