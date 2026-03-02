// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	IDataspaceProtocolTransferStartMessage,
	IDataspaceProtocolTransferError
} from "@twin.org/standards-dataspace-protocol";
import type { HttpStatusCode } from "@twin.org/web";

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
