// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Get Request for an Activity Log Entry.
 */
export interface IActivityLogEntryGetRequest {
	/**
	 * The parameters from the path.
	 */
	pathParams: {
		/**
		 * The ID of the entry to get.
		 */
		id: string;
	};
}
