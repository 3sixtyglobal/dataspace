// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type { IJsonLdDocument } from "@twin.org/data-json-ld";
import type { IActivity } from "@twin.org/standards-w3c-activity-streams";
import type { IActivityQuery } from "./IActivityQuery";
import type { IDataAssetQuery } from "./IDataAssetQuery";
import type { IDataRequest } from "./IDataRequest";

/**
 * Interface describes a Data Space Connector App.
 */
export interface IDataSpaceConnectorApp extends IComponent {
	/**
	 * The activities handled by the App.
	 * @returns A query that describes the set of activities handled by the App.
	 */
	activitiesHandled(): IActivityQuery[];

	/**
	 * The data services handled by the App.
	 * @returns A query that describes the set of Data Services handled by the App.
	 */
	dataServicesHandled(): IDataAssetQuery[];

	/**
	 * The types of queries supported.
	 * @returns The types of queries supported by the DS Connector App to retrieve data.
	 */
	supportedQueryTypes(): string[];

	/**
	 * Handles an Activity and report about results through the Data Space Connector Callback
	 * @param activity The Activity to be handled
	 * @returns The result of executing the Activity.
	 */
	handleActivity?<T>(activity: IActivity): Promise<T>;

	/**
	 * Handles a Data Request.
	 * @param dataRequest The data Request.
	 * @returns Data as JSON-Ld.
	 */
	handleDataRequest?(
		dataRequest: IDataRequest
	): Promise<{ data: IJsonLdDocument; cursor?: string }>;
}
