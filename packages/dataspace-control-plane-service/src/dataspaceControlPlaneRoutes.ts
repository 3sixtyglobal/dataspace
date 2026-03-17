// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	IHostingComponent,
	IHttpRequestContext,
	IRestRoute,
	ITag
} from "@twin.org/api-models";
import { ComponentFactory, Guards } from "@twin.org/core";
import type {
	ICompleteTransferRequest,
	ICompleteTransferResponse,
	IDataspaceControlPlaneComponent,
	IGetTransferProcessRequest,
	IGetTransferProcessResponse,
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
import { HeaderHelper, HeaderTypes, MimeTypes } from "@twin.org/web";
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
							authorization: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
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

	return [
		requestTransferRoute,
		getTransferProcessRoute,
		startTransferRoute,
		completeTransferRoute,
		suspendTransferRoute,
		terminateTransferRoute
	];
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

	const hostingComponent = ComponentFactory.get<IHostingComponent>(
		httpRequestContext.hostingComponentType ?? "hosting"
	);

	const component = ComponentFactory.get<IDataspaceControlPlaneComponent>(componentName);
	const result = await component.startTransfer(
		request.body,
		await hostingComponent.getPublicOrigin(httpRequestContext.serverRequest.url),
		trustPayload
	);

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
