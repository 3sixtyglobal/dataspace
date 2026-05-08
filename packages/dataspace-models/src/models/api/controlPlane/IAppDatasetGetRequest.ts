// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * API request to fetch a single app dataset record.
 */
export interface IAppDatasetGetRequest {
	/**
	 * Path parameters containing the stored app dataset id.
	 */
	pathParams: {
		/**
		 * The stored app dataset id (entity primary key).
		 */
		id: string;
	};
}
