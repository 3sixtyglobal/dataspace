// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { describe, expect, test } from "vitest";
import { generateRestRoutesDataspaceDataPlane } from "../src/dataspaceDataPlaneRoutes.js";

const BASE_ROUTE = "/api/dataspace-data-plane";
const COMPONENT_NAME = "dataspace-data-plane";

describe("generateRestRoutesDataspaceDataPlane", () => {
	test("returns the expected set of routes", () => {
		const routes = generateRestRoutesDataspaceDataPlane(BASE_ROUTE, COMPONENT_NAME);

		expect(routes).toHaveLength(4);
		const operationIds = routes.map(r => r.operationId);
		expect(operationIds).toContain("activityStreamNotify");
		expect(operationIds).toContain("dataspaceDataPlaneGetActivityLogEntry");
		expect(operationIds).toContain("dataspaceDataPlaneGetDataAssetEntities");
		expect(operationIds).toContain("dataspaceDataPlaneQueryDataAsset");
	});

	test("every route with skipAuth also has skipTenant set to true", () => {
		const routes = generateRestRoutesDataspaceDataPlane(BASE_ROUTE, COMPONENT_NAME);

		const skipAuthRoutes = routes.filter(r => r.skipAuth === true);
		expect(skipAuthRoutes.length).toBeGreaterThan(0);

		for (const route of skipAuthRoutes) {
			expect(
				route.skipTenant,
				`${route.operationId} has skipAuth but is missing skipTenant: true`
			).toBe(true);
		}
	});

	test("internal activity routes do not set skipAuth or skipTenant", () => {
		const routes = generateRestRoutesDataspaceDataPlane(BASE_ROUTE, COMPONENT_NAME);

		const internalOperationIds = ["activityStreamNotify", "dataspaceDataPlaneGetActivityLogEntry"];

		for (const operationId of internalOperationIds) {
			const route = routes.find(r => r.operationId === operationId);
			expect(route, `route ${operationId} not found`).toBeDefined();
			expect(route?.skipAuth).toBeFalsy();
			expect(route?.skipTenant).toBeFalsy();
		}
	});
});
