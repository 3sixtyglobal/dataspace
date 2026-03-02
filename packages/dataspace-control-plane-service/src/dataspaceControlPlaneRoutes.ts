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
	IDataspaceControlPlaneComponent,
	IRequestTransferRequest,
	IRequestTransferResponse,
	IGetTransferProcessRequest,
	IGetTransferProcessResponse,
	IStartTransferRequest,
	IStartTransferResponse,
	ICompleteTransferRequest,
	ICompleteTransferResponse,
	ISuspendTransferRequest,
	ISuspendTransferResponse,
	ITerminateTransferRequest,
	ITerminateTransferResponse
} from "@twin.org/dataspace-models";
import { nameof } from "@twin.org/nameof";
import { HeaderHelper, HeaderTypes } from "@twin.org/web";
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
	const routes: IRestRoute[] = [];

	// ============================================================================
	// TRANSFER PROCESS PROTOCOL (DSP)
	// ============================================================================

	// POST /transfers/request - Request Transfer Process (DSP)
	routes.push({
		operationId: "requestTransfer",
		summary: "Request Transfer Process (DSP)",
		tag: tagsDataspaceControlPlane[0].name,
		method: "POST",
		path: `${baseRouteName}/transfers/request`,
		handler: async (httpRequestContext, request) =>
			requestTransferHandler(httpRequestContext, componentName, request)
	});

	// GET /transfers/:pid - Get Transfer Process state (DSP)
	routes.push({
		operationId: "getTransferProcess",
		summary: "Get Transfer Process state (DSP)",
		tag: tagsDataspaceControlPlane[0].name,
		method: "GET",
		path: `${baseRouteName}/transfers/:pid`,
		handler: async (httpRequestContext, request) =>
			getTransferProcessHandler(httpRequestContext, componentName, request)
	});

	// POST /transfers/:pid/start - Start Transfer Process (DSP)
	routes.push({
		operationId: "startTransfer",
		summary: "Start Transfer Process (DSP)",
		tag: tagsDataspaceControlPlane[0].name,
		method: "POST",
		path: `${baseRouteName}/transfers/:pid/start`,
		handler: async (httpRequestContext, request) =>
			startTransferHandler(httpRequestContext, componentName, request)
	});

	// POST /transfers/:pid/complete - Complete Transfer Process (DSP)
	routes.push({
		operationId: "completeTransfer",
		summary: "Complete Transfer Process (DSP)",
		tag: tagsDataspaceControlPlane[0].name,
		method: "POST",
		path: `${baseRouteName}/transfers/:pid/complete`,
		handler: async (httpRequestContext, request) =>
			completeTransferHandler(httpRequestContext, componentName, request)
	});

	// POST /transfers/:pid/suspend - Suspend Transfer Process (DSP)
	routes.push({
		operationId: "suspendTransfer",
		summary: "Suspend Transfer Process (DSP)",
		tag: tagsDataspaceControlPlane[0].name,
		method: "POST",
		path: `${baseRouteName}/transfers/:pid/suspend`,
		handler: async (httpRequestContext, request) =>
			suspendTransferHandler(httpRequestContext, componentName, request)
	});

	// POST /transfers/:pid/terminate - Terminate Transfer Process (DSP)
	routes.push({
		operationId: "terminateTransfer",
		summary: "Terminate Transfer Process (DSP)",
		tag: tagsDataspaceControlPlane[0].name,
		method: "POST",
		path: `${baseRouteName}/transfers/:pid/terminate`,
		handler: async (httpRequestContext, request) =>
			terminateTransferHandler(httpRequestContext, componentName, request)
	});

	return routes;
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
