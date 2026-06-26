// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	IHttpRequestContext,
	INoContentRequest,
	INoContentResponse,
	INotFoundResponse,
	IRestRoute,
	ITag
} from "@twin.org/api-models";
import { Coerce, ComponentFactory, Guards } from "@twin.org/core";
import type {
	ICompleteTransferRequest,
	ICompleteTransferResponse,
	IDataspaceControlPlaneComponent,
	IGetProtocolVersionsResponse,
	IGetTransferProcessRequest,
	IGetTransferProcessResponse,
	IAppDatasetCreateRequest,
	IAppDatasetCreateResponse,
	IAppDatasetDeleteRequest,
	IAppDatasetGetRequest,
	IAppDatasetGetResponse,
	IAppDatasetListRequest,
	IAppDatasetListResponse,
	IAppDatasetUpdateRequest,
	IRequestTransferRequest,
	IRequestTransferResponse,
	IStartTransferRequest,
	IStartTransferResponse,
	ISuspendTransferRequest,
	ISuspendTransferResponse,
	ITerminateTransferRequest,
	ITerminateTransferResponse
} from "@twin.org/dataspace-models";
import { nameof } from "@twin.org/nameof";
import {
	DataspaceProtocolContexts,
	DataspaceProtocolTransferProcessStateType,
	DataspaceProtocolTransferProcessTypes
} from "@twin.org/standards-dataspace-protocol";
import { HeaderHelper, HeaderTypes, HttpStatusCode, MimeTypes } from "@twin.org/web";
import { transformErrorToStatusCode } from "./utils/transferErrorUtils.js";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "dataspaceControlPlaneRoutes";

/**
 * The tags to associate with the DSP protocol routes.
 */
export const tagsDataspaceControlPlane: ITag[] = [
	{
		name: "Transfer Process",
		description:
			"DSP Transfer Process Protocol endpoints for initiating and managing data transfers."
	},
	{
		name: "Datasets",
		description:
			"Tenant-scoped CRUD over the datasets the Control Plane reads at start time to populate the federated catalogue."
	},
	{
		name: "Version Discovery",
		description:
			"RFC 8615 well-known endpoint for advertising the Dataspace Protocol versions supported by this connector."
	}
];

// Example objects for API documentation
const requestTransferExample = {
	"@context": DataspaceProtocolContexts.Context,
	"@type": DataspaceProtocolTransferProcessTypes.TransferRequestMessage,
	processId: "urn:uuid:consumer-process-12345",
	consumerPid: "urn:uuid:consumer-process-12345",
	providerPid: "urn:uuid:provider-process-12345",
	agreementId: "urn:uuid:agreement-12345",
	dataAddress: {
		"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
		"@id": "https://provider.example.com/data",
		endpointType: "https://w3id.org/dspace/v1/HttpDataAddress",
		baseUrl: "https://provider.example.com/data"
	},
	callbackAddress: "https://consumer.example.com/transfer/webhook",
	format: "urn:example:format"
};

const transferProcessExample = {
	"@context": DataspaceProtocolContexts.Context,
	"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
	processId: "urn:uuid:provider-process-12345",
	consumerPid: "urn:uuid:consumer-process-12345",
	providerPid: "urn:uuid:provider-process-12345",
	state: DataspaceProtocolTransferProcessStateType.STARTED,
	dataAddress: {
		"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
		"@id": "https://provider.example.com/data/transfer-12345",
		endpointType: "https://w3id.org/dspace/v1/HttpDataAddress",
		baseUrl: "https://provider.example.com/data/transfer-12345"
	}
};

/**
 * The REST routes for dataspace control plane (DSP Protocol only).
 * These routes implement the Eclipse Dataspace Protocol Transfer Process Protocol.
 *
 * Contract Negotiation is handled internally via PNP callbacks — no REST endpoints needed.
 * PNP registers its own inbound callback routes for negotiation messages from providers.
 *
 * @param baseRouteName Prefix to prepend to the paths.
 * @param componentName The name of the component to use in the routes stored in the ComponentFactory.
 * @returns The generated DSP protocol routes.
 */
export function generateRestRoutesDataspaceControlPlane(
	baseRouteName: string,
	componentName: string
): IRestRoute[] {
	// ============================================================================
	// TRANSFER PROCESS PROTOCOL (DSP)
	// ============================================================================

	// POST /transfers/request - Request Transfer Process (DSP)
	const requestTransferRoute: IRestRoute<IRequestTransferRequest, IRequestTransferResponse> = {
		operationId: "requestTransfer",
		summary: "Request Transfer Process (DSP)",
		tag: tagsDataspaceControlPlane[0].name,
		method: "POST",
		path: `${baseRouteName}/transfers/request`,
		skipAuth: true,
		handler: async (httpRequestContext, request) =>
			requestTransferHandler(httpRequestContext, componentName, request),
		requestType: {
			mimeType: MimeTypes.JsonLd,
			type: nameof<IRequestTransferRequest>(),
			examples: [
				{
					id: "requestTransferRequestExample",
					request: {
						headers: {
							[HeaderTypes.Authorization]: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
						},
						body: requestTransferExample
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IRequestTransferResponse>(),
				examples: [
					{
						id: "requestTransferResponseExample",
						response: {
							body: transferProcessExample
						}
					}
				]
			}
		]
	};

	// GET /transfers/:pid - Get Transfer Process state (DSP)
	const getTransferProcessRoute: IRestRoute<
		IGetTransferProcessRequest,
		IGetTransferProcessResponse
	> = {
		operationId: "getTransferProcess",
		summary: "Get Transfer Process state (DSP)",
		tag: tagsDataspaceControlPlane[0].name,
		method: "GET",
		path: `${baseRouteName}/transfers/:pid`,
		skipAuth: true,
		handler: async (httpRequestContext, request) =>
			getTransferProcessHandler(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IGetTransferProcessRequest>(),
			examples: [
				{
					id: "getTransferProcessRequestExample",
					request: {
						headers: {
							[HeaderTypes.Authorization]: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
						},
						pathParams: {
							pid: "urn:uuid:provider-process-12345"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IGetTransferProcessResponse>(),
				examples: [
					{
						id: "getTransferProcessResponseExample",
						response: {
							body: transferProcessExample
						}
					}
				]
			}
		]
	};

	// POST /transfers/:pid/start - Start Transfer Process (DSP)
	const startTransferRoute: IRestRoute<IStartTransferRequest, IStartTransferResponse> = {
		operationId: "startTransfer",
		summary: "Start Transfer Process (DSP)",
		tag: tagsDataspaceControlPlane[0].name,
		method: "POST",
		path: `${baseRouteName}/transfers/:pid/start`,
		skipAuth: true,
		handler: async (httpRequestContext, request) =>
			startTransferHandler(httpRequestContext, componentName, request),
		requestType: {
			mimeType: MimeTypes.JsonLd,
			type: nameof<IStartTransferRequest>(),
			examples: [
				{
					id: "startTransferRequestExample",
					request: {
						headers: {
							[HeaderTypes.Authorization]: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
						},
						pathParams: {
							pid: "urn:uuid:consumer-process-12345"
						},
						body: {
							"@context": DataspaceProtocolContexts.Context,
							"@type": "TransferStartMessage",
							consumerPid: "urn:uuid:consumer-process-12345",
							providerPid: "urn:uuid:provider-process-12345"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IStartTransferResponse>(),
				examples: [
					{
						id: "startTransferResponseExample",
						response: {
							body: {
								"@context": DataspaceProtocolContexts.Context,
								"@type": DataspaceProtocolTransferProcessTypes.TransferStartMessage,
								consumerPid: "urn:uuid:consumer-process-12345",
								providerPid: "urn:uuid:provider-process-12345"
							}
						}
					}
				]
			}
		]
	};

	// POST /transfers/:pid/complete - Complete Transfer Process (DSP)
	const completeTransferRoute: IRestRoute<ICompleteTransferRequest, ICompleteTransferResponse> = {
		operationId: "completeTransfer",
		summary: "Complete Transfer Process (DSP)",
		tag: tagsDataspaceControlPlane[0].name,
		method: "POST",
		path: `${baseRouteName}/transfers/:pid/complete`,
		skipAuth: true,
		handler: async (httpRequestContext, request) =>
			completeTransferHandler(httpRequestContext, componentName, request),
		requestType: {
			mimeType: MimeTypes.JsonLd,
			type: nameof<ICompleteTransferRequest>(),
			examples: [
				{
					id: "completeTransferRequestExample",
					request: {
						headers: {
							[HeaderTypes.Authorization]: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
						},
						pathParams: {
							pid: "urn:uuid:consumer-process-12345"
						},
						body: {
							"@context": DataspaceProtocolContexts.Context,
							"@type": "TransferCompletionMessage",
							consumerPid: "urn:uuid:consumer-process-12345",
							providerPid: "urn:uuid:provider-process-12345"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<ICompleteTransferResponse>(),
				examples: [
					{
						id: "completeTransferResponseExample",
						response: {
							body: {
								...transferProcessExample,
								state: DataspaceProtocolTransferProcessStateType.COMPLETED
							}
						}
					}
				]
			}
		]
	};

	// POST /transfers/:pid/suspend - Suspend Transfer Process (DSP)
	const suspendTransferRoute: IRestRoute<ISuspendTransferRequest, ISuspendTransferResponse> = {
		operationId: "suspendTransfer",
		summary: "Suspend Transfer Process (DSP)",
		tag: tagsDataspaceControlPlane[0].name,
		method: "POST",
		path: `${baseRouteName}/transfers/:pid/suspend`,
		skipAuth: true,
		handler: async (httpRequestContext, request) =>
			suspendTransferHandler(httpRequestContext, componentName, request),
		requestType: {
			mimeType: MimeTypes.JsonLd,
			type: nameof<ISuspendTransferRequest>(),
			examples: [
				{
					id: "suspendTransferRequestExample",
					request: {
						headers: {
							[HeaderTypes.Authorization]: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
						},
						pathParams: {
							pid: "urn:uuid:consumer-process-12345"
						},
						body: {
							"@context": DataspaceProtocolContexts.Context,
							"@type": "TransferSuspensionMessage",
							consumerPid: "urn:uuid:consumer-process-12345",
							providerPid: "urn:uuid:provider-process-12345"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<ISuspendTransferResponse>(),
				examples: [
					{
						id: "suspendTransferResponseExample",
						response: {
							body: {
								...transferProcessExample,
								state: DataspaceProtocolTransferProcessStateType.SUSPENDED
							}
						}
					}
				]
			}
		]
	};

	// POST /transfers/:pid/terminate - Terminate Transfer Process (DSP)
	const terminateTransferRoute: IRestRoute<ITerminateTransferRequest, ITerminateTransferResponse> =
		{
			operationId: "terminateTransfer",
			summary: "Terminate Transfer Process (DSP)",
			tag: tagsDataspaceControlPlane[0].name,
			method: "POST",
			path: `${baseRouteName}/transfers/:pid/terminate`,
			skipAuth: true,
			handler: async (httpRequestContext, request) =>
				terminateTransferHandler(httpRequestContext, componentName, request),
			requestType: {
				mimeType: MimeTypes.JsonLd,
				type: nameof<ITerminateTransferRequest>(),
				examples: [
					{
						id: "terminateTransferRequestExample",
						request: {
							headers: {
								[HeaderTypes.Authorization]: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
							},
							pathParams: {
								pid: "urn:uuid:consumer-process-12345"
							},
							body: {
								"@context": DataspaceProtocolContexts.Context,
								"@type": "TransferTerminationMessage",
								consumerPid: "urn:uuid:consumer-process-12345",
								providerPid: "urn:uuid:provider-process-12345"
							}
						}
					}
				]
			},
			responseType: [
				{
					type: nameof<ITerminateTransferResponse>(),
					examples: [
						{
							id: "terminateTransferResponseExample",
							response: {
								body: {
									...transferProcessExample,
									state: DataspaceProtocolTransferProcessStateType.TERMINATED
								}
							}
						}
					]
				}
			]
		};

	// ============================================================================
	// DSP VERSION DISCOVERY
	// ============================================================================

	// GET /.well-known/dspace-version - DSP version discovery (unauthenticated, RFC 8615)
	const getProtocolVersionsRoute: IRestRoute<INoContentRequest, IGetProtocolVersionsResponse> = {
		operationId: "getProtocolVersions",
		summary: "Get supported Dataspace Protocol versions (DSP 2025-1)",
		tag: tagsDataspaceControlPlane[2].name,
		method: "GET",
		path: ".well-known/dspace-version",
		skipAuth: true,
		skipTenant: true,
		handler: async (httpRequestContext, request) =>
			getProtocolVersionsHandler(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<INoContentRequest>(),
			examples: [
				{
					id: "getProtocolVersionsRequestExample",
					request: {}
				}
			]
		},
		responseType: [
			{
				type: nameof<IGetProtocolVersionsResponse>(),
				examples: [
					{
						id: "getProtocolVersionsResponseExample",
						response: {
							body: {
								protocolVersions: [
									{
										version: "2025-1",
										path: "/dataspace-control-plane/2025-1",
										binding: "HTTPS",
										serviceId: "twin-connector"
									}
								]
							}
						}
					}
				]
			}
		]
	};

	// ============================================================================
	// DATASPACE APP DATASET MANAGEMENT
	// ============================================================================

	const createDataspaceAppDatasetRoute: IRestRoute<
		IAppDatasetCreateRequest,
		IAppDatasetCreateResponse
	> = {
		operationId: "datasetCreate",
		summary: "Register an app dataset for the calling tenant.",
		tag: tagsDataspaceControlPlane[1].name,
		method: "POST",
		path: `${baseRouteName}/app-datasets`,
		handler: async (httpRequestContext, request) =>
			createAppDatasetHandler(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IAppDatasetCreateRequest>(),
			examples: [
				{
					id: "datasetCreateRequestExample",
					request: {
						body: {
							appId: "https://twin.example.org/app1",
							dataset: {
								"@context": DataspaceProtocolContexts.Context,
								"@type": "Dataset",
								"@id": "https://twin.example.org/data-service-1",
								hasPolicy: [],
								distribution: []
							} as never
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IAppDatasetCreateResponse>(),
				examples: [
					{
						id: "datasetCreateResponseExample",
						response: {
							statusCode: 201,
							headers: {
								[HeaderTypes.Location]: "https://twin.example.org/data-service-1"
							}
						}
					}
				]
			}
		]
	};

	const getDataspaceAppDatasetRoute: IRestRoute<IAppDatasetGetRequest, IAppDatasetGetResponse> = {
		operationId: "datasetGet",
		summary: "Retrieve an app dataset owned by the calling tenant.",
		tag: tagsDataspaceControlPlane[1].name,
		method: "GET",
		path: `${baseRouteName}/app-datasets/:id`,
		handler: async (httpRequestContext, request) =>
			getAppDatasetHandler(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IAppDatasetGetRequest>(),
			examples: [
				{
					id: "datasetGetRequestExample",
					request: {
						pathParams: { id: "dataspace-app-dataset-1" }
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IAppDatasetGetResponse>()
			}
		]
	};

	const listDataspaceAppDatasetsRoute: IRestRoute<IAppDatasetListRequest, IAppDatasetListResponse> =
		{
			operationId: "datasetList",
			summary: "List the app datasets owned by the calling tenant.",
			tag: tagsDataspaceControlPlane[1].name,
			method: "GET",
			path: `${baseRouteName}/app-datasets`,
			handler: async (httpRequestContext, request) =>
				listAppDatasetsHandler(httpRequestContext, componentName, request),
			requestType: {
				type: nameof<IAppDatasetListRequest>(),
				examples: [
					{
						id: "datasetListRequestExample",
						request: {}
					}
				]
			},
			responseType: [
				{
					type: nameof<IAppDatasetListResponse>()
				}
			]
		};

	const updateDataspaceAppDatasetRoute: IRestRoute<IAppDatasetUpdateRequest, INoContentResponse> = {
		operationId: "datasetUpdate",
		summary: "Update an app dataset owned by the calling tenant.",
		tag: tagsDataspaceControlPlane[1].name,
		method: "PUT",
		path: `${baseRouteName}/app-datasets/:id`,
		handler: async (httpRequestContext, request) =>
			updateAppDatasetHandler(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IAppDatasetUpdateRequest>(),
			examples: [
				{
					id: "datasetUpdateRequestExample",
					// `dataset["@id"]` is intentionally omitted — the path id is
					// authoritative and any body `@id` is stripped before storage.
					request: {
						pathParams: { id: "dataspace-app-dataset-1" },
						body: {
							appId: "https://twin.example.org/app1",
							dataset: {
								"@context": DataspaceProtocolContexts.Context,
								"@type": "Dataset",
								hasPolicy: [],
								distribution: []
							} as never
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INoContentResponse>(),
				examples: [
					{
						id: "datasetUpdateResponseExample",
						response: {
							statusCode: HttpStatusCode.noContent
						}
					}
				]
			},
			{
				type: nameof<INotFoundResponse>()
			}
		]
	};

	const deleteDataspaceAppDatasetRoute: IRestRoute<IAppDatasetDeleteRequest, INoContentResponse> = {
		operationId: "datasetDelete",
		summary: "Delete an app dataset owned by the calling tenant.",
		tag: tagsDataspaceControlPlane[1].name,
		method: "DELETE",
		path: `${baseRouteName}/app-datasets/:id`,
		handler: async (httpRequestContext, request) =>
			deleteAppDatasetHandler(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IAppDatasetDeleteRequest>(),
			examples: [
				{
					id: "datasetDeleteRequestExample",
					request: {
						pathParams: { id: "dataspace-app-dataset-1" }
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INoContentResponse>(),
				examples: [
					{
						id: "datasetDeleteResponseExample",
						response: {
							statusCode: HttpStatusCode.noContent
						}
					}
				]
			},
			{
				type: nameof<INotFoundResponse>()
			}
		]
	};

	return [
		getProtocolVersionsRoute,
		requestTransferRoute,
		getTransferProcessRoute,
		startTransferRoute,
		completeTransferRoute,
		suspendTransferRoute,
		terminateTransferRoute,
		createDataspaceAppDatasetRoute,
		listDataspaceAppDatasetsRoute,
		getDataspaceAppDatasetRoute,
		updateDataspaceAppDatasetRoute,
		deleteDataspaceAppDatasetRoute
	];
}

// ============================================================================
// DSP VERSION DISCOVERY HANDLER
// ============================================================================

/**
 * Get Protocol Versions handler.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use.
 * @param request The API request (no parameters required).
 * @returns The response with the list of supported DSP versions.
 */
async function getProtocolVersionsHandler(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: INoContentRequest
): Promise<IGetProtocolVersionsResponse> {
	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	const result = await component.getProtocolVersions();

	return { body: result };
}

// ============================================================================
// TRANSFER PROCESS PROTOCOL HANDLERS
// ============================================================================

/**
 * Request Transfer Process handler.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use.
 * @param request The API request containing headers and body.
 * @returns The response.
 */
async function requestTransferHandler(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IRequestTransferRequest
): Promise<IRequestTransferResponse> {
	Guards.object(ROUTES_SOURCE, nameof(request), request);
	Guards.object(ROUTES_SOURCE, nameof(request.body), request.body);

	const trustPayload = HeaderHelper.extractBearer(request.headers[HeaderTypes.Authorization]);

	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	const result = await component.requestTransfer(request.body, trustPayload);

	return {
		body: result,
		statusCode: transformErrorToStatusCode(result)
	};
}

/**
 * Get Transfer Process handler.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use.
 * @param request The API request containing headers and path parameters.
 * @returns The response.
 */
async function getTransferProcessHandler(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IGetTransferProcessRequest
): Promise<IGetTransferProcessResponse> {
	Guards.object(ROUTES_SOURCE, nameof(request), request);
	Guards.object(ROUTES_SOURCE, nameof(request.pathParams), request.pathParams);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.pid), request.pathParams.pid);

	const trustPayload = HeaderHelper.extractBearer(request.headers[HeaderTypes.Authorization]);

	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	const result = await component.getTransferProcess(request.pathParams.pid, trustPayload);

	return {
		body: result,
		statusCode: transformErrorToStatusCode(result)
	};
}

/**
 * Start Transfer Process handler.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use.
 * @param request The API request containing headers, path parameters, and body.
 * @returns The response.
 */
async function startTransferHandler(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IStartTransferRequest
): Promise<IStartTransferResponse> {
	Guards.object(ROUTES_SOURCE, nameof(request), request);
	Guards.object(ROUTES_SOURCE, nameof(request.body), request.body);

	const trustPayload = HeaderHelper.extractBearer(request.headers[HeaderTypes.Authorization]);

	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	const result = await component.startTransfer(request.body, trustPayload);

	return {
		body: result,
		statusCode: transformErrorToStatusCode(result)
	};
}

/**
 * Complete Transfer Process handler.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use.
 * @param request The API request containing headers, path parameters, and body.
 * @returns The response.
 */
async function completeTransferHandler(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: ICompleteTransferRequest
): Promise<ICompleteTransferResponse> {
	Guards.object(ROUTES_SOURCE, nameof(request), request);
	Guards.object(ROUTES_SOURCE, nameof(request.body), request.body);

	const trustPayload = HeaderHelper.extractBearer(request.headers[HeaderTypes.Authorization]);

	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	const result = await component.completeTransfer(request.body, trustPayload);

	return {
		body: result,
		statusCode: transformErrorToStatusCode(result)
	};
}

/**
 * Suspend Transfer Process handler.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use.
 * @param request The API request containing headers, path parameters, and body.
 * @returns The response.
 */
async function suspendTransferHandler(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: ISuspendTransferRequest
): Promise<ISuspendTransferResponse> {
	Guards.object(ROUTES_SOURCE, nameof(request), request);
	Guards.object(ROUTES_SOURCE, nameof(request.body), request.body);

	const trustPayload = HeaderHelper.extractBearer(request.headers[HeaderTypes.Authorization]);

	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	const result = await component.suspendTransfer(request.body, trustPayload);

	return {
		body: result,
		statusCode: transformErrorToStatusCode(result)
	};
}

/**
 * Terminate Transfer Process handler.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use.
 * @param request The API request containing headers, path parameters, and body.
 * @returns The response.
 */
async function terminateTransferHandler(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: ITerminateTransferRequest
): Promise<ITerminateTransferResponse> {
	Guards.object(ROUTES_SOURCE, nameof(request), request);
	Guards.object(ROUTES_SOURCE, nameof(request.body), request.body);

	const trustPayload = HeaderHelper.extractBearer(request.headers[HeaderTypes.Authorization]);

	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	const result = await component.terminateTransfer(request.body, trustPayload);

	return {
		body: result,
		statusCode: transformErrorToStatusCode(result)
	};
}

// ============================================================================
// App DATASET HANDLERS
// ============================================================================

/**
 * Create app dataset handler.
 * @param httpRequestContext The request context.
 * @param componentName The name of the component to use.
 * @param request The API request containing the dataset payload.
 * @returns The response with a Location header pointing at the new resource.
 */
async function createAppDatasetHandler(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IAppDatasetCreateRequest
): Promise<IAppDatasetCreateResponse> {
	Guards.object<IAppDatasetCreateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object(ROUTES_SOURCE, nameof(request.body), request.body);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.appId), request.body.appId);
	Guards.object(ROUTES_SOURCE, nameof(request.body.dataset), request.body.dataset);

	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	const resolvedId = await component.createAppDataset(
		request.body.id,
		request.body.appId,
		request.body.dataset
	);

	return {
		statusCode: 201,
		headers: {
			[HeaderTypes.Location]: resolvedId
		}
	};
}

/**
 * Get app dataset record handler.
 * @param httpRequestContext The request context.
 * @param componentName The name of the component to use.
 * @param request The API request containing the stored app dataset id.
 * @returns The response containing the stored app dataset record.
 */
async function getAppDatasetHandler(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IAppDatasetGetRequest
): Promise<IAppDatasetGetResponse> {
	Guards.object<IAppDatasetGetRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object(ROUTES_SOURCE, nameof(request.pathParams), request.pathParams);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	const result = await component.getAppDataset(request.pathParams.id);

	return { body: result };
}

/**
 * List app datasets handler.
 * @param httpRequestContext The request context.
 * @param componentName The name of the component to use.
 * @param request The API request containing optional paging parameters.
 * @returns The response containing the app datasets owned by the calling tenant.
 */
async function listAppDatasetsHandler(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IAppDatasetListRequest
): Promise<IAppDatasetListResponse> {
	Guards.object<IAppDatasetListRequest>(ROUTES_SOURCE, nameof(request), request);

	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	const result = await component.listAppDatasets(
		request.query?.cursor,
		Coerce.integer(request.query?.limit)
	);

	return { body: result };
}

/**
 * Update app dataset record handler.
 * @param httpRequestContext The request context.
 * @param componentName The name of the component to use.
 * @param request The API request containing the updated app dataset payload.
 * @returns Empty response on success.
 */
async function updateAppDatasetHandler(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IAppDatasetUpdateRequest
): Promise<INoContentResponse> {
	Guards.object<IAppDatasetUpdateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object(ROUTES_SOURCE, nameof(request.pathParams), request.pathParams);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);
	Guards.object(ROUTES_SOURCE, nameof(request.body), request.body);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.appId), request.body.appId);
	Guards.object(ROUTES_SOURCE, nameof(request.body.dataset), request.body.dataset);

	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	await component.updateAppDataset(request.pathParams.id, request.body.appId, request.body.dataset);

	return {
		statusCode: HttpStatusCode.noContent
	};
}

/**
 * Delete app dataset record handler.
 * @param httpRequestContext The request context.
 * @param componentName The name of the component to use.
 * @param request The API request containing the stored app dataset id.
 * @returns Empty response on success.
 */
async function deleteAppDatasetHandler(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IAppDatasetDeleteRequest
): Promise<INoContentResponse> {
	Guards.object<IAppDatasetDeleteRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object(ROUTES_SOURCE, nameof(request.pathParams), request.pathParams);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	await component.deleteAppDataset(request.pathParams.id);

	return {
		statusCode: HttpStatusCode.noContent
	};
}
