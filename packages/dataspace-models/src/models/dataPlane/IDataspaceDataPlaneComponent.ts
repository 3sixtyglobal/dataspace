// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type { IJsonLdContextDefinitionElement } from "@twin.org/data-json-ld";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
import type { IActivityLogEntry } from "../IActivityLogEntry.js";
import type { IActivityLogStatusNotification } from "../IActivityLogStatusNotification.js";
import type { IDataAssetItemListResult } from "../IDataAssetItemListResult.js";
import type { IEntitySet } from "../IEntitySet.js";
import type { IFilteringQuery } from "../IFilteringQuery.js";

/**
 * Dataspace Data Plane component interface.
 * Implements the Data Plane functionality for the Eclipse Dataspace Protocol.
 */
export interface IDataspaceDataPlaneComponent extends IComponent {
	/**
	 * Notify an Activity to the Dataspace Data Plane Activity Stream.
	 * @param activity The Activity notified.
	 * @param trustPayload Optional trust payload to verify the requester's identity.
	 * @returns The activity's entry.
	 */
	notifyActivity(
		activity: IActivityStreamsActivity,
		trustPayload?: unknown
	): Promise<string | IActivityLogEntry>;

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
	getDataAssetEntities(
		entitySet: IEntitySet & {
			jsonLdContext?: IJsonLdContextDefinitionElement[];
		},
		consumerPid: string,
		cursor?: string,
		limit?: number,
		trustPayload?: unknown
	): Promise<IDataAssetItemListResult>;

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
	queryDataAsset(
		consumerPid: string,
		query: IFilteringQuery,
		cursor?: string,
		limit?: number,
		trustPayload?: unknown
	): Promise<IDataAssetItemListResult>;

	/**
	 * Set up a push subscription after a transfer enters STARTED from REQUESTED.
	 * Reads the TransferProcess, builds an IFollowActivity, calls the app's
	 * subscribeToData, and persists a PushSubscription entity.
	 * @param consumerPid The consumer process ID identifying the transfer.
	 * @returns Promise that resolves when the subscription is created.
	 */
	setupPushSubscription(consumerPid: string): Promise<void>;

	/**
	 * Pause deliveries for a push subscription. The subscription entity stays
	 * alive with status=Paused. No app unsubscribe call.
	 * @param consumerPid The consumer process ID identifying the transfer.
	 * @returns Promise that resolves when the subscription is paused.
	 */
	suspendPushSubscription(consumerPid: string): Promise<void>;

	/**
	 * Resume deliveries after a SUSPENDED → STARTED transition. Flips status
	 * back to Active. No app subscribeToData call.
	 * @param consumerPid The consumer process ID identifying the transfer.
	 * @returns Promise that resolves when the subscription is resumed.
	 */
	resumePushSubscription(consumerPid: string): Promise<void>;

	/**
	 * Tear down a push subscription. Builds an IUndoActivity, calls the app's
	 * unsubscribeToData, and deletes the PushSubscription entity.
	 * @param consumerPid The consumer process ID identifying the transfer.
	 * @returns Promise that resolves when the subscription is torn down.
	 */
	teardownPushSubscription(consumerPid: string): Promise<void>;

	/**
	 * Called by the app when new data is available for a follower.
	 * The activity's `to` attribute contains the consumerPid URN. This method
	 * looks up the matching PushSubscription, validates transfer state, and
	 * schedules a Background Task that POSTs the activity to the consumer.
	 * @param activity The outbound activity carrying the data payload.
	 * @returns Promise that resolves when the delivery task is scheduled.
	 */
	processOutboxActivity(activity: IActivityStreamsActivity): Promise<void>;
}
