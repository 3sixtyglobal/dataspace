// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceProtocolDataset } from "@twin.org/standards-dataspace-protocol";
import type { IFilteringQuery } from "../IFilteringQuery.js";
import type { DataRequestType } from "./dataRequestType.js";

/**
 * Data Request type for representing data requests received by DS Connector Apps.
 */
export interface IQueryDataAssetRequest {
	/**
	 * Data Asset Entities type.
	 */
	type: typeof DataRequestType.QueryDataAsset;

	/**
	 * The data asset we are referring to.
	 */
	dataAsset: IDataspaceProtocolDataset;

	/**
	 * Query to perform filtering.
	 */
	query: IFilteringQuery;
}
