// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	IDataspaceProtocolTransferStartMessage,
	IDataspaceProtocolTransferError
} from "@3sixty/standards-dataspace-protocol";
import type { HttpStatusCode } from "@3sixty/web";

/**
 * API response for starting a transfer process.
 */
export interface IStartTransferResponse {
	/**
	 * Transfer Start Message (DSP compliant) with dataAddress for PULL transfers, or error.
	 */
	body: IDataspaceProtocolTransferStartMessage | IDataspaceProtocolTransferError;

	/**
	 * HTTP status code for the response.
	 */
	statusCode?: HttpStatusCode;
}
