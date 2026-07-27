// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GuardError, NotSupportedError } from "@twin.org/core";
import type { IActivityLogEntry } from "@twin.org/dataspace-models";
import { ActivityProcessingStatus } from "@twin.org/dataspace-models";
import { SchemaOrgContexts, SchemaOrgTypes } from "@twin.org/standards-schema-org";
import {
	ActivityStreamsContexts,
	ActivityStreamsTypes
} from "@twin.org/standards-w3c-activity-streams";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
import { HttpMethod } from "@twin.org/web";
import { DataspaceDataPlaneRestClient } from "../src/dataspaceDataPlaneRestClient.js";
import {
	jsonResponse,
	setupFetchMock,
	teardownFetchMock
} from "./helpers/restClientTestHelpers.js";

// OpenAPI spec: ../../dataspace-data-plane-service/docs/open-api/spec.json
const ENDPOINT = "http://localhost:8080";
const PREFIX = "dataspace-data-plane";

const TEST_CONSUMER_PID = "urn:uuid:consumer-process-01";
const TEST_TRUST_PAYLOAD = "bearer-token-xyz";
const TEST_LOG_ENTRY_ID = "urn:uuid:log-entry-01";

const TEST_ITEM_LIST = {
	"@context": SchemaOrgContexts.Context,
	type: SchemaOrgTypes.ItemList,
	[SchemaOrgTypes.ItemListElement]: [{ "@id": "urn:entity:1", type: "SomeType" }]
};

const TEST_ACTIVITY: IActivityStreamsActivity = {
	"@context": ActivityStreamsContexts.Context,
	type: ActivityStreamsTypes.Create,
	actor: "urn:uuid:actor-01",
	object: "urn:uuid:object-01"
};

const TEST_LOG_ENTRY: IActivityLogEntry = {
	id: TEST_LOG_ENTRY_ID,
	generator: "urn:uuid:generator-01",
	dateCreated: "2026-01-01T00:00:00.000Z",
	dateModified: "2026-01-01T00:00:00.000Z",
	status: ActivityProcessingStatus.Completed
};

const fetchMock = vi.fn();

describe("DataspaceDataPlaneRestClient", () => {
	let client: DataspaceDataPlaneRestClient;

	beforeEach(() => {
		setupFetchMock(fetchMock);
		client = new DataspaceDataPlaneRestClient({ endpoint: ENDPOINT });
	});

	afterEach(() => {
		teardownFetchMock(fetchMock);
	});

	describe("getDataAssetEntities", () => {
		test("throws when entitySet is undefined", async () => {
			await expect(
				client.getDataAssetEntities(
					undefined as never,
					TEST_CONSUMER_PID,
					undefined,
					undefined,
					TEST_TRUST_PAYLOAD
				)
			).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.objectUndefined"
			});
		});

		test("throws when entitySet.entityType is empty", async () => {
			await expect(
				client.getDataAssetEntities(
					{ entityType: "" },
					TEST_CONSUMER_PID,
					undefined,
					undefined,
					TEST_TRUST_PAYLOAD
				)
			).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("throws when consumerPid is empty", async () => {
			await expect(
				client.getDataAssetEntities(
					{ entityType: "SomeType" },
					"",
					undefined,
					undefined,
					TEST_TRUST_PAYLOAD
				)
			).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("throws when trustPayload is empty", async () => {
			await expect(
				client.getDataAssetEntities(
					{ entityType: "SomeType" },
					TEST_CONSUMER_PID,
					undefined,
					undefined,
					""
				)
			).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends GET to /{prefix}/entities", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			await client.getDataAssetEntities(
				{ entityType: "SomeType" },
				TEST_CONSUMER_PID,
				undefined,
				undefined,
				TEST_TRUST_PAYLOAD
			);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toContain(`${ENDPOINT}/${PREFIX}/entities`);
			expect(options.method).toBe(HttpMethod.GET);
		});

		test("includes type as a query parameter", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			await client.getDataAssetEntities(
				{ entityType: "SomeType" },
				TEST_CONSUMER_PID,
				undefined,
				undefined,
				TEST_TRUST_PAYLOAD
			);

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("type=SomeType");
		});

		test("includes consumerPid as a query parameter", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			await client.getDataAssetEntities(
				{ entityType: "SomeType" },
				TEST_CONSUMER_PID,
				undefined,
				undefined,
				TEST_TRUST_PAYLOAD
			);

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain(`consumerPid=${encodeURIComponent(TEST_CONSUMER_PID)}`);
		});

		test("includes cursor as a query parameter when provided", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			await client.getDataAssetEntities(
				{ entityType: "SomeType" },
				TEST_CONSUMER_PID,
				"page2",
				undefined,
				TEST_TRUST_PAYLOAD
			);

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("cursor=page2");
		});

		test("includes limit as a query parameter when provided", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			await client.getDataAssetEntities(
				{ entityType: "SomeType" },
				TEST_CONSUMER_PID,
				undefined,
				10,
				TEST_TRUST_PAYLOAD
			);

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("limit=10");
		});

		test("includes entityId as a query parameter when provided", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			await client.getDataAssetEntities(
				{ entityType: "SomeType", entityId: ["urn:entity:1", "urn:entity:2"] },
				TEST_CONSUMER_PID,
				undefined,
				undefined,
				TEST_TRUST_PAYLOAD
			);

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("id=");
		});

		test("returns the item list from response body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			const result = await client.getDataAssetEntities(
				{ entityType: "SomeType" },
				TEST_CONSUMER_PID,
				undefined,
				undefined,
				TEST_TRUST_PAYLOAD
			);

			expect(result.itemList).toEqual(TEST_ITEM_LIST);
		});

		test("returns undefined cursor when no Link header is present", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			const result = await client.getDataAssetEntities(
				{ entityType: "SomeType" },
				TEST_CONSUMER_PID,
				undefined,
				undefined,
				TEST_TRUST_PAYLOAD
			);

			expect(result.cursor).toBeUndefined();
		});

		test("extracts cursor from the Link next relation header", async () => {
			const responseWithLink = {
				ok: true,
				status: 200,
				headers: new Headers({
					"content-type": "application/json",
					link: `<${ENDPOINT}/${PREFIX}/entities?cursor=page2>; rel="next"`
				}),
				json: async () => TEST_ITEM_LIST
			};
			fetchMock.mockResolvedValueOnce(responseWithLink);

			const result = await client.getDataAssetEntities(
				{ entityType: "SomeType" },
				TEST_CONSUMER_PID,
				undefined,
				undefined,
				TEST_TRUST_PAYLOAD
			);

			expect(result.cursor).toBe("page2");
		});
	});

	describe("queryDataAsset", () => {
		test("throws when consumerPid is empty", async () => {
			await expect(
				client.queryDataAsset("", { type: "sparql" }, undefined, undefined, TEST_TRUST_PAYLOAD)
			).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("throws when query is undefined", async () => {
			await expect(
				client.queryDataAsset(
					TEST_CONSUMER_PID,
					undefined as never,
					undefined,
					undefined,
					TEST_TRUST_PAYLOAD
				)
			).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.objectUndefined"
			});
		});

		test("throws when trustPayload is empty", async () => {
			await expect(
				client.queryDataAsset(TEST_CONSUMER_PID, { type: "sparql" }, undefined, undefined, "")
			).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends POST to /{prefix}/entities/query", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			await client.queryDataAsset(
				TEST_CONSUMER_PID,
				{ type: "sparql" },
				undefined,
				undefined,
				TEST_TRUST_PAYLOAD
			);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toContain(`${ENDPOINT}/${PREFIX}/entities/query`);
			expect(options.method).toBe(HttpMethod.POST);
		});

		test("sends consumerPid and query in the request body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			await client.queryDataAsset(
				TEST_CONSUMER_PID,
				{ type: "sparql", q: "SELECT * WHERE { ?s ?p ?o }" },
				undefined,
				undefined,
				TEST_TRUST_PAYLOAD
			);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.consumerPid).toBe(TEST_CONSUMER_PID);
			expect(body.query.type).toBe("sparql");
		});

		test("includes cursor as a query parameter when provided", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			await client.queryDataAsset(
				TEST_CONSUMER_PID,
				{ type: "sparql" },
				"page3",
				undefined,
				TEST_TRUST_PAYLOAD
			);

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("cursor=page3");
		});

		test("includes limit as a query parameter when provided", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			await client.queryDataAsset(
				TEST_CONSUMER_PID,
				{ type: "sparql" },
				undefined,
				20,
				TEST_TRUST_PAYLOAD
			);

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("limit=20");
		});

		test("returns the item list from the response body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			const result = await client.queryDataAsset(
				TEST_CONSUMER_PID,
				{ type: "sparql" },
				undefined,
				undefined,
				TEST_TRUST_PAYLOAD
			);

			expect(result.itemList).toEqual(TEST_ITEM_LIST);
		});

		test("returns undefined cursor when no Link header is present", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_ITEM_LIST));

			const result = await client.queryDataAsset(
				TEST_CONSUMER_PID,
				{ type: "sparql" },
				undefined,
				undefined,
				TEST_TRUST_PAYLOAD
			);

			expect(result.cursor).toBeUndefined();
		});

		test("extracts cursor from the Link next relation header", async () => {
			const responseWithLink = {
				ok: true,
				status: 200,
				headers: new Headers({
					"content-type": "application/json",
					link: `<${ENDPOINT}/${PREFIX}/entities/query?cursor=page4>; rel="next"`
				}),
				json: async () => TEST_ITEM_LIST
			};
			fetchMock.mockResolvedValueOnce(responseWithLink);

			const result = await client.queryDataAsset(
				TEST_CONSUMER_PID,
				{ type: "sparql" },
				undefined,
				undefined,
				TEST_TRUST_PAYLOAD
			);

			expect(result.cursor).toBe("page4");
		});
	});

	describe("notifyActivity", () => {
		test("throws when activity is undefined", async () => {
			await expect(
				client.notifyActivity(undefined as never, TEST_TRUST_PAYLOAD)
			).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.objectUndefined"
			});
		});

		test("throws when trustPayload is empty", async () => {
			await expect(client.notifyActivity(TEST_ACTIVITY, "")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends POST to /{prefix}/inbox", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 201,
				headers: new Headers({
					"content-type": "application/json",
					location: `${ENDPOINT}/${PREFIX}/activity-logs/${TEST_LOG_ENTRY_ID}`
				}),
				json: async () => undefined
			});

			await client.notifyActivity(TEST_ACTIVITY, TEST_TRUST_PAYLOAD);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/inbox`);
			expect(options.method).toBe(HttpMethod.POST);
		});

		test("sends the activity as the request body", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 201,
				headers: new Headers({
					"content-type": "application/json",
					location: `${ENDPOINT}/${PREFIX}/activity-logs/${TEST_LOG_ENTRY_ID}`
				}),
				json: async () => undefined
			});

			await client.notifyActivity(TEST_ACTIVITY, TEST_TRUST_PAYLOAD);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body["@context"]).toBe(ActivityStreamsContexts.Context);
			expect(body.type).toBe(ActivityStreamsTypes.Create);
		});

		test("returns the log entry id extracted from the Location header", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 201,
				headers: new Headers({
					"content-type": "application/json",
					location: `${ENDPOINT}/${PREFIX}/activity-logs/${TEST_LOG_ENTRY_ID}`
				}),
				json: async () => undefined
			});

			const result = await client.notifyActivity(TEST_ACTIVITY, TEST_TRUST_PAYLOAD);

			expect(result).toBe(TEST_LOG_ENTRY_ID);
		});

		test("returns the log entry from the response body when present", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 201,
				headers: new Headers({
					"content-type": "application/json",
					location: `${ENDPOINT}/${PREFIX}/activity-logs/${TEST_LOG_ENTRY_ID}`
				}),
				json: async () => TEST_LOG_ENTRY
			});

			const result = await client.notifyActivity(TEST_ACTIVITY, TEST_TRUST_PAYLOAD);

			expect(result).toEqual(TEST_LOG_ENTRY);
		});
	});

	describe("getActivityLogEntry", () => {
		test("throws when logEntryId is empty", async () => {
			await expect(client.getActivityLogEntry("", TEST_TRUST_PAYLOAD)).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("throws when trustPayload is empty", async () => {
			await expect(client.getActivityLogEntry(TEST_LOG_ENTRY_ID, "")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends GET to /{prefix}/activity-logs/:id", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_LOG_ENTRY));

			await client.getActivityLogEntry(TEST_LOG_ENTRY_ID, TEST_TRUST_PAYLOAD);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/activity-logs/${TEST_LOG_ENTRY_ID}`);
			expect(options.method).toBe(HttpMethod.GET);
		});

		test("returns the activity log entry from the response body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_LOG_ENTRY));

			const result = await client.getActivityLogEntry(TEST_LOG_ENTRY_ID, TEST_TRUST_PAYLOAD);

			expect(result).toEqual(TEST_LOG_ENTRY);
		});
	});

	describe("subscribeToActivityLog", () => {
		test("throws NotSupportedError", async () => {
			await expect(client.subscribeToActivityLog(vi.fn())).rejects.toBeInstanceOf(
				NotSupportedError
			);
		});
	});

	describe("unSubscribeToActivityLog", () => {
		test("throws NotSupportedError", async () => {
			await expect(client.unSubscribeToActivityLog("sub-id")).rejects.toBeInstanceOf(
				NotSupportedError
			);
		});
	});

	describe("setupPushSubscription", () => {
		test("throws NotSupportedError", async () => {
			await expect(client.setupPushSubscription(TEST_CONSUMER_PID)).rejects.toBeInstanceOf(
				NotSupportedError
			);
		});
	});

	describe("suspendPushSubscription", () => {
		test("throws NotSupportedError", async () => {
			await expect(client.suspendPushSubscription(TEST_CONSUMER_PID)).rejects.toBeInstanceOf(
				NotSupportedError
			);
		});
	});

	describe("resumePushSubscription", () => {
		test("throws NotSupportedError", async () => {
			await expect(client.resumePushSubscription(TEST_CONSUMER_PID)).rejects.toBeInstanceOf(
				NotSupportedError
			);
		});
	});

	describe("teardownPushSubscription", () => {
		test("throws NotSupportedError", async () => {
			await expect(client.teardownPushSubscription(TEST_CONSUMER_PID)).rejects.toBeInstanceOf(
				NotSupportedError
			);
		});
	});

	describe("processOutboxActivity", () => {
		test("throws NotSupportedError", async () => {
			await expect(client.processOutboxActivity(TEST_ACTIVITY)).rejects.toBeInstanceOf(
				NotSupportedError
			);
		});
	});
});
