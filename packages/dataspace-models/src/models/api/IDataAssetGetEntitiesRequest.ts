// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes } from "@twin.org/web";

/**
 * Get Request Data Asset Entities
 */
export interface IDataAssetGetEntitiesRequest {
	/**
	 * The headers which can be used to determine the response data type.
	 */
	headers?: {
		[HeaderTypes.Authorization]?: string;
	};

	/**
	 * The parameters from the query.
	 */
	query: {
		/**
		 * The ID of the entity(ies) to get. (comma separated list)
		 */
		id?: string;

		/**
		 * The type of the entity to get.
		 */
		type: string;

		/**
		 * The consumer Process ID from the DSP Transfer Process.
		 * Mandatory - used to determine the Dataset, Distribution, and Agreement.
		 * The datasetId is resolved from the Transfer Process using this ID.
		 */
		consumerPid: string;

		/**
		 * The Id of the data service that offers the data asset
		 */
		dataServiceId?: string;

		/**
		 * The maximum number of entities to retrieve.
		 */
		limit?: string;

		/**
		 * Cursor to control pagination.
		 */
		cursor?: string;
	};
}
