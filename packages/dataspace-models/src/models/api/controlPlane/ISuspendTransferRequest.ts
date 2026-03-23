// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceProtocolTransferSuspensionMessage } from "@twin.org/standards-dataspace-protocol";
import type { HeaderTypes } from "@twin.org/web";

/**
 * API request for suspending a transfer process.
 */
export interface ISuspendTransferRequest {
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
	 * Transfer suspension message (DSP compliant).
	 */
	body: IDataspaceProtocolTransferSuspensionMessage;
}
