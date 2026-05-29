// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IHttpRequestContext } from "@twin.org/api-models";
import { ComponentFactory } from "@twin.org/core";
import {
	ActivityProcessingStatus,
	ActivityTaskStatus,
	type IActivityLogEntry,
	type IActivityStreamNotifyRequest,
	type IDataspaceDataPlaneComponent
} from "@twin.org/dataspace-models";
import { HeaderTypes, HttpStatusCode } from "@twin.org/web";
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

		// /inbox (activityStreamNotify) is intentionally public (skipAuth/skipTenant) to allow
		// cross-node push deliveries. Only the activity-log route is internal here.
		const internalOperationIds = ["dataspaceDataPlaneGetActivityLogEntry"];

		for (const operationId of internalOperationIds) {
			const route = routes.find(r => r.operationId === operationId);
			expect(route, `route ${operationId} not found`).toBeDefined();
			expect(route?.skipAuth).toBeFalsy();
			expect(route?.skipTenant).toBeFalsy();
		}
	});

	test("activityStreamNotify returns 202 with location when processing is queued", async () => {
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

		expect(response.statusCode).toBe(HttpStatusCode.accepted);
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

	test("activityStreamNotify returns 422 when inline processing fails with a semantic error", async () => {
		// Service wraps ValidationError/GuardError as UnprocessableError before storing
		const errorLogEntry: IActivityLogEntry = {
			id: "urn:x-activity-log:inline-semantic-error",
			dateCreated: "2025-08-12T12:00:00Z",
			dateModified: "2025-08-12T12:00:00Z",
			generator: "did:iota:testnet:0x123456",
			status: ActivityProcessingStatus.Error,
			tasks: [
				{
					taskId: "task-1",
					dataspaceAppId: "https://my-app.example.org/app1",
					status: ActivityTaskStatus.Failed,
					error: { name: "UnprocessableError", message: "activity semantic error" }
				}
			]
		};

		const mockComponent: Pick<IDataspaceDataPlaneComponent, "notifyActivity"> & {
			className(): string;
		} = {
			className: () => "MockDataspaceDataPlane",
			notifyActivity: vi.fn().mockResolvedValue(errorLogEntry)
		};

		vi.spyOn(ComponentFactory, "get").mockReturnValue(mockComponent);

		const response = await activityStreamNotify(
			BASE_ROUTE,
			{} as IHttpRequestContext,
			COMPONENT_NAME,
			ACTIVITY_NOTIFY_REQUEST
		);

		expect(response.statusCode).toBe(HttpStatusCode.unprocessableEntity);
		expect(response.headers?.location).toBe(`${BASE_ROUTE}/activity-logs/${errorLogEntry.id}`);
		expect(response.body).toEqual({
			...errorLogEntry,
			error: { name: "UnprocessableError", message: "activity semantic error" }
		});
	});

	test("activityStreamNotify returns 500 when inline processing fails with a server error", async () => {
		const errorLogEntry: IActivityLogEntry = {
			id: "urn:x-activity-log:inline-server-error",
			dateCreated: "2025-08-12T12:00:00Z",
			dateModified: "2025-08-12T12:00:00Z",
			generator: "did:iota:testnet:0x123456",
			status: ActivityProcessingStatus.Error,
			tasks: [
				{
					taskId: "task-1",
					dataspaceAppId: "https://my-app.example.org/app1",
					status: ActivityTaskStatus.Failed,
					error: { name: "GeneralError", message: "unexpected server failure" }
				}
			]
		};

		const mockComponent: Pick<IDataspaceDataPlaneComponent, "notifyActivity"> & {
			className(): string;
		} = {
			className: () => "MockDataspaceDataPlane",
			notifyActivity: vi.fn().mockResolvedValue(errorLogEntry)
		};

		vi.spyOn(ComponentFactory, "get").mockReturnValue(mockComponent);

		const response = await activityStreamNotify(
			BASE_ROUTE,
			{} as IHttpRequestContext,
			COMPONENT_NAME,
			ACTIVITY_NOTIFY_REQUEST
		);

		expect(response.statusCode).toBe(HttpStatusCode.internalServerError);
		expect(response.headers?.location).toBe(`${BASE_ROUTE}/activity-logs/${errorLogEntry.id}`);
		expect(response.body).toEqual({
			...errorLogEntry,
			error: { name: "GeneralError", message: "unexpected server failure" }
		});
	});

	test("activityStreamNotify returns 500 with no error field when tasks is undefined", async () => {
		const errorLogEntry: IActivityLogEntry = {
			id: "urn:x-activity-log:no-tasks",
			dateCreated: "2025-08-12T12:00:00Z",
			dateModified: "2025-08-12T12:00:00Z",
			generator: "did:iota:testnet:0x123456",
			status: ActivityProcessingStatus.Error
		};

		const mockComponent: Pick<IDataspaceDataPlaneComponent, "notifyActivity"> & {
			className(): string;
		} = {
			className: () => "MockDataspaceDataPlane",
			notifyActivity: vi.fn().mockResolvedValue(errorLogEntry)
		};

		vi.spyOn(ComponentFactory, "get").mockReturnValue(mockComponent);

		const response = await activityStreamNotify(
			BASE_ROUTE,
			{} as IHttpRequestContext,
			COMPONENT_NAME,
			ACTIVITY_NOTIFY_REQUEST
		);

		expect(response.statusCode).toBe(HttpStatusCode.internalServerError);
		expect(response.body).toEqual({ ...errorLogEntry, error: undefined });
	});

	test("activityStreamNotify returns 500 with no error field when tasks is empty", async () => {
		const errorLogEntry: IActivityLogEntry = {
			id: "urn:x-activity-log:empty-tasks",
			dateCreated: "2025-08-12T12:00:00Z",
			dateModified: "2025-08-12T12:00:00Z",
			generator: "did:iota:testnet:0x123456",
			status: ActivityProcessingStatus.Error,
			tasks: []
		};

		const mockComponent: Pick<IDataspaceDataPlaneComponent, "notifyActivity"> & {
			className(): string;
		} = {
			className: () => "MockDataspaceDataPlane",
			notifyActivity: vi.fn().mockResolvedValue(errorLogEntry)
		};

		vi.spyOn(ComponentFactory, "get").mockReturnValue(mockComponent);

		const response = await activityStreamNotify(
			BASE_ROUTE,
			{} as IHttpRequestContext,
			COMPONENT_NAME,
			ACTIVITY_NOTIFY_REQUEST
		);

		expect(response.statusCode).toBe(HttpStatusCode.internalServerError);
		expect(response.body).toEqual({ ...errorLogEntry, error: undefined });
	});

	test("activityStreamNotify returns 422 when semantic error exists even if server error comes first", async () => {
		const errorLogEntry: IActivityLogEntry = {
			id: "urn:x-activity-log:mixed-tasks-reversed",
			dateCreated: "2025-08-12T12:00:00Z",
			dateModified: "2025-08-12T12:00:00Z",
			generator: "did:iota:testnet:0x123456",
			status: ActivityProcessingStatus.Error,
			tasks: [
				{
					taskId: "task-1",
					dataspaceAppId: "https://my-app.example.org/app1",
					status: ActivityTaskStatus.Failed,
					error: { name: "GeneralError", message: "server error" }
				},
				{
					taskId: "task-2",
					dataspaceAppId: "https://my-app.example.org/app2",
					status: ActivityTaskStatus.Failed,
					error: { name: "UnprocessableError", message: "semantic error" }
				}
			]
		};

		const mockComponent: Pick<IDataspaceDataPlaneComponent, "notifyActivity"> & {
			className(): string;
		} = {
			className: () => "MockDataspaceDataPlane",
			notifyActivity: vi.fn().mockResolvedValue(errorLogEntry)
		};

		vi.spyOn(ComponentFactory, "get").mockReturnValue(mockComponent);

		const response = await activityStreamNotify(
			BASE_ROUTE,
			{} as IHttpRequestContext,
			COMPONENT_NAME,
			ACTIVITY_NOTIFY_REQUEST
		);

		expect(response.statusCode).toBe(HttpStatusCode.unprocessableEntity);
	});

	test("activityStreamNotify returns 422 when first failed task is semantic even if others are server errors", async () => {
		const errorLogEntry: IActivityLogEntry = {
			id: "urn:x-activity-log:mixed-tasks",
			dateCreated: "2025-08-12T12:00:00Z",
			dateModified: "2025-08-12T12:00:00Z",
			generator: "did:iota:testnet:0x123456",
			status: ActivityProcessingStatus.Error,
			tasks: [
				{
					taskId: "task-1",
					dataspaceAppId: "https://my-app.example.org/app1",
					status: ActivityTaskStatus.Failed,
					error: { name: "UnprocessableError", message: "semantic error" }
				},
				{
					taskId: "task-2",
					dataspaceAppId: "https://my-app.example.org/app2",
					status: ActivityTaskStatus.Failed,
					error: { name: "GeneralError", message: "server error" }
				}
			]
		};

		const mockComponent: Pick<IDataspaceDataPlaneComponent, "notifyActivity"> & {
			className(): string;
		} = {
			className: () => "MockDataspaceDataPlane",
			notifyActivity: vi.fn().mockResolvedValue(errorLogEntry)
		};

		vi.spyOn(ComponentFactory, "get").mockReturnValue(mockComponent);

		const response = await activityStreamNotify(
			BASE_ROUTE,
			{} as IHttpRequestContext,
			COMPONENT_NAME,
			ACTIVITY_NOTIFY_REQUEST
		);

		expect(response.statusCode).toBe(HttpStatusCode.unprocessableEntity);
	});

	test("activityStreamNotify returns 422 when semantic error is nested in cause chain", async () => {
		const errorLogEntry: IActivityLogEntry = {
			id: "urn:x-activity-log:nested-cause",
			dateCreated: "2025-08-12T12:00:00Z",
			dateModified: "2025-08-12T12:00:00Z",
			generator: "did:iota:testnet:0x123456",
			status: ActivityProcessingStatus.Error,
			tasks: [
				{
					taskId: "task-1",
					dataspaceAppId: "https://my-app.example.org/app1",
					status: ActivityTaskStatus.Failed,
					error: {
						name: "GeneralError",
						message: "outer error",
						cause: { name: "UnprocessableError", message: "root semantic cause" }
					}
				}
			]
		};

		const mockComponent: Pick<IDataspaceDataPlaneComponent, "notifyActivity"> & {
			className(): string;
		} = {
			className: () => "MockDataspaceDataPlane",
			notifyActivity: vi.fn().mockResolvedValue(errorLogEntry)
		};

		vi.spyOn(ComponentFactory, "get").mockReturnValue(mockComponent);

		const response = await activityStreamNotify(
			BASE_ROUTE,
			{} as IHttpRequestContext,
			COMPONENT_NAME,
			ACTIVITY_NOTIFY_REQUEST
		);

		expect(response.statusCode).toBe(HttpStatusCode.unprocessableEntity);
	});

	test("activityStreamNotify passes Bearer token as trustPayload to notifyActivity", async () => {
		const notifyFn = vi.fn().mockResolvedValue("urn:x-activity-log:bearer-1");
		const mockComponent: Pick<IDataspaceDataPlaneComponent, "notifyActivity"> & {
			className(): string;
		} = {
			className: () => "MockDataspaceDataPlane",
			notifyActivity: notifyFn
		};
		vi.spyOn(ComponentFactory, "get").mockReturnValue(mockComponent);

		const requestWithAuth: IActivityStreamNotifyRequest = {
			headers: { [HeaderTypes.Authorization]: "Bearer my-test-jwt" },
			body: ACTIVITY_NOTIFY_REQUEST.body
		};

		await activityStreamNotify(
			BASE_ROUTE,
			{} as IHttpRequestContext,
			COMPONENT_NAME,
			requestWithAuth
		);

		expect(notifyFn).toHaveBeenCalledWith(requestWithAuth.body, "my-test-jwt");
	});

	test("activityStreamNotify passes undefined trustPayload when no Authorization header", async () => {
		const notifyFn = vi.fn().mockResolvedValue("urn:x-activity-log:no-auth-1");
		const mockComponent: Pick<IDataspaceDataPlaneComponent, "notifyActivity"> & {
			className(): string;
		} = {
			className: () => "MockDataspaceDataPlane",
			notifyActivity: notifyFn
		};
		vi.spyOn(ComponentFactory, "get").mockReturnValue(mockComponent);

		await activityStreamNotify(
			BASE_ROUTE,
			{} as IHttpRequestContext,
			COMPONENT_NAME,
			ACTIVITY_NOTIFY_REQUEST
		);

		expect(notifyFn).toHaveBeenCalledWith(ACTIVITY_NOTIFY_REQUEST.body, undefined);
	});
});
