// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceAppDataset } from "../../controlPlane/IDataspaceAppDataset.js";

/**
 * API response for a single stored app dataset record.
 */
export interface IAppDatasetGetResponse {
	/**
	 * The body of the response.
	 */
	body: IDataspaceAppDataset;
}
