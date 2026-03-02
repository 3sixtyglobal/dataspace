// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceProtocolDataset } from "@twin.org/standards-dataspace-protocol";
import type { IEntitySet } from "../IEntitySet.js";
import type { DataRequestType } from "./dataRequestType.js";

/**
 * Data Request type for representing data requests received by Dataspace Apps.
 */
export interface IDataAssetEntitiesRequest {
	/**
	 * Data Asset Entities type.
	 */
	type: typeof DataRequestType.DataAssetEntities;

	/**
	 * The data asset we are referring to.
	 */
	dataAsset: IDataspaceProtocolDataset;

	/**
	 * The entity set.
	 * */
	entitySet: IEntitySet;
}
