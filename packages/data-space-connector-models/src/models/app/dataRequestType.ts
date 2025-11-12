// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Data Request Types.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataRequestType = {
	/**
	 * Data Asset Entities
	 */
	DataAssetEntities: "DataAssetEntities",
	/**
	 * Query over a data asset
	 */
	QueryDataAsset: "QueryDataAsset"
};

/**
 * The types.
 */
export type DataRequestType = (typeof DataRequestType)[keyof typeof DataRequestType];
