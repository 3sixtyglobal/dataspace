// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	IDataspaceProtocolTransferProcess,
	IDataspaceProtocolTransferError
} from "@3sixty/standards-dataspace-protocol";
import type { HttpStatusCode } from "@3sixty/web";

/**
 * API response for requesting a transfer process.
 */
export interface IRequestTransferResponse {
	/**
	 * Transfer Process (DSP compliant) with state REQUESTED, or error.
	 */
	body: IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError;

	/**
	 * HTTP status code for the response.
	 */
	statusCode?: HttpStatusCode;
}
