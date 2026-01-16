// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataAssetDescription } from "../IDataAssetDescription.js";
import type { IFilteringQuery } from "../IFilteringQuery.js";

/**
 * Request to query data asset entities.
 */
export interface IDataAssetQueryRequest {
	/**
	 * Request body containing the data asset and query criteria.
	 */
	body: {
		/**
		 * The data asset being queried.
		 */
		dataAsset: IDataAssetDescription;

		/**
		 * The filtering query.
		 */
		query: IFilteringQuery;
	};

	/**
	 * Optional query parameters for pagination.
	 * Used when following Link header URLs.
	 */
	query?: {
		/**
		 * Opaque cursor token for pagination.
		 */
		cursor?: string;

		/**
		 * Maximum number of items to return.
		 */
		limit?: string;
	};
}
