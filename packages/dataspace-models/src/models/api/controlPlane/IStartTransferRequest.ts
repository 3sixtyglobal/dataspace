// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceProtocolTransferStartMessage } from "@twin.org/standards-dataspace-protocol";
import type { HeaderTypes } from "@twin.org/web";

/**
 * API request for starting a transfer process.
 */
export interface IStartTransferRequest {
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
	 * Transfer start message (DSP compliant).
	 */
	body: IDataspaceProtocolTransferStartMessage;
}
