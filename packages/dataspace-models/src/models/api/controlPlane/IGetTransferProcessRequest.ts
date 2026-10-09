// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes } from "@3sixty/web";

/**
 * API request for getting a transfer process state.
 */
export interface IGetTransferProcessRequest {
	/**
	 * Path parameters containing the process ID.
	 */
	pathParams: {
		/**
		 * Process ID (consumerPid or providerPid).
		 */
		pid: string;
	};

	/**
	 * Authorization header containing the Base64-encoded trust payload.
	 */
	headers: {
		[HeaderTypes.Authorization]: string;
	};
}
