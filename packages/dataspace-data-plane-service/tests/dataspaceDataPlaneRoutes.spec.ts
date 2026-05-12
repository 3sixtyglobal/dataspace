// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IHttpRequestContext } from "@twin.org/api-models";
import { ComponentFactory } from "@twin.org/core";
import {
	ActivityProcessingStatus,
	type IActivityLogEntry,
	type IActivityStreamNotifyRequest,
	type IDataspaceDataPlaneComponent
} from "@twin.org/dataspace-models";
import { HttpStatusCode } from "@twin.org/web";
import {
	activityStreamNotify,
	generateRestRoutesDataspaceDataPlane
} from "../src/dataspaceDataPlaneRoutes.js";

const BASE_ROUTE = "/api/dataspace-data-plane";
const COMPONENT_NAME = "dataspace-data-plane";

afterEach(() => {
	vi.restoreAllMocks();
});

const ACTIVITY_NOTIFY_REQUEST: IActivityStreamNotifyRequest = {
	body: {
		"@context": "https://www.w3.org/ns/activitystreams",
		type: "Add",
		actor: {
			id: "did:iota:testnet:0x123456"
		},
		object: {
			"@context": "https://vocabulary.uncefact.org",
			"@type": "Consignment",
			globalId: "24KEP051219453I002610796"
		},
		updated: "2025-08-12T12:00:00Z"
	}
};

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

	test("every skipAuth route requires tenant context (skipTenant unset, tenant key required via tenantToken)", () => {
		const routes = generateRestRoutesDataspaceDataPlane(BASE_ROUTE, COMPONENT_NAME);

		const skipAuthRoutes = routes.filter(r => r.skipAuth === true);
		expect(skipAuthRoutes.length).toBeGreaterThan(0);

		for (const route of skipAuthRoutes) {
			expect(
				route.skipTenant ?? false,
				`${route.operationId} should not set skipTenant: true (tenant context required via encrypted tenantToken)`
			).toBe(false);
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

	test("activityStreamNotify returns 102 with location when processing is queued", async () => {
		const mockComponent: Pick<IDataspaceDataPlaneComponent, "notifyActivity"> & {
			className(): string;
		} = {
			className: () => "MockDataspaceDataPlane",
			notifyActivity: vi.fn().mockResolvedValue("urn:x-activity-log:queued-1")
		};

		vi.spyOn(ComponentFactory, "get").mockReturnValue(mockComponent);

		const response = await activityStreamNotify(
			BASE_ROUTE,
			{} as IHttpRequestContext,
			COMPONENT_NAME,
			ACTIVITY_NOTIFY_REQUEST
		);

		expect(response.statusCode).toBe(HttpStatusCode.processing);
		expect(response.headers?.location).toBe(
			`${BASE_ROUTE}/activity-logs/urn:x-activity-log:queued-1`
		);
		expect(response.body).toBeUndefined();
	});

	test("activityStreamNotify returns 201 with location and body when processed inline", async () => {
		const inlineLogEntry: IActivityLogEntry = {
			id: "urn:x-activity-log:inline-1",
			dateCreated: "2025-08-12T12:00:00Z",
			dateModified: "2025-08-12T12:00:00Z",
			generator: "did:iota:testnet:0x123456",
			status: ActivityProcessingStatus.Completed,
			tasks: []
		};

		const mockComponent: Pick<IDataspaceDataPlaneComponent, "notifyActivity"> & {
			className(): string;
		} = {
			className: () => "MockDataspaceDataPlane",
			notifyActivity: vi.fn().mockResolvedValue(inlineLogEntry)
		};

		vi.spyOn(ComponentFactory, "get").mockReturnValue(mockComponent);

		const response = await activityStreamNotify(
			BASE_ROUTE,
			{} as IHttpRequestContext,
			COMPONENT_NAME,
			ACTIVITY_NOTIFY_REQUEST
		);

		expect(response.statusCode).toBe(HttpStatusCode.created);
		expect(response.headers?.location).toBe(`${BASE_ROUTE}/activity-logs/${inlineLogEntry.id}`);
		expect(response.body).toEqual(inlineLogEntry);
	});
});
