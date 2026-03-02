// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ITransferContext } from "../ITransferContext.js";

/**
 * Transfer Context Response (INTERNAL API for DSC).
 * This is NOT part of the DSP protocol - it's a TWIN internal API
 * used by dataspace-control-plane to resolve consumerPid to datasetId and policies.
 */
export interface ITransferContextResponse {
	/**
	 * Request body
	 */
	body: ITransferContext;
}
