// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	IDataspaceProtocolTransferProcess,
	IDataspaceProtocolTransferError
} from "@3sixty/standards-dataspace-protocol";
import type { HttpStatusCode } from "@3sixty/web";

/**
 * API response for getting a transfer process state.
 */
export interface IGetTransferProcessResponse {
	/**
	 * Transfer Process (DSP compliant) with current state, or error.
	 */
	body: IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError;

	/**
	 * HTTP status code for the response.
	 */
	statusCode?: HttpStatusCode;
}
