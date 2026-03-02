// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Activity log status
 */
export interface IActivityLogStatusRequest {
	/**
	 * Empty body.
	 */
	body: {
		/**
		 * The operation to perform.
		 */
		operation: "subscribe" | "unsubscribe";

		/**
		 * The subscription Id.
		 */
		subscriptionId: string;
	};
}
