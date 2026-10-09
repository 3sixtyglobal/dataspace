// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	HttpContextIdKeys,
	HttpHeaderHelper,
	HttpParameterHelper,
	HttpUrlHelper,
	type IHttpRequestContext,
	type IRestRoute,
	type ITag
} from "@3sixty/api-models";
import { ContextIdStore } from "@3sixty/context";
import { BaseError, Coerce, ComponentFactory, Guards, Is, UnprocessableError } from "@3sixty/core";
import {
	ActivityProcessingStatus,
	ActivityTaskStatus,
	type IActivityLogEntry,
	type IActivityLogEntryGetRequest,
	type IActivityLogEntryGetResponse,
	type IActivityStreamNotifyRequest,
	type IActivityStreamNotifyResponse,
	type IDataAssetEntitiesResponse,
	type IDataAssetGetEntitiesRequest,
	type IDataAssetItemList,
	type IDataAssetQueryRequest,
	type IDataspaceDataPlaneComponent
} from "@3sixty/dataspace-models";
import { nameof } from "@3sixty/nameof";
import type { IActivityStreamsActivity } from "@3sixty/standards-w3c-activity-streams";
import {
	HeaderHelper,
	HeaderTypes,
	HttpStatusCode,
	type IHttpHeaders,
	MimeTypes
} from "@3sixty/web";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "dataspaceDataPlaneRoutes";

/**
 * The tag to associate with the routes.
 */
export const tagsDataspaceDataPlane: ITag[] = [
	{
		name: "Dataspace Data Plane",
		description: "Endpoints to access a Dataspace Data Plane."
	}
];

const activityExample: IActivityStreamsActivity = {
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
};

const activityLogEntryExample: IActivityLogEntry = {
	id: "urn:x-activity-log:134567",
	dateCreated: "2025-08-12T12:00:00Z",
	dateModified: "2025-08-12T12:00:00Z",
	generator: "did:iota:testnet:123456",
	status: "pending",
	tasks: [
		{
			taskId: "urn:x-task-id:45678",
			dataspaceAppId: "https://my-app.example.org/app1",
			status: "pending"
		}
	]
};

const dataspaceDataPlaneQueryResultExample: IDataAssetItemList = {
	"@context": "https://schema.org",
	type: "ItemList",
	itemListElement: [
		{
			"@context": "https://vocabulary.uncefact.org/unece-context-D23B.jsonld",
			type: "Consignment",
			id: "urn:ucr:PL527288386100000"
		}
	]
};

/**
 * The REST routes for Dataspace Data Plane.
 * @param baseRouteName Prefix to prepend to the paths.
 * @param factoryServiceName The name of the service to use in the routes store in the ServiceFactory.
 * @returns The generated routes.
 */
export function generateRestRoutesDataspaceDataPlane(
	baseRouteName: string,
	factoryServiceName: string
): IRestRoute[] {
	const notifyActivityStreamRoute: IRestRoute<
		IActivityStreamNotifyRequest,
		IActivityStreamNotifyResponse
	> = {
		operationId: "activityStreamNotify",
		summary: "Notify of a new Activity",
		tag: tagsDataspaceDataPlane[0].name,
		method: "POST",
		path: `${baseRouteName}/inbox`,
		handler: async (httpRequestContext, request) =>
			activityStreamNotify(baseRouteName, httpRequestContext, factoryServiceName, request),
		requestType: {
			mimeType: MimeTypes.JsonLd,
			type: nameof<IActivityStreamNotifyRequest>(),
			examples: [
				{
					id: "activityStreamNotifyRequestExample",
					request: {
						body: activityExample
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IActivityStreamNotifyResponse>()
			}
		],
		// Cross-node push deliveries authenticate via JWT-VC verified inside notifyActivity.
		// Skip framework auth so external providers can POST without a session token.
		// Tenant context is required and comes from the URL-baked encrypted tenant token
		// (decoded by TenantProcessor before the handler runs).
		skipAuth: true
	};

	const getActivityLogEntryRoute: IRestRoute<
		IActivityLogEntryGetRequest,
		IActivityLogEntryGetResponse
	> = {
		operationId: "dataspaceDataPlaneGetActivityLogEntry",
		summary: "Get a Activity Log Entry",
		tag: tagsDataspaceDataPlane[0].name,
		method: "GET",
		path: `${baseRouteName}/activity-logs/:id`,
		handler: async (httpRequestContext, request) =>
			activityLogEntryGet(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<IActivityLogEntryGetRequest>(),
			examples: [
				{
					id: "activityLogEntryGetRequestExample",
					request: {
						pathParams: {
							id: "urn:x-activity-log:1234567"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IActivityLogEntryGetResponse>(),
				examples: [
					{
						id: "activityLogEntryGetResponseExample",
						response: {
							body: { ...activityLogEntryExample }
						}
					}
				]
			}
		],
		skipAuth: true
	};

	const getDataAssetEntitiesRoute: IRestRoute<
		IDataAssetGetEntitiesRequest,
		IDataAssetEntitiesResponse
	> = {
		operationId: "dataspaceDataPlaneGetDataAssetEntities",
		summary: "Get Data Asset Entities",
		tag: tagsDataspaceDataPlane[0].name,
		method: "GET",
		path: `${baseRouteName}/entities`,
		handler: async (httpRequestContext, request) =>
			getDataAssetEntities(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<IDataAssetGetEntitiesRequest>(),
			examples: [
				{
					id: "dataAssetEntitiesGetRequestExample",
					request: {
						query: {
							consumerPid: "urn:uuid:consumer-pid-12345",
							id: "urn:ucr:24PLP051219453I002610799053311",
							type: "https://vocabulary.uncefact.org/Consignment"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IDataAssetEntitiesResponse>(),
				examples: [
					{
						id: "dataAssetEntitiesGetResponseExample",
						response: {
							body: { ...dataspaceDataPlaneQueryResultExample }
						}
					}
				]
			}
		],
		skipAuth: true
	};

	const queryDataAssetRoute: IRestRoute<IDataAssetQueryRequest, IDataAssetEntitiesResponse> = {
		operationId: "dataspaceDataPlaneQueryDataAsset",
		summary: "Query Data Asset",
		tag: tagsDataspaceDataPlane[0].name,
		method: "POST",
		path: `${baseRouteName}/entities/query`,
		handler: async (httpRequestContext, request) =>
			queryDataAsset(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<IDataAssetQueryRequest>(),
			examples: [
				{
					id: "dataAssetQueryRequestExample",
					request: {
						body: {
							consumerPid: "urn:uuid:consumer-pid-12345",
							query: {
								type: "Example",
								q: "example query"
							}
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IDataAssetEntitiesResponse>(),
				examples: [
					{
						id: "dataAssetQueryResponseExample",
						response: {
							body: { ...dataspaceDataPlaneQueryResultExample }
						}
					}
				]
			}
		],
		skipAuth: true
	};

	return [
		notifyActivityStreamRoute,
		getActivityLogEntryRoute,
		getDataAssetEntitiesRoute,
		queryDataAssetRoute
	];
}

/**
 * Notify a new Activity to the Dataspace Data Plane Activity Stream.
 * @param baseRouteName The base route name.
 * @param httpRequestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function activityStreamNotify(
	baseRouteName: string,
	httpRequestContext: IHttpRequestContext,
	factoryServiceName: string,
	request: IActivityStreamNotifyRequest
): Promise<IActivityStreamNotifyResponse> {
	Guards.object<IActivityStreamNotifyRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IActivityStreamNotifyRequest["body"]>(
		ROUTES_SOURCE,
		nameof(request.body),
		request.body
	);

	const component = ComponentFactory.get<IDataspaceDataPlaneComponent>(factoryServiceName);

	const trustPayload = HeaderHelper.extractBearer(request.headers?.[HeaderTypes.Authorization]);
	const result = await component.notifyActivity(request.body, trustPayload);

	if (Is.string(result)) {
		const contextIds = await ContextIdStore.getContextIds();
		const publicOrigin = contextIds?.[HttpContextIdKeys.PublicOrigin];

		const headers: IHttpHeaders = {};
		HttpHeaderHelper.buildId(
			headers,
			result,
			HttpUrlHelper.combineOriginPath(publicOrigin, `${baseRouteName}/activity-logs/:id`)
		);

		return {
			headers,
			statusCode: HttpStatusCode.accepted
		};
	}

	let statusCode: HttpStatusCode = HttpStatusCode.created;
	if (result.status === ActivityProcessingStatus.Error) {
		const failedErrors =
			result.tasks?.filter(task => task.status === ActivityTaskStatus.Failed) ?? [];
		const hasUnprocessableError = failedErrors.some(task =>
			BaseError.someErrorName(task.error, UnprocessableError.CLASS_NAME)
		);
		statusCode = hasUnprocessableError
			? HttpStatusCode.unprocessableEntity
			: HttpStatusCode.internalServerError;
	}

	const contextIds = await ContextIdStore.getContextIds();
	const publicOrigin = contextIds?.[HttpContextIdKeys.PublicOrigin];

	const headers: IHttpHeaders = {};
	HttpHeaderHelper.buildId(
		headers,
		result.id,
		HttpUrlHelper.combineOriginPath(publicOrigin, `${baseRouteName}/activity-logs/:id`)
	);

	return {
		headers,
		statusCode,
		body: result
	};
}

/**
 * Get an Activity Log entry.
 * @param httpRequestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function activityLogEntryGet(
	httpRequestContext: IHttpRequestContext,
	factoryServiceName: string,
	request: IActivityLogEntryGetRequest
): Promise<IActivityLogEntryGetResponse> {
	Guards.object<IActivityLogEntryGetRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IActivityLogEntryGetRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);

	const component = ComponentFactory.get<IDataspaceDataPlaneComponent>(factoryServiceName);

	const trustPayload = HeaderHelper.extractBearer(request.headers?.[HeaderTypes.Authorization]);

	return {
		body: await component.getActivityLogEntry(request.pathParams.id, trustPayload)
	};
}

/**
 * Handles a request to obtain the entities of a data asset.
 * @param httpRequestContext The request Context.
 * @param factoryServiceName The factory service name
 * @param request The request.
 * @returns Either the entities as JSON-LD or the corresponding error response.
 */
export async function getDataAssetEntities(
	httpRequestContext: IHttpRequestContext,
	factoryServiceName: string,
	request: IDataAssetGetEntitiesRequest
): Promise<IDataAssetEntitiesResponse> {
	Guards.object<IDataAssetGetEntitiesRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IDataAssetGetEntitiesRequest["query"]>(
		ROUTES_SOURCE,
		nameof(request.query),
		request.query
	);

	const trustPayload = HeaderHelper.extractBearer(request.headers?.[HeaderTypes.Authorization]);

	const component = ComponentFactory.get<IDataspaceDataPlaneComponent>(factoryServiceName);

	const result = await component.getDataAssetEntities(
		{
			entityType: request.query.type,
			entityId: HttpParameterHelper.arrayFromString(request.query.id)
		},
		request.query.consumerPid,
		request.query.cursor,
		Coerce.integer(request.query.limit),
		trustPayload
	);

	const headers: IDataAssetEntitiesResponse["headers"] = {};

	const contextIds = await ContextIdStore.getContextIds();
	HttpHeaderHelper.buildCursor(
		headers,
		httpRequestContext.serverRequest.url,
		contextIds?.[HttpContextIdKeys.PublicOrigin],
		result.cursor
	);

	return {
		headers,
		body: result.itemList
	};
}

/**
 * Handles a request to query a data asset.
 * @param httpRequestContext The request Context.
 * @param factoryServiceName The factory service name
 * @param request The request.
 * @returns Either the entities as JSON-LD or the corresponding error response.
 */
export async function queryDataAsset(
	httpRequestContext: IHttpRequestContext,
	factoryServiceName: string,
	request: IDataAssetQueryRequest
): Promise<IDataAssetEntitiesResponse> {
	Guards.object<IDataAssetQueryRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IDataAssetQueryRequest["body"]>(ROUTES_SOURCE, nameof(request.body), request.body);

	const trustPayload = HeaderHelper.extractBearer(request.headers?.[HeaderTypes.Authorization]);
	const component = ComponentFactory.get<IDataspaceDataPlaneComponent>(factoryServiceName);

	const result = await component.queryDataAsset(
		request.body.consumerPid,
		request.body.query,
		request.query?.cursor,
		Coerce.integer(request.query?.limit),
		trustPayload
	);

	const headers: IDataAssetEntitiesResponse["headers"] = {};

	const contextIds = await ContextIdStore.getContextIds();
	HttpHeaderHelper.buildCursor(
		headers,
		httpRequestContext.serverRequest.url,
		contextIds?.[HttpContextIdKeys.PublicOrigin],
		result.cursor
	);

	return {
		headers,
		body: result.itemList
	};
}
