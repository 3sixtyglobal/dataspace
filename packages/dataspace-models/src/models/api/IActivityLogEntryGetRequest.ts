// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes } from "@3sixty/web";

/**
 * Get Request for an Activity Log Entry.
 */
export interface IActivityLogEntryGetRequest {
	/**
	 * The headers which can be used to authenticate the requester.
	 */
	headers?: {
		[HeaderTypes.Authorization]?: string;
	};

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
