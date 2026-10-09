// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceProtocolVersionResponse } from "@3sixty/standards-dataspace-protocol";

/**
 * API response for the DSP version discovery endpoint.
 */
export interface IGetProtocolVersionsResponse {
	/**
	 * The list of Dataspace Protocol versions supported by this connector.
	 */
	body: IDataspaceProtocolVersionResponse;
}
