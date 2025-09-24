// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	ICreatedResponse,
	IHttpRequestContext,
	INotFoundResponse,
	IRestRoute,
	ITag,
	IUnprocessableEntityResponse
} from "@twin.org/api-models";
import { ComponentFactory, Guards } from "@twin.org/core";
import type {
	IActivityLogEntry,
	IActivityLogEntryGetRequest,
	IActivityLogEntryGetResponse,
	IActivityStreamNotifyRequest,
	IDataSpaceConnector
} from "@twin.org/data-space-connector-models";
import { nameof } from "@twin.org/nameof";
import { ActivityStreamsContexts, type IActivity } from "@twin.org/standards-w3c-activity-streams";
import { HttpStatusCode, MimeTypes } from "@twin.org/web";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "dataSpaceConnectorRoutes";

/**
 * Activity stream route.
 */
const ACTIVITY_STREAM_ROUTE = "notify";

/**
 * Activity processing details route.
 */
export const ACTIVITY_LOG_ROUTE = "activity-logs";

/**
 * The tag to associate with the routes.
 */
export const tagsDataSpaceConnector: ITag[] = [
	{
		name: "Data Space Connector",
		description: "Endpoints to access a Data Space Connector."
	}
];

const activityExample: IActivity = {
	"@context": ActivityStreamsContexts.ContextRoot,
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
	pendingTasks: [
		{
			taskId: "urn:x-task-id:45678",
			dataSpaceConnectorAppId: "https://my-app.example.org/app1"
		}
	],
	runningTasks: [],
	finalizedTasks: [],
	inErrorTasks: []
};

/**
 * The REST routes for Data Space Connector.
 * @param baseRouteName Prefix to prepend to the paths.
 * @param factoryServiceName The name of the service to use in the routes store in the ServiceFactory.
 * @returns The generated routes.
 */
export function generateRestRoutesDataSpaceConnector(
	baseRouteName: string,
	factoryServiceName: string
): IRestRoute[] {
	const notifyActivityStreamRoute: IRestRoute<IActivityStreamNotifyRequest, ICreatedResponse> = {
		operationId: "activityStreamNotify",
		summary: "Notify of a new Activity",
		tag: tagsDataSpaceConnector[0].name,
		method: "POST",
		path: `${baseRouteName}/${ACTIVITY_STREAM_ROUTE}`,
		handler: async (httpRequestContext, request) =>
			activityStreamNotify(baseRouteName, httpRequestContext, factoryServiceName, request),
		requestType: {
			mimeType: MimeTypes.JsonLd,
			type: nameof<IActivityStreamNotifyRequest>(),
			examples: [
				{
					id: "activityStreamNotifyExample",
					request: {
						body: activityExample
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<ICreatedResponse>()
			},
			{ type: nameof<IUnprocessableEntityResponse>() }
		]
	};

	const getActivityLogEntryRoute: IRestRoute<
		IActivityLogEntryGetRequest,
		IActivityLogEntryGetResponse | INotFoundResponse
	> = {
		operationId: "dataSpaceConnectorGetActivityLogEntry",
		summary: "Get a Activity Log Entry",
		tag: tagsDataSpaceConnector[0].name,
		method: "GET",
		path: `${baseRouteName}/${ACTIVITY_LOG_ROUTE}/:id`,
		handler: async (httpRequestContext, request) =>
			activityLogEntryGet(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<IActivityLogEntryGetRequest>(),
			examples: [
				{
					id: "activityLogEntryGet",
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
						id: "activityLogEntryResponseExample",
						response: {
							body: { ...activityLogEntryExample }
						}
					}
				]
			}
		]
	};

	return [notifyActivityStreamRoute, getActivityLogEntryRoute];
}

/**
 * Notify a new Activity to the Data Space Connector Activity Stream.
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
): Promise<ICreatedResponse> {
	Guards.object<IActivityStreamNotifyRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IActivity>(ROUTES_SOURCE, nameof(request.body), request.body);

	const service = ComponentFactory.get<IDataSpaceConnector>(factoryServiceName);
	const activityLogEntryId = await service.notifyActivity(request.body);

	return {
		headers: {
			location: `${baseRouteName}/${ACTIVITY_LOG_ROUTE}/${activityLogEntryId}`
		},
		statusCode: HttpStatusCode.created
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
): Promise<IActivityLogEntryGetResponse | INotFoundResponse> {
	Guards.object<IActivityLogEntryGetRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IActivityLogEntryGetRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const service = ComponentFactory.get<IDataSpaceConnector>(factoryServiceName);

	return {
		body: await service.getActivityLogEntry(request.pathParams.id)
	};
}
