// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type { IJsonLdContextDefinitionElement } from "@twin.org/data-json-ld";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
import type { IDataSpaceConnectorApp } from "./models/app/IDataSpaceConnectorApp.js";
import type { IActivityLogEntry } from "./models/IActivityLogEntry.js";
import type { IActivityLogStatusNotification } from "./models/IActivityLogStatusNotification.js";
import type { IDataAssetDescription } from "./models/IDataAssetDescription.js";
import type { IDataAssetItemListResult } from "./models/IDataAssetItemListResult.js";
import type { IEntitySet } from "./models/IEntitySet.js";
import type { IFilteringQuery } from "./models/IFilteringQuery.js";

/**
 * Data Space component interface.
 */
export interface IDataSpaceConnector extends IComponent {
	/**
	 * Notify an Activity to the DS Connector Activity Stream.
	 * @param activity The Activity notified.
	 * @returns The Activity's identifier.
	 */
	notifyActivity(activity: IActivityStreamsActivity): Promise<string>;

	/**
	 * Subscribes to the activity log.
	 * @param callback The callback to be called when Activity Log is called.
	 * @param subscriptionId The subscription Id.
	 * @returns The subscription Id.
	 */
	subscribeToActivityLog(
		callback: (notification: IActivityLogStatusNotification) => Promise<void>,
		subscriptionId?: string
	): Promise<string>;

	/**
	 * Unsubscribes to the activity log.
	 * @param subscriptionId The subscription Id.
	 * @returns The subscription Id.
	 */
	unSubscribeToActivityLog(subscriptionId: string): Promise<void>;

	/**
	 * Returns Activity Log Entry which contains the Activity processing details.
	 * @param logEntryId The Id of the Activity Log Entry (a URI).
	 * @returns the Activity Log Entry with the processing details.
	 * @throws NotFoundError if activity log entry is not known.
	 */
	getActivityLogEntry(logEntryId: string): Promise<IActivityLogEntry>;

	/**
	 * Registers a Data Space Connector App.
	 * @param appId The Id of the App to be registered.
	 * @param app The app to be registered.
	 * @returns Nothing.
	 */
	registerApp(appId: string, app: IDataSpaceConnectorApp): Promise<void>;

	/**
	 * Un-registers a Data Space Connector App.
	 * @param appId The Id of the App to be registered.
	 * @returns Nothing.
	 */
	unregisterApp(appId: string): Promise<void>;

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
	getDataAssetEntities(
		dataAsset: IDataAssetDescription,
		entitySet: IEntitySet & {
			jsonLdContext?: IJsonLdContextDefinitionElement[];
		},
		cursor?: string,
		limit?: number,
		trustPayload?: unknown
	): Promise<IDataAssetItemListResult>;

	/**
	 * Queries a data asset controlled by this DS Connector App.
	 * @param dataAsset The data asset being referred.
	 * @param query The filtering query.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @returns The item list and optional cursor for pagination via Link headers.
	 * @param trustPayload Trust payload to verify the requesters identity.
	 */
	queryDataAsset(
		dataAsset: IDataAssetDescription,
		query: IFilteringQuery,
		cursor?: string,
		limit?: number,
		trustPayload?: unknown
	): Promise<IDataAssetItemListResult>;
}
