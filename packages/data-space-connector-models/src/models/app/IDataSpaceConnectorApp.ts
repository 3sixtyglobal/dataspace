// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type { IJsonLdDocument } from "@twin.org/data-json-ld";
import type { IActivity } from "@twin.org/standards-w3c-activity-streams";
import type { IDsProtocolDataset } from "../IDsProtocolDataset.js";
import type { IActivityQuery } from "./IActivityQuery.js";
import type { IDataRequest } from "./IDataRequest.js";

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
	 * The datasets handled by the App.
	 * @returns The DS Protocol compliant datasets handled by the App.
	 */
	datasetsHandled(): IDsProtocolDataset[];

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
