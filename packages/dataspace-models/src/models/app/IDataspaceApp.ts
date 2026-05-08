// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type { IJsonLdDocument } from "@twin.org/data-json-ld";
import type { IDataspaceProtocolDataset } from "@twin.org/standards-dataspace-protocol";
import type { IActivityQuery } from "./IActivityQuery.js";
import type { IDataRequest } from "./IDataRequest.js";
import type { IDataspaceActivity } from "../IDataspaceActivity.js";
import type { IProcessingGroupOptions } from "./IProcessingGroupOptions.js";

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
	 * Optional override called by the Control Plane when publishing a stored dataset for this app.
	 * The Control Plane always calls `populateDefaults` (e.g. `dcterms:publisher`)
	 * on every dataset returned here, so apps don't need to populate publisher themselves.
	 * @param payload The user-stored dataset payload.
	 * @param tenantId The owning tenant for this dataset. Empty string on
	 * single-tenant nodes (no `TWIN_TENANT_ENABLED`).
	 * @returns One or more datasets to publish to the catalogue. System-stamped
	 * fields like `dcterms:publisher` may be omitted — the Control Plane fills them in.
	 */
	datasetsHandled?(
		payload: IDataspaceProtocolDataset,
		tenantId: string
	): Promise<IDataspaceProtocolDataset[]>;

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
}
