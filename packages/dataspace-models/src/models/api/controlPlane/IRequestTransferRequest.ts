// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceProtocolTransferRequestMessage } from "@twin.org/standards-dataspace-protocol";
import type { HeaderTypes } from "@twin.org/web";

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
