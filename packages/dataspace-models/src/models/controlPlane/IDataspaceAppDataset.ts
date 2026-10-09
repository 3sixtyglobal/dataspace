// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceProtocolDataset } from "@3sixty/standards-dataspace-protocol";

/**
 * Stored dataset record returned by the Control Plane's dataset CRUD surface.
 */
export interface IDataspaceAppDataset {
	/**
	 * The stored dataset id (matches the dataset's JSON-LD `@id`).
	 */
	id: string;

	/**
	 * The dataspace app this dataset belongs to.
	 */
	appId: string;

	/**
	 * The dataset payload.
	 */
	dataset: IDataspaceProtocolDataset;

	/**
	 * Idle window (ms) for this dataset's PULL transfers, overriding the node-level
	 * providerTransferIdleTimeoutMs; 0 disables the idle policy for this dataset.
	 */
	transferIdleTimeoutMs?: number;

	/**
	 * Creation timestamp (ISO string).
	 */
	dateCreated: string;

	/**
	 * Last-modified timestamp (ISO string).
	 */
	dateModified: string;
}
