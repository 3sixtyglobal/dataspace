// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceProtocolDataset } from "@3sixty/standards-dataspace-protocol";

/**
 * API request to register an app dataset.
 *
 * The owning `tenantId` is captured automatically from the request's tenant
 * context - callers do not supply it.
 */
export interface IAppDatasetCreateRequest {
	/**
	 * The body of the request.
	 */
	body: {
		/**
		 * Optional explicit id for the stored dataset record. If omitted, the
		 * Control Plane derives the id from `dataset["@id"]` if present, or
		 * generates a UUID otherwise. The resolved id is returned via the
		 * `Location` response header.
		 */
		id?: string;

		/**
		 * The dataspace app this dataset belongs to. Matches the app's
		 * registered name in `DataspaceAppFactory` (typically the app's URI).
		 */
		appId: string;

		/**
		 * The dataset payload. System-stamped fields like `dcterms:publisher`
		 * may be omitted - the Control Plane fills them in at publish time.
		 */
		dataset: IDataspaceProtocolDataset;

		/**
		 * Optional idle window (ms) overriding the node-level idle policy for this
		 * dataset's PULL transfers; 0 disables it for this dataset.
		 */
		transferIdleTimeoutMs?: number;
	};
}
