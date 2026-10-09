// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceProtocolTransferCompletionMessage } from "@3sixty/standards-dataspace-protocol";
import type { HeaderTypes } from "@3sixty/web";

/**
 * API request for completing a transfer process.
 */
export interface ICompleteTransferRequest {
	/**
	 * Path parameters containing the process ID.
	 */
	pathParams: {
		/**
		 * Process ID (consumerPid).
		 */
		pid: string;
	};

	/**
	 * Authorization header containing the Base64-encoded trust payload.
	 */
	headers: {
		[HeaderTypes.Authorization]: string;
	};

	/**
	 * Transfer completion message (DSP compliant).
	 */
	body: IDataspaceProtocolTransferCompletionMessage;
}
