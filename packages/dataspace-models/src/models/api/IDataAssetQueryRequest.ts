// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes } from "@twin.org/web";
import type { IFilteringQuery } from "../IFilteringQuery.js";

/**
 * Request to query data asset entities.
 */
export interface IDataAssetQueryRequest {
	/**
	 * The headers which can be used to determine the response data type.
	 */
	headers?: {
		[HeaderTypes.Authorization]?: string;
	};

	/**
	 * Request body containing the data asset and query criteria.
	 */
	body: {
		/**
		 * The consumer Process ID from the DSP Transfer Process.
		 * Mandatory - used to determine the Dataset, Distribution, and Agreement.
		 * The datasetId is resolved from the Transfer Process using this ID.
		 */
		consumerPid: string;

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
