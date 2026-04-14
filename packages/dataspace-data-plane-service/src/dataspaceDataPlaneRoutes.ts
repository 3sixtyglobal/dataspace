// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	HttpParameterHelper,
	type IHostingComponent,
	type IHttpRequestContext,
	type IRestRoute,
	type ITag,
	type IUnprocessableEntityResponse
} from "@twin.org/api-models";
import { Coerce, ComponentFactory, Guards, Is } from "@twin.org/core";
import type {
	IActivityLogEntry,
	IActivityLogEntryGetRequest,
	IActivityLogEntryGetResponse,
	IActivityStreamNotifyRequest,
	IActivityStreamNotifyResponse,
	IDataAssetEntitiesResponse,
	IDataAssetGetEntitiesRequest,
	IDataAssetItemList,
	IDataAssetQueryRequest,
	IDataspaceDataPlaneComponent,
	IFilteringQuery
} from "@twin.org/dataspace-models";
import { nameof } from "@twin.org/nameof";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
import { HeaderHelper, HeaderTypes, HttpStatusCode, MimeTypes } from "@twin.org/web";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "dataspaceDataPlaneRoutes";

/**
 * Activity stream route.
 */
const ACTIVITY_STREAM_ROUTE = "notify";

/**
 * Activity processing details route.
 */
export const ACTIVITY_LOG_ROUTE = "activity-logs";

/**
 * Route of the query interface.
 */
const QUERY_INTERFACE_ROUTE = "entities";

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
		path: `${baseRouteName}/${ACTIVITY_STREAM_ROUTE}`,
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
			},
			{ type: nameof<IUnprocessableEntityResponse>() }
		]
	};

	const getActivityLogEntryRoute: IRestRoute<
		IActivityLogEntryGetRequest,
		IActivityLogEntryGetResponse
	> = {
		operationId: "dataspaceDataPlaneGetActivityLogEntry",
		summary: "Get a Activity Log Entry",
		tag: tagsDataspaceDataPlane[0].name,
		method: "GET",
		path: `${baseRouteName}/${ACTIVITY_LOG_ROUTE}/:id`,
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
		]
	};

	const getDataAssetEntitiesRoute: IRestRoute<
		IDataAssetGetEntitiesRequest,
		IDataAssetEntitiesResponse
	> = {
		operationId: "dataspaceDataPlaneGetDataAssetEntities",
		summary: "Get Data Asset Entities",
		tag: tagsDataspaceDataPlane[0].name,
		method: "GET",
		path: `${baseRouteName}/${QUERY_INTERFACE_ROUTE}`,
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
		skipAuth: true,
		skipTenant: true
	};

	const queryDataAssetRoute: IRestRoute<IDataAssetQueryRequest, IDataAssetEntitiesResponse> = {
		operationId: "dataspaceDataPlaneQueryDataAsset",
		summary: "Query Data Asset",
		tag: tagsDataspaceDataPlane[0].name,
		method: "POST",
		path: `${baseRouteName}/${QUERY_INTERFACE_ROUTE}/query`,
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
		skipAuth: true,
		skipTenant: true
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
	Guards.object<IActivityStreamsActivity>(ROUTES_SOURCE, nameof(request.body), request.body);

	const component = ComponentFactory.get<IDataspaceDataPlaneComponent>(factoryServiceName);
	const result = await component.notifyActivity(request.body);

	if (Is.string(result)) {
		return {
			headers: {
				location: `${baseRouteName}/${ACTIVITY_LOG_ROUTE}/${result}`
			},
			statusCode: HttpStatusCode.processing
		};
	}

	return {
		headers: {
			location: `${baseRouteName}/${ACTIVITY_LOG_ROUTE}/${result.id}`
		},
		statusCode: HttpStatusCode.created,
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
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const component = ComponentFactory.get<IDataspaceDataPlaneComponent>(factoryServiceName);

	return {
		body: await component.getActivityLogEntry(request.pathParams.id)
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
	Guards.stringValue(ROUTES_SOURCE, nameof(request.query.type), request.query.type);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.query.consumerPid), request.query.consumerPid);

	const hostingComponent = ComponentFactory.get<IHostingComponent>(
		httpRequestContext.hostingComponentType ?? "hosting"
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

	if (Is.stringValue(result.cursor)) {
		headers[HeaderTypes.Link] = HeaderHelper.createLinkHeader(
			await hostingComponent.buildPublicUrl(httpRequestContext.serverRequest.url),
			{ cursor: result.cursor },
			"next"
		);
	}

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
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.consumerPid), request.body.consumerPid);

	Guards.object<IFilteringQuery>(ROUTES_SOURCE, nameof(request.body.query), request.body.query);
	Guards.string(ROUTES_SOURCE, nameof(request.body.query.type), request.body.query.type);
	Guards.string(ROUTES_SOURCE, nameof(request.body.query.q), request.body.query.q);

	const hostingComponent = ComponentFactory.get<IHostingComponent>(
		httpRequestContext.hostingComponentType ?? "hosting"
	);

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

	if (Is.stringValue(result.cursor)) {
		headers[HeaderTypes.Link] = HeaderHelper.createLinkHeader(
			await hostingComponent.buildPublicUrl(httpRequestContext.serverRequest.url),
			{ cursor: result.cursor },
			"next"
		);
	}

	return {
		headers,
		body: result.itemList
	};
}
