// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseSocketClient } from "@twin.org/api-core";
import type { IHttpResponse } from "@twin.org/api-models";
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
} from "@twin.org/core";
import type { IJsonLdContextDefinitionElement } from "@twin.org/data-json-ld";
import type {
	IActivityLogEntry,
	IActivityLogStatusNotification,
	IActivityLogStatusRequest,
	IDataAssetDescription,
	IDataAssetItemListResult,
	IDataSpaceConnector,
	IEntitySet,
	IFilteringQuery
} from "@twin.org/data-space-connector-models";
import type { ILoggingComponent } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
import type { IDataSpaceConnectorSocketClientConstructorOptions } from "./models/IDataSpaceConnectorSocketClientConstructorOptions.js";

/**
 * Data space connector which publishes using REST API and websockets.
 */
export class DataSpaceConnectorSocketClient
	extends BaseSocketClient
	implements IDataSpaceConnector
{
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<DataSpaceConnectorSocketClient>();

	/**
	 * The topic for activity log events.
	 * @internal
	 */
	private static readonly _ACTIVITY_LOG_TOPIC = "activity-log";

	/**
	 * Activity processing details route.
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
	 * Create a new instance of DataSpaceConnectorSocketClient.
	 * @param options Options for the client.
	 */
	constructor(options: IDataSpaceConnectorSocketClientConstructorOptions) {
		super(nameof<DataSpaceConnectorSocketClient>(), options?.config, "data-space-connector");

		this._activityLogSubscriptions = {
			subscriberCallbacks: {}
		};

		this._logging = ComponentFactory.getIfExists(options?.loggingComponentType ?? "logging");

		super.onEvent<IHttpResponse<IActivityLogStatusNotification>>("publish", async data =>
			this.incomingPublishActivityLog(data)
		);
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return DataSpaceConnectorSocketClient.CLASS_NAME;
	}

	/**
	 * Notify an Activity to the DS Connector Activity Stream - implemented in REST Client.
	 * @param activity The Activity notified.
	 * @returns The Activity's identifier.
	 */
	public async notifyActivity(activity: IActivityStreamsActivity): Promise<string> {
		// This method is in the REST client
		throw new NotImplementedError(DataSpaceConnectorSocketClient.CLASS_NAME, "notifyActivity");
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
		Guards.function(DataSpaceConnectorSocketClient.CLASS_NAME, nameof(callback), callback);

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
			super.sendEvent(DataSpaceConnectorSocketClient._ACTIVITY_LOG_STATUS_ROUTE, request);
		}

		await this._logging?.log({
			level: "info",
			source: DataSpaceConnectorSocketClient.CLASS_NAME,
			ts: Date.now(),
			message: "subscribeActivityLogs",
			data: {
				topic: DataSpaceConnectorSocketClient._ACTIVITY_LOG_TOPIC,
				subscriptionId: this._activityLogSubscriptions.subscriptionId
			}
		});

		return localSubscriptionId;
	}

	/**
	 * Unsubscribes to the activity log.
	 * @param subscriptionId The subscription Id.
	 * @returns The subscription Id.
	 */
	public async unSubscribeToActivityLog(subscriptionId: string): Promise<void> {
		Guards.stringValue(
			DataSpaceConnectorSocketClient.CLASS_NAME,
			nameof(subscriptionId),
			subscriptionId
		);

		if (this._activityLogSubscriptions.subscriberCallbacks[subscriptionId]) {
			await this._logging?.log({
				level: "info",
				source: DataSpaceConnectorSocketClient.CLASS_NAME,
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
				super.sendEvent(DataSpaceConnectorSocketClient._ACTIVITY_LOG_STATUS_ROUTE, request);
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
		throw new NotSupportedError(DataSpaceConnectorSocketClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "getActivityLogEntry"
		});
	}

	/**
	 * Get Data Asset entities. Allows to retrieve entities by their type or id.
	 * @param dataAsset The data asset being referred. It can be left empty and let the system to locate a proper one.
	 * @param entitySet The set of entities to be retrieved.
	 * @param entitySet.jsonLdContext The JSON-LD Context to be used to expand the referred entityType.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @param trustPayload Trust payload to verify the requesters identity.
	 * @returns The item list and optional cursor for pagination via Link headers.
	 */
	public async getDataAssetEntities(
		dataAsset: IDataAssetDescription,
		entitySet: IEntitySet & {
			jsonLdContext?: IJsonLdContextDefinitionElement[];
		},
		cursor?: string,
		limit?: number,
		trustPayload?: unknown
	): Promise<IDataAssetItemListResult> {
		throw new NotSupportedError(DataSpaceConnectorSocketClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "getDataAssetEntities"
		});
	}

	/**
	 * Queries a data asset controlled by this DS Connector App.
	 * @param dataAsset The data asset being referred.
	 * @param query The filtering query.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @param trustPayload Trust payload to verify the requesters identity.
	 * @returns The item list and optional cursor for pagination via Link headers.
	 */
	public async queryDataAsset(
		dataAsset: IDataAssetDescription,
		query: IFilteringQuery,
		cursor?: string,
		limit?: number,
		trustPayload?: unknown
	): Promise<IDataAssetItemListResult> {
		throw new NotSupportedError(DataSpaceConnectorSocketClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "queryDataAsset"
		});
	}

	/**
	 * Handle the socket connection.
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
			super.sendEvent(DataSpaceConnectorSocketClient._ACTIVITY_LOG_STATUS_ROUTE, subscribeEmit);
		}
	}

	/**
	 * Handle an error.
	 * @param err The error to handle.
	 */
	protected async handleError(err: IError): Promise<void> {
		await this._logging?.log({
			level: "error",
			source: DataSpaceConnectorSocketClient.CLASS_NAME,
			ts: Date.now(),
			message: "socketConnect",
			error: err
		});
	}

	/**
	 * Handle an incoming publish event.
	 * @param topic The incoming topic.
	 * @param event The incoming data.
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
						source: DataSpaceConnectorSocketClient.CLASS_NAME,
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
