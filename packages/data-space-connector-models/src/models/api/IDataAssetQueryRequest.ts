// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataAssetDescription } from "../IDataAssetDescription.js";
import type { IFilteringQuery } from "../IFilteringQuery.js";

/**
 * Get Request Data Asset Entities
 */
export interface IDataAssetQueryRequest {
	/**
	 * Request body
	 */
	body: {
		dataAsset: IDataAssetDescription;

		/**
		 * The query
		 */
		query: IFilteringQuery;

		/**
		 * Pagination details. Cursor
		 */
		cursor?: string;

		/**
		 * Pagination details. limit.
		 */
		limit?: number;
	};
}
