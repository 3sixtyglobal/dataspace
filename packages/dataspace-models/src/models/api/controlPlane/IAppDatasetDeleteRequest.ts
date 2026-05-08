// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * API request to delete a stored app dataset record.
 */
export interface IAppDatasetDeleteRequest {
	/**
	 * Path parameters containing the stored dataset id.
	 */
	pathParams: {
		/**
		 * The stored dataset id.
		 */
		id: string;
	};
}
