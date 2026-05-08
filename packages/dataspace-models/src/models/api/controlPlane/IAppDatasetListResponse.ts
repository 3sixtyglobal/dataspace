// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceAppDataset } from "../../controlPlane/IDataspaceAppDataset.js";

/**
 * API response listing the app datasets owned by the calling tenant.
 */
export interface IAppDatasetListResponse {
	/**
	 * The body of the response.
	 */
	body: {
		/**
		 * The stored datasets.
		 */
		entities: IDataspaceAppDataset[];

		/**
		 * Cursor to fetch the next page if more entries exist.
		 */
		cursor?: string;
	};
}
