// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ISocketRequestContext, ISocketRoute } from "@3sixty/api-models";
import { ComponentFactory, Guards } from "@3sixty/core";
import type {
	IActivityLogStatusNotificationPayload,
	IActivityLogStatusRequest,
	IDataspaceDataPlaneComponent
} from "@3sixty/dataspace-models";
import type { ILoggingComponent } from "@3sixty/logging-models";
import { nameof } from "@3sixty/nameof";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "dataspaceDataPlaneSocketRoutes";

/**
 * The socket routes for the Dataspace Data Plane.
 * @param baseRouteName Prefix to prepend to the paths.
 * @param componentName The name of the component to use in the routes stored in the ComponentFactory.
 * @returns The generated routes.
 */
export function generateSocketRoutesDataspaceDataPlane(
	baseRouteName: string,
	componentName: string
): ISocketRoute[] {
	const activityLogStatusWsRoute: ISocketRoute<
		IActivityLogStatusRequest,
		IActivityLogStatusNotificationPayload
	> = {
		operationId: "statusQuery",
		path: `${baseRouteName}/activity-logs/status`,
		handler: async (socketRequestContext, request, emitter) =>
			activityLogStatusUpdate(socketRequestContext, componentName, request, emitter),
		connected: async socketRequestContext => activityLogStatusConnected(socketRequestContext),
		disconnected: async socketRequestContext =>
			activityLogStatusDisconnected(socketRequestContext, componentName)
	};

	return [activityLogStatusWsRoute];
}

/**
 * Handles an activity log subscribe or unsubscribe operation over a WebSocket.
 * @param socketRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @param emitter The emitter to send message back.
 * @returns A promise that resolves when the subscribe or unsubscribe operation is complete.
 */
export async function activityLogStatusUpdate(
	socketRequestContext: ISocketRequestContext,
	componentName: string,
	request: IActivityLogStatusRequest,
	emitter: (topic: string, response: IActivityLogStatusNotificationPayload) => Promise<void>
): Promise<void> {
	Guards.object<IActivityLogStatusRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.operation), request.body.operation);
	Guards.stringValue(
		ROUTES_SOURCE,
		nameof(request.body.subscriptionId),
		request.body.subscriptionId
	);

	const component = ComponentFactory.get<IDataspaceDataPlaneComponent>(componentName);

	switch (request.body.operation) {
		case "subscribe":
			await component.subscribeToActivityLog(async event => {
				await emitter("publish", {
					body: event
				});
			}, request.body.subscriptionId);
			break;
		case "unsubscribe":
			await component.unSubscribeToActivityLog(request.body.subscriptionId);
			break;
	}
}

/**
 * Executes when there is a disconnection.
 * @param socketRequestContext Socket Request Context
 * @param componentName Component name.
 * @returns A promise that resolves when the socket subscription has been removed.
 */
export async function activityLogStatusDisconnected(
	socketRequestContext: ISocketRequestContext,
	componentName: string
): Promise<void> {
	const logger = ComponentFactory.getIfExists<ILoggingComponent>(
		socketRequestContext.loggingComponentType
	);
	const component = ComponentFactory.get<IDataspaceDataPlaneComponent>(componentName);

	await logger?.log({
		source: ROUTES_SOURCE,
		level: "debug",
		message: "activityLogStatusDisconnected",
		data: {
			socketId: socketRequestContext.socketId
		}
	});

	await component.unSubscribeToActivityLog(socketRequestContext.socketId);
}

/**
 * Executes when a new socket connection is established.
 * @param socketRequestContext Socket Request Context
 * @returns A promise that resolves when the connection event has been logged.
 */
export async function activityLogStatusConnected(
	socketRequestContext: ISocketRequestContext
): Promise<void> {
	const logger = ComponentFactory.getIfExists<ILoggingComponent>(
		socketRequestContext.loggingComponentType
	);

	await logger?.log({
		source: ROUTES_SOURCE,
		level: "debug",
		message: "activityLogStatusConnected",
		data: {
			socketId: socketRequestContext.socketId
		}
	});
}
