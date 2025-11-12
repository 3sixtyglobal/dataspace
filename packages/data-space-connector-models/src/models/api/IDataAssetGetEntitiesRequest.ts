// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Get Request Data Asset Entities
 */
export interface IDataAssetGetEntitiesRequest {
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
		 * The Id of the data service that offers the data asset
		 */
		dataServiceId?: string;

		/**
		 * The Id of the datasets that describes the data asset (comma separated list)
		 */
		datasetId?: string;

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
