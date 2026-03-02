// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceProtocolTransferCompletionMessage } from "@twin.org/standards-dataspace-protocol";
import type { HeaderTypes } from "@twin.org/web";

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
