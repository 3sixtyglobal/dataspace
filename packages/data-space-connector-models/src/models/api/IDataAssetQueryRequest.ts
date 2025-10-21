// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IDataAssetDescription } from "../IDataAssetDescription";
import type { IFilteringQuery } from "../IFilteringQuery";

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
