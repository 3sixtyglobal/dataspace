// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@twin.org/api-core";
import {
	HttpParameterHelper,
	type IBaseRestClientConfig,
	type ICreatedResponse
} from "@twin.org/api-models";
import { ContextIdKeys } from "@twin.org/context";
import { Guards, Is, NotSupportedError, Coerce } from "@twin.org/core";
import type { IJsonLdContextDefinitionElement } from "@twin.org/data-json-ld";
import type {
	IActivityLogEntry,
	IActivityLogEntryGetRequest,
	IActivityLogEntryGetResponse,
	IActivityLogStatusNotification,
	IActivityStreamNotifyRequest,
	IDataAssetGetEntitiesRequest,
	IDataAssetItemList,
	IDataSpaceConnector,
	IDataSpaceConnectorApp,
	IDataAssetEntitiesResponse,
	IEntitySet,
	IFilteringQuery,
	IDataAssetQueryRequest,
	IDataAssetDescription
} from "@twin.org/data-space-connector-models";
import { nameof } from "@twin.org/nameof";
import type { IActivity } from "@twin.org/standards-w3c-activity-streams";
import { HeaderTypes } from "@twin.org/web";

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
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @returns The entities requested as a JSON-LD Document.
	 */
	public async getDataAssetEntities(
		dataAsset: IDataAssetDescription,
		entitySet: IEntitySet & {
			jsonLdContext?: IJsonLdContextDefinitionElement[];
		},
		cursor?: string,
		limit?: number
	): Promise<IDataAssetItemList> {
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

		// Data Consumer identity for the moment is not used in the request but it should be done in the future
		const response = await this.fetch<IDataAssetGetEntitiesRequest, IDataAssetEntitiesResponse>(
			"/entities",
			"GET",
			{
				query: {
					id: Is.arrayValue<string>(entitySet.entityId)
						? (HttpParameterHelper.arrayToString(entitySet.entityId) as string)
						: undefined,
					type: entitySet.entityType,
					dataServiceId: Is.stringValue(dataAsset.dataServiceId)
						? dataAsset.dataServiceId
						: undefined,
					datasetId: Is.arrayValue<string>(dataAsset.dataSetId)
						? (HttpParameterHelper.arrayToString(dataAsset.dataSetId) as string)
						: undefined,
					limit: Coerce.string(limit),
					cursor
				}
			},
			{
				authenticationGeneratorType: "verifiable-credential",
				authenticationData: {
					contextId: ContextIdKeys.Organization
				}
			}
		);
		return response.body;
	}

	/**
	 * Queries a data asset controlled by this DS Connector App.
	 * @param dataAsset The data asset being referred.
	 * @param query The filtering query.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @returns The entities requested as a JSON-LD Document.
	 */
	public async queryDataAsset(
		dataAsset: IDataAssetDescription,
		query: IFilteringQuery,
		cursor?: string,
		limit?: number
	): Promise<IDataAssetItemList> {
		// The identity of the data consumer would need to be attested through a JWT
		Guards.object<IDataAssetDescription>(
			DataSpaceConnectorRestClient.CLASS_NAME,
			nameof(dataAsset),
			dataAsset
		);
		Guards.stringValue(
			DataSpaceConnectorRestClient.CLASS_NAME,
			nameof(dataAsset.dataServiceId),
			dataAsset.dataServiceId
		);
		Guards.object<IFilteringQuery>(DataSpaceConnectorRestClient.CLASS_NAME, nameof(query), query);

		const response = await this.fetch<IDataAssetQueryRequest, IDataAssetEntitiesResponse>(
			"/entities/query",
			"POST",
			{
				body: {
					dataAsset,
					query,
					cursor,
					limit
				}
			},
			{
				authenticationGeneratorType: "verifiable-credential",
				authenticationData: {
					contextId: ContextIdKeys.Organization
				}
			}
		);
		return response.body;
	}

	/**
	 * Notify an Activity to the DS Connector Activity Stream.
	 * @param activity The Activity notified.
	 * @returns The Activity's identifier.
	 */
	public async notifyActivity(activity: IActivity): Promise<string> {
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
		throw new NotSupportedError(
			DataSpaceConnectorRestClient.CLASS_NAME,
			nameof("subscribeToActivityLog")
		);
	}

	/**
	 * Unsubscribes to the activity log - implemented in Socket Client.
	 * @param subscriptionId The subscription Id.
	 * @returns The subscription Id.
	 */
	public async unSubscribeToActivityLog(subscriptionId: string): Promise<void> {
		// This is in the socket client
		throw new NotSupportedError(
			DataSpaceConnectorRestClient.CLASS_NAME,
			nameof("unSubscribeToActivityLog")
		);
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
		throw new NotSupportedError(DataSpaceConnectorRestClient.CLASS_NAME, nameof("registerApp"));
	}

	/**
	 * Un-registers a Data Space Connector App.
	 * @param appId The Id of the App to be registered.
	 * @returns Nothing.
	 */
	public async unregisterApp(appId: string): Promise<void> {
		// Don't want client to be able to unregister apps remotely
		throw new NotSupportedError(DataSpaceConnectorRestClient.CLASS_NAME, nameof("unregisterApp"));
	}
}
