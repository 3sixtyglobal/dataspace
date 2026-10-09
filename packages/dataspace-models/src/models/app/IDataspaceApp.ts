// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@3sixty/core";
import type { IJsonLdDocument } from "@3sixty/data-json-ld";
import type { IDataspaceActivity } from "../IDataspaceActivity.js";
import type { IActivityQuery } from "./IActivityQuery.js";
import type { IDataRequest } from "./IDataRequest.js";
import type { IFollowActivity } from "./IFollowActivity.js";
import type { IProcessingGroupOptions } from "./IProcessingGroupOptions.js";
import type { IUndoActivity } from "./IUndoActivity.js";

/**
 * Interface describes a Dataspace App.
 */
export interface IDataspaceApp extends IComponent {
	/**
	 * The settings for the processing groups for tasks.
	 * @returns The options for each process group.
	 */
	processingGroups?(): { [id: string]: IProcessingGroupOptions };

	/**
	 * The activities handled by the App.
	 * @returns A query that describes the set of activities handled by the App.
	 */
	activitiesHandled(): IActivityQuery[];

	/**
	 * The types of queries supported.
	 * @returns The types of queries supported by the Dataspace App to retrieve data.
	 */
	supportedQueryTypes(): string[];

	/**
	 * Handles an Activity and report about results through the Dataspace Data Plane Callback
	 * @param activity The Activity to be handled
	 * @returns The result of executing the Activity.
	 */
	handleActivity?<T>(activity: IDataspaceActivity): Promise<T>;

	/**
	 * Handles a Data Request.
	 * @param dataRequest The data request.
	 * @param cursor Cursor that points to the next item in the result set.
	 * @param limit Maximum number of entries retrieved or to be retrieved.
	 * @returns Data as JSON-Ld.
	 */
	handleDataRequest?(
		dataRequest: IDataRequest,
		cursor?: string,
		limit?: number
	): Promise<{ data: IJsonLdDocument; cursor?: string }>;

	/**
	 * Subscribe the app to produce data for a follower. Called by the
	 * DS Connector after a push transfer enters STARTED state.
	 * @param followActivity The Follow activity describing the follower + filter.
	 * @returns Promise that resolves when the subscription is set up.
	 */
	subscribeToData?(followActivity: IFollowActivity): Promise<void>;

	/**
	 * Undo a previous subscription. Called on transfer complete/terminate.
	 * @param undoActivity The Undo activity referencing the original Follow.
	 * @returns Promise that resolves when the subscription is torn down.
	 */
	unsubscribeToData?(undoActivity: IUndoActivity): Promise<void>;
}
