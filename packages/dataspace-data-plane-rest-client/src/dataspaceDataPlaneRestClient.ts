// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@twin.org/api-core";
import { HttpParameterHelper, type IBaseRestClientConfig } from "@twin.org/api-models";
import { Coerce, Guards, Is, NotSupportedError } from "@twin.org/core";
import type { IJsonLdContextDefinitionElement } from "@twin.org/data-json-ld";
import type {
	IActivityLogEntry,
	IActivityLogEntryGetRequest,
	IActivityLogEntryGetResponse,
	IActivityLogStatusNotification,
	IActivityStreamNotifyRequest,
	IActivityStreamNotifyResponse,
	IDataAssetEntitiesResponse,
	IDataAssetGetEntitiesRequest,
	IDataAssetItemListResult,
	IDataAssetQueryRequest,
	IDataspaceDataPlaneComponent,
	IEntitySet,
	IFilteringQuery
} from "@twin.org/dataspace-models";
import { nameof } from "@twin.org/nameof";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
import { HeaderHelper, HeaderTypes } from "@twin.org/web";

/**
 * The client to connect to the dataspace data plane service.
 */
export class DataspaceDataPlaneRestClient
	extends BaseRestClient
	implements IDataspaceDataPlaneComponent
{
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<DataspaceDataPlaneRestClient>();

	/**
	 * Create a new instance of DataspaceDataPlaneRestClient.
	 * @param config The configuration for the client.
	 */
	constructor(config: IBaseRestClientConfig) {
		super(DataspaceDataPlaneRestClient.CLASS_NAME, config, "dataspace-data-plane");
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return DataspaceDataPlaneRestClient.CLASS_NAME;
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
		Guards.object<IEntitySet>(
			DataspaceDataPlaneRestClient.CLASS_NAME,
			nameof(entitySet),
			entitySet
		);
		Guards.stringValue(
			DataspaceDataPlaneRestClient.CLASS_NAME,
			nameof(entitySet.entityType),
			entitySet.entityType
		);
		Guards.stringValue(DataspaceDataPlaneRestClient.CLASS_NAME, nameof(consumerPid), consumerPid);
		Guards.stringValue(DataspaceDataPlaneRestClient.CLASS_NAME, nameof(trustPayload), trustPayload);

		const response = await this.fetch<IDataAssetGetEntitiesRequest, IDataAssetEntitiesResponse>(
			"/entities",
			"GET",
			{
				headers: {
					[HeaderTypes.Authorization]: HeaderHelper.createBearer(trustPayload)
				},
				query: {
					id: Is.arrayValue<string>(entitySet.entityId)
						? HttpParameterHelper.arrayToString(entitySet.entityId)
						: undefined,
					type: entitySet.entityType,
					consumerPid,
					limit: Coerce.string(limit),
					cursor
				}
			}
		);

		return {
			itemList: response.body,
			cursor: HeaderHelper.extractLinkHeaderRelation(response.headers?.[HeaderTypes.Link], "next")
				?.urlQueryParams?.cursor
		};
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
		Guards.stringValue(DataspaceDataPlaneRestClient.CLASS_NAME, nameof(consumerPid), consumerPid);
		Guards.object<IFilteringQuery>(DataspaceDataPlaneRestClient.CLASS_NAME, nameof(query), query);
		Guards.stringValue(DataspaceDataPlaneRestClient.CLASS_NAME, nameof(trustPayload), trustPayload);

		const response = await this.fetch<IDataAssetQueryRequest, IDataAssetEntitiesResponse>(
			"/entities/query",
			"POST",
			{
				headers: {
					[HeaderTypes.Authorization]: HeaderHelper.createBearer(trustPayload)
				},
				query: {
					cursor,
					limit: Coerce.string(limit)
				},
				body: {
					consumerPid,
					query
				}
			}
		);

		return {
			itemList: response.body,
			cursor: HeaderHelper.extractLinkHeaderRelation(response.headers?.[HeaderTypes.Link], "next")
				?.urlQueryParams?.cursor
		};
	}

	/**
	 * Notify an Activity to the Dataspace Activity Stream.
	 * @param activity The Activity notified.
	 * @param trustPayload Optional trust payload to verify the requesters identity.
	 * @returns The activity's id or entry.
	 */
	public async notifyActivity(
		activity: IActivityStreamsActivity,
		trustPayload?: unknown
	): Promise<string | IActivityLogEntry> {
		Guards.object<IActivityStreamsActivity>(
			DataspaceDataPlaneRestClient.CLASS_NAME,
			nameof(activity),
			activity
		);
		Guards.stringValue(DataspaceDataPlaneRestClient.CLASS_NAME, nameof(trustPayload), trustPayload);

		const response = await this.fetch<IActivityStreamNotifyRequest, IActivityStreamNotifyResponse>(
			"/inbox",
			"POST",
			{
				headers: {
					[HeaderTypes.Authorization]: HeaderHelper.createBearer(trustPayload)
				},
				body: activity
			}
		);
		const parts = response.headers?.[HeaderTypes.Location]?.split("/");
		const id = Is.arrayValue<string>(parts) ? parts[parts.length - 1] : "";
		return response.body ?? id;
	}

	/**
	 * Subscribes to the activity log - implemented in Socket Client.
	 * @param callback The callback to be called when Activity Log is called.
	 * @param subscriptionId The subscription Id.
	 * @returns The subscription Id.
	 */
	public async subscribeToActivityLog(
		callback: (notification: IActivityLogStatusNotification) => Promise<void>,
		subscriptionId?: string
	): Promise<string> {
		// This is in the socket client
		throw new NotSupportedError(DataspaceDataPlaneRestClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "subscribeToActivityLog"
		});
	}

	/**
	 * Unsubscribes to the activity log - implemented in Socket Client.
	 * @param subscriptionId The subscription Id.
	 * @returns The subscription Id.
	 */
	public async unSubscribeToActivityLog(subscriptionId: string): Promise<void> {
		// This is in the socket client
		throw new NotSupportedError(DataspaceDataPlaneRestClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "unSubscribeToActivityLog"
		});
	}

	/**
	 * Not supported on REST client — push subscriptions are server-side only.
	 * @param consumerPid Unused.
	 */
	public async setupPushSubscription(consumerPid: string): Promise<void> {
		throw new NotSupportedError(DataspaceDataPlaneRestClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "setupPushSubscription"
		});
	}

	/**
	 * Not supported on REST client — push subscriptions are server-side only.
	 * @param consumerPid Unused.
	 */
	public async suspendPushSubscription(consumerPid: string): Promise<void> {
		throw new NotSupportedError(DataspaceDataPlaneRestClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "suspendPushSubscription"
		});
	}

	/**
	 * Not supported on REST client — push subscriptions are server-side only.
	 * @param consumerPid Unused.
	 */
	public async resumePushSubscription(consumerPid: string): Promise<void> {
		throw new NotSupportedError(DataspaceDataPlaneRestClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "resumePushSubscription"
		});
	}

	/**
	 * Not supported on REST client — push subscriptions are server-side only.
	 * @param consumerPid Unused.
	 */
	public async teardownPushSubscription(consumerPid: string): Promise<void> {
		throw new NotSupportedError(DataspaceDataPlaneRestClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "teardownPushSubscription"
		});
	}

	/**
	 * Not supported on REST client — processOutboxActivity is server-side only.
	 * @param activity Unused.
	 */
	public async processOutboxActivity(activity: IActivityStreamsActivity): Promise<void> {
		throw new NotSupportedError(DataspaceDataPlaneRestClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "processOutboxActivity"
		});
	}

	/**
	 * Returns Activity Log Entry which contains the Activity processing details.
	 * @param logEntryId The Id of the Activity Log Entry (a URI).
	 * @returns the Activity Log Entry with the processing details.
	 * @throws NotFoundError if activity log entry is not known.
	 */
	public async getActivityLogEntry(logEntryId: string): Promise<IActivityLogEntry> {
		Guards.stringValue(DataspaceDataPlaneRestClient.CLASS_NAME, nameof(logEntryId), logEntryId);

		const response = await this.fetch<IActivityLogEntryGetRequest, IActivityLogEntryGetResponse>(
			"/activity-logs/:id",
			"GET",
			{
				pathParams: {
					id: logEntryId
				}
			}
		);
		return response.body;
	}
}
