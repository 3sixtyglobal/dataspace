// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@twin.org/api-core";
import {
	HttpParameterHelper,
	type IBaseRestClientConfig,
	type ICreatedResponse
} from "@twin.org/api-models";
import { Guards, Is, NotSupportedError, Coerce } from "@twin.org/core";
import type { IJsonLdContextDefinitionElement } from "@twin.org/data-json-ld";
import type {
	IActivityLogEntry,
	IActivityLogEntryGetRequest,
	IActivityLogEntryGetResponse,
	IActivityLogStatusNotification,
	IActivityStreamNotifyRequest,
	IDataAssetGetEntitiesRequest,
	IDataAssetItemListResult,
	IDataSpaceConnector,
	IDataSpaceConnectorApp,
	IDataAssetEntitiesResponse,
	IEntitySet,
	IFilteringQuery,
	IDataAssetQueryRequest,
	IDataAssetDescription
} from "@twin.org/data-space-connector-models";
import { nameof } from "@twin.org/nameof";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
import { HeaderHelper, HeaderTypes } from "@twin.org/web";

/**
 * The client to connect to the data space connector service.
 */
export class DataSpaceConnectorRestClient extends BaseRestClient implements IDataSpaceConnector {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<DataSpaceConnectorRestClient>();

	/**
	 * Create a new instance of DataSpaceConnectorRestClient.
	 * @param config The configuration for the client.
	 */
	constructor(config: IBaseRestClientConfig) {
		super(nameof<DataSpaceConnectorRestClient>(), config, "");
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return DataSpaceConnectorRestClient.CLASS_NAME;
	}

	/**
	 * Get Data Asset entities. Allows to retrieve entities by their type or id.
	 * @param dataAsset The data asset being referred. It can be left empty and let the system to locate a proper one.
	 * @param entitySet The set of entities to be retrieved.
	 * @param entitySet.jsonLdContext The JSON-LD Context to be used to expand the referred entityType.
	 * @param trustPayload Trust payload to verify the requesters identity.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @returns The item list and optional cursor for pagination via Link headers.
	 */
	public async getDataAssetEntities(
		dataAsset: IDataAssetDescription,
		entitySet: IEntitySet & {
			jsonLdContext?: IJsonLdContextDefinitionElement[];
		},
		trustPayload: unknown,
		cursor?: string,
		limit?: number
	): Promise<IDataAssetItemListResult> {
		Guards.object<IDataAssetDescription>(
			DataSpaceConnectorRestClient.CLASS_NAME,
			nameof(dataAsset),
			dataAsset
		);
		Guards.object<IEntitySet>(
			DataSpaceConnectorRestClient.CLASS_NAME,
			nameof(entitySet),
			entitySet
		);
		Guards.stringValue(
			DataSpaceConnectorRestClient.CLASS_NAME,
			nameof(entitySet.entityType),
			entitySet.entityType
		);
		Guards.stringValue(DataSpaceConnectorRestClient.CLASS_NAME, nameof(trustPayload), trustPayload);

		const response = await this.fetch<IDataAssetGetEntitiesRequest, IDataAssetEntitiesResponse>(
			"/entities",
			"GET",
			{
				headers: {
					[HeaderTypes.Authorization]: HeaderHelper.createBearer(trustPayload)
				},
				query: {
					id: Is.arrayValue<string>(entitySet.entityId)
						? (HttpParameterHelper.arrayToString(entitySet.entityId) as string)
						: undefined,
					type: entitySet.entityType,
					datasetId: Is.arrayValue<string>(dataAsset.dataSetId)
						? (HttpParameterHelper.arrayToString(dataAsset.dataSetId) as string)
						: undefined,
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
	 * Queries a data asset controlled by this DS Connector App.
	 * @param dataAsset The data asset being referred.
	 * @param query The filtering query.
	 * @param trustPayload Trust payload to verify the requesters identity.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @returns The item list and optional cursor for pagination via Link headers.
	 */
	public async queryDataAsset(
		dataAsset: IDataAssetDescription,
		query: IFilteringQuery,
		trustPayload: unknown,
		cursor?: string,
		limit?: number
	): Promise<IDataAssetItemListResult> {
		Guards.object<IDataAssetDescription>(
			DataSpaceConnectorRestClient.CLASS_NAME,
			nameof(dataAsset),
			dataAsset
		);
		Guards.object<IFilteringQuery>(DataSpaceConnectorRestClient.CLASS_NAME, nameof(query), query);
		Guards.stringValue(DataSpaceConnectorRestClient.CLASS_NAME, nameof(trustPayload), trustPayload);

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
					dataAsset,
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
	 * Notify an Activity to the DS Connector Activity Stream.
	 * @param activity The Activity notified.
	 * @returns The Activity's identifier.
	 */
	public async notifyActivity(activity: IActivityStreamsActivity): Promise<string> {
		const response = await this.fetch<IActivityStreamNotifyRequest, ICreatedResponse>(
			"/notify",
			"POST",
			{
				body: activity
			}
		);
		const parts = response.headers[HeaderTypes.Location].split("/");
		return Is.arrayValue<string>(parts) ? parts[parts.length - 1] : "";
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
		throw new NotSupportedError(DataSpaceConnectorRestClient.CLASS_NAME, "notSupportedOnClient", {
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
		throw new NotSupportedError(DataSpaceConnectorRestClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "unSubscribeToActivityLog"
		});
	}

	/**
	 * Returns Activity Log Entry which contains the Activity processing details.
	 * @param logEntryId The Id of the Activity Log Entry (a URI).
	 * @returns the Activity Log Entry with the processing details.
	 * @throws NotFoundError if activity log entry is not known.
	 */
	public async getActivityLogEntry(logEntryId: string): Promise<IActivityLogEntry> {
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

	/**
	 * Registers a Data Space Connector App.
	 * @param appId The Id of the App to be registered.
	 * @param app The app to be registered.
	 * @returns nothing.
	 */
	public async registerApp(appId: string, app: IDataSpaceConnectorApp): Promise<void> {
		// Don't want client to be able to register apps remotely
		throw new NotSupportedError(DataSpaceConnectorRestClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "registerApp"
		});
	}

	/**
	 * Un-registers a Data Space Connector App.
	 * @param appId The Id of the App to be registered.
	 * @returns Nothing.
	 */
	public async unregisterApp(appId: string): Promise<void> {
		// Don't want client to be able to unregister apps remotely
		throw new NotSupportedError(DataSpaceConnectorRestClient.CLASS_NAME, "notSupportedOnClient", {
			methodName: "unregisterApp"
		});
	}
}
