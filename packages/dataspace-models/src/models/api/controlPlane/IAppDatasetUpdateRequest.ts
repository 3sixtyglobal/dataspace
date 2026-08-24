// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceProtocolDataset } from "@twin.org/standards-dataspace-protocol";

/**
 * API request to update an existing app dataset record.
 */
export interface IAppDatasetUpdateRequest {
	/**
	 * Path parameters containing the stored app dataset id.
	 */
	pathParams: {
		/**
		 * The stored app dataset id.
		 */
		id: string;
	};

	/**
	 * The body of the request.
	 */
	body: {
		/**
		 * The dataspace app this dataset belongs to. May change appId on
		 * update if the tenant wants to retarget the dataset.
		 */
		appId: string;

		/**
		 * The dataset payload.
		 */
		dataset: IDataspaceProtocolDataset;

		/**
		 * Optional idle window (ms) overriding the node-level idle policy for this
		 * dataset's PULL transfers; 0 disables it for this dataset.
		 */
		transferIdleTimeoutMs?: number;
	};
}
