// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceProtocolTransferRequestMessage } from "@3sixty/standards-dataspace-protocol";
import type { HeaderTypes } from "@3sixty/web";

/**
 * API request for requesting a transfer process.
 */
export interface IRequestTransferRequest {
	/**
	 * Authorization header containing the Base64-encoded trust payload.
	 */
	headers: {
		[HeaderTypes.Authorization]: string;
	};

	/**
	 * Transfer request message (DSP compliant).
	 */
	body: IDataspaceProtocolTransferRequestMessage;
}
