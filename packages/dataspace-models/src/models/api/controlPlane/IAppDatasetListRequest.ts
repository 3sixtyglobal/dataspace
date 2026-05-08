// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * API request to list the app datasets owned by the calling tenant.
 */
export interface IAppDatasetListRequest {
	/**
	 * Query parameters for paging. Always strings on the wire.
	 */
	query?: {
		/**
		 * Cursor returned from a previous list call to fetch the next page.
		 */
		cursor?: string;

		/**
		 * Maximum number of entries to return (string-encoded; parsed on the server).
		 */
		limit?: string;
	};
}
