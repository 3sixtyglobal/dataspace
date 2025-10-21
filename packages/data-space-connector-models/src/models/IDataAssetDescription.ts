// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The description of a Data Asset
 */
export interface IDataAssetDescription {
	/**
	 * The data Service Id
	 */
	dataServiceId?: string;

	/**
	 * The concerned datasets.
	 */
	dataSetId?: string[];
}
