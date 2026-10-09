// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseSocketClient } from "@3sixty/api-core";
import type { IHttpResponse } from "@3sixty/api-models";
import {
	BaseError,
	ComponentFactory,
	Converter,
	Guards,
	type IError,
	Is,
	NotImplementedError,
	NotSupportedError,
	RandomHelper
} from "@3sixty/core";
import type { IJsonLdContextDefinitionElement } from "@3sixty/data-json-ld";
import type {
	IActivityLogEntry,
	IActivityLogStatusNotification,
	IActivityLogStatusRequest,
	IDataAssetItemListResult,
	IDataspaceDataPlaneComponent,
	IEntitySet,
	IFilteringQuery
} from "@3sixty/dataspace-models";
import type { ILoggingComponent } from "@3sixty/logging-models";
import { nameof } from "@3sixty/nameof";
import type { IActivityStreamsActivity } from "@3sixty/standards-w3c-activity-streams";
import type { IDataspaceDataPlaneSocketClientConstructorOptions } from "./models/IDataspaceDataPlaneSocketClientConstructorOptions.js";

/**
 * Dataspace data plane client which publishes using REST API and websockets.
 */
export class DataspaceDataPlaneSocketClient
	extends BaseSocketClient
	implements IDataspaceDataPlaneComponent
{
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<DataspaceDataPlaneSocketClient>();

	/**
	 * The topic for activity log events.
	 * @internal
	 */
	private static readonly _ACTIVITY_LOG_TOPIC = "activity-log";

	/**
	 * Activity processing details route.
	 * @internal
	 */
	private static readonly _ACTIVITY_LOG_STATUS_ROUTE = "activity-logs/status";

	/**
	 * The logging service for information.
	 * @internal
	 */
	private readonly _logging?: ILoggingComponent;

	/**
	 * Subscriptions to the events.
	 * @internal
	 */
	private readonly _activityLogSubscriptions: {
		subscriptionId?: string;
		subscriberCallbacks: {
			[subscriptionId: string]: (notification: IActivityLogStatusNotification) => Promise<void>;
		};
	};

	/**
	 * Create a new instance of DataspaceDataPlaneSocketClient.
	 * @param options Options for the client.
	 */
	constructor(options: IDataspaceDataPlaneSocketClientConstructorOptions) {
		super(nameof<DataspaceDataPlaneSocketClient>(), options?.config, "dataspace-data-plane");

		this._activityLogSubscriptions = {
			subscriberCallbacks: {}
		};

		this._logging = ComponentFactory.getIfExists(options?.loggingComponentType);

		super.onEvent<IHttpResponse<IActivityLogStatusNotification>>("publish", async data =>
			this.incomingPublishActivityLog(data)
		);
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return DataspaceDataPlaneSocketClient.CLASS_NAME;
	}

	/**
	 * Notify an Activity to the Dataspace Activity Stream - implemented in REST Client.
	 * @param activity The Activity notified.
	 * @param trustPayload Optional trust payload (unused in socket client).
	 * @returns The activity's id or entry.
	 */
	public async notifyActivity(
		activity: IActivityStreamsActivity,
		trustPayload?: unknown
	): Promise<string | IActivityLogEntry> {
		// This method is in the REST client
		throw new NotImplementedError(DataspaceDataPlaneSocketClient.CLASS_NAME, "notifyActivity");
	}

	/**
	 * Not supported on socket client - push subscriptions are server-side only.
	 * @param consumerPid Unused.
	 */
	public async setupPushSubscription(consumerPid: string): Promise<void> {
		throw new NotSupportedError(DataspaceDataPlaneSocketClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "setupPushSubscription"
		});
	}

	/**
	 * Not supported on socket client - push subscriptions are server-side only.
	 * @param consumerPid Unused.
	 */
	public async suspendPushSubscription(consumerPid: string): Promise<void> {
		throw new NotSupportedError(DataspaceDataPlaneSocketClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "suspendPushSubscription"
		});
	}

	/**
	 * Not supported on socket client - push subscriptions are server-side only.
	 * @param consumerPid Unused.
	 */
	public async resumePushSubscription(consumerPid: string): Promise<void> {
		throw new NotSupportedError(DataspaceDataPlaneSocketClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "resumePushSubscription"
		});
	}

	/**
	 * Not supported on socket client - push subscriptions are server-side only.
	 * @param consumerPid Unused.
	 */
	public async teardownPushSubscription(consumerPid: string): Promise<void> {
		throw new NotSupportedError(DataspaceDataPlaneSocketClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "teardownPushSubscription"
		});
	}

	/**
	 * Not supported on socket client - processOutboxActivity is server-side only.
	 * @param activity Unused.
	 */
	public async processOutboxActivity(activity: IActivityStreamsActivity): Promise<void> {
		throw new NotSupportedError(DataspaceDataPlaneSocketClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "processOutboxActivity"
		});
	}

	/**
	 * Subscribes to the activity log.
	 * @param callback The callback to be called when Activity Log is called.
	 * @param subscriptionId The subscription Id.
	 * @returns The subscription Id.
	 */
	public async subscribeToActivityLog(
		callback: (notification: IActivityLogStatusNotification) => Promise<void>,
		subscriptionId?: string
	): Promise<string> {
		Guards.function(DataspaceDataPlaneSocketClient.CLASS_NAME, nameof(callback), callback);

		let needsConnect = false;

		// If we don't yet have an activity log subscription id then create one.
		// we will also need to connect to the socket.
		if (!Is.stringValue(this._activityLogSubscriptions.subscriptionId)) {
			this._activityLogSubscriptions.subscriptionId = Converter.bytesToHex(
				RandomHelper.generate(16)
			);
			needsConnect = true;
		}

		// Store the callback for the specific local subscription
		const localSubscriptionId = subscriptionId ?? Converter.bytesToHex(RandomHelper.generate(16));
		this._activityLogSubscriptions.subscriberCallbacks[localSubscriptionId] = callback;

		// If this the first subscription for the activity logs then send a subscribe to the socket.
		if (needsConnect && super.socketConnect()) {
			const request: IActivityLogStatusRequest = {
				body: {
					operation: "subscribe",
					subscriptionId: this._activityLogSubscriptions.subscriptionId
				}
			};
			super.sendEvent(DataspaceDataPlaneSocketClient._ACTIVITY_LOG_STATUS_ROUTE, request);
		}

		await this._logging?.log({
			level: "info",
			source: DataspaceDataPlaneSocketClient.CLASS_NAME,
			ts: Date.now(),
			message: "subscribeActivityLogs",
			data: {
				topic: DataspaceDataPlaneSocketClient._ACTIVITY_LOG_TOPIC,
				subscriptionId: this._activityLogSubscriptions.subscriptionId
			}
		});

		return localSubscriptionId;
	}

	/**
	 * Unsubscribes from the activity log.
	 * @param subscriptionId The subscription Id to remove.
	 * @returns A promise that resolves when the subscription has been removed.
	 */
	public async unSubscribeToActivityLog(subscriptionId: string): Promise<void> {
		Guards.stringValue(
			DataspaceDataPlaneSocketClient.CLASS_NAME,
			nameof(subscriptionId),
			subscriptionId
		);

		if (this._activityLogSubscriptions.subscriberCallbacks[subscriptionId]) {
			await this._logging?.log({
				level: "info",
				source: DataspaceDataPlaneSocketClient.CLASS_NAME,
				ts: Date.now(),
				message: "unsubscribeActivityLogs",
				data: {
					subscriptionId
				}
			});

			// We found the subscription id so remove it.
			delete this._activityLogSubscriptions.subscriberCallbacks[subscriptionId];

			// If there are no more subscriptions for the activity logs then send an unsubscribe to the socket.
			if (super.socketConnect() && Is.stringValue(this._activityLogSubscriptions.subscriptionId)) {
				const request: IActivityLogStatusRequest = {
					body: {
						operation: "unsubscribe",
						subscriptionId: this._activityLogSubscriptions.subscriptionId
					}
				};
				super.sendEvent(DataspaceDataPlaneSocketClient._ACTIVITY_LOG_STATUS_ROUTE, request);
			}
		}

		// There are no more subscriptions so disconnect the socket
		if (Is.empty(this._activityLogSubscriptions.subscriptionId)) {
			super.socketDisconnect();
		}
	}

	/**
	 * Returns Activity Log Entry which contains the Activity processing details - implemented in REST Client.
	 * @param logEntryId The Id of the Activity Log Entry (a URI).
	 * @returns the Activity Log Entry with the processing details.
	 * @throws NotFoundError if activity log entry is not known.
	 */
	public async getActivityLogEntry(logEntryId: string): Promise<IActivityLogEntry> {
		// This method is in the REST client
		throw new NotSupportedError(DataspaceDataPlaneSocketClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "getActivityLogEntry"
		});
	}

	/**
	 * Get Data Asset entities. Allows to retrieve entities by their type or id.
	 * @param entitySet The set of entities to be retrieved.
	 * @param entitySet.jsonLdContext The JSON-LD Context to be used to expand the referred entityType.
	 * @param consumerPid The consumer Process ID from the DSP Transfer Process.
	 * Used to resolve datasetId from the Transfer Process.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @param trustPayload Trust payload to verify the requesters identity.
	 * @returns The item list and optional cursor for pagination via Link headers.
	 */
	public async getDataAssetEntities(
		entitySet: IEntitySet & {
			jsonLdContext?: IJsonLdContextDefinitionElement[];
		},
		consumerPid: string,
		cursor?: string,
		limit?: number,
		trustPayload?: unknown
	): Promise<IDataAssetItemListResult> {
		throw new NotSupportedError(DataspaceDataPlaneSocketClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "getDataAssetEntities"
		});
	}

	/**
	 * Queries a data asset controlled by this Dataspace App.
	 * @param consumerPid The consumer Process ID from the DSP Transfer Process.
	 * Used to resolve datasetId from the Transfer Process.
	 * @param query The filtering query.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @param trustPayload Trust payload to verify the requesters identity.
	 * @returns The item list and optional cursor for pagination via Link headers.
	 */
	public async queryDataAsset(
		consumerPid: string,
		query: IFilteringQuery,
		cursor?: string,
		limit?: number,
		trustPayload?: unknown
	): Promise<IDataAssetItemListResult> {
		throw new NotSupportedError(DataspaceDataPlaneSocketClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "queryDataAsset"
		});
	}

	/**
	 * Handle the socket connection.
	 * @returns A promise that resolves when any pending subscribe requests have been re-sent.
	 */
	protected async handleConnected(): Promise<void> {
		// The socket has reconnected so send subscribe requests
		// for all the current subscriptions
		if (
			Object.keys(this._activityLogSubscriptions.subscriberCallbacks).length > 0 &&
			Is.stringValue(this._activityLogSubscriptions.subscriptionId)
		) {
			const subscribeEmit: IActivityLogStatusRequest = {
				body: {
					operation: "subscribe",
					subscriptionId: this._activityLogSubscriptions.subscriptionId
				}
			};
			super.sendEvent(DataspaceDataPlaneSocketClient._ACTIVITY_LOG_STATUS_ROUTE, subscribeEmit);
		}
	}

	/**
	 * Handle an error.
	 * @param err The error to handle.
	 * @returns A promise that resolves when the error has been logged.
	 */
	protected async handleError(err: IError): Promise<void> {
		await this._logging?.log({
			level: "error",
			source: DataspaceDataPlaneSocketClient.CLASS_NAME,
			ts: Date.now(),
			message: "socketConnect",
			error: err
		});
	}

	/**
	 * Handle an incoming publish event.
	 * @param event The incoming data.
	 * @returns A promise that resolves when all subscriber callbacks have been invoked.
	 * @internal
	 */
	private async incomingPublishActivityLog(
		event: IHttpResponse<IActivityLogStatusNotification>
	): Promise<void> {
		if (!Is.empty(event.body)) {
			for (const subscriptionId in this._activityLogSubscriptions.subscriberCallbacks) {
				try {
					await this._activityLogSubscriptions.subscriberCallbacks[subscriptionId](event.body);
				} catch (error) {
					await this._logging?.log({
						level: "error",
						source: DataspaceDataPlaneSocketClient.CLASS_NAME,
						ts: Date.now(),
						message: "callback",
						error: BaseError.fromError(error),
						data: {
							subscriptionId
						}
					});
				}
			}
		}
	}
}
