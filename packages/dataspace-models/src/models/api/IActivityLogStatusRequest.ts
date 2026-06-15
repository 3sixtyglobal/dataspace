// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * WebSocket request to subscribe or unsubscribe from the activity log stream.
 */
export interface IActivityLogStatusRequest {
	/**
	 * Request body containing the subscribe or unsubscribe operation.
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
