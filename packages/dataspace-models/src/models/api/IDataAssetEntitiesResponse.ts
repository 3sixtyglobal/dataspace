// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes } from "@twin.org/web";
import type { IDataAssetItemList } from "../IDataAssetItemList.js";

/**
 * Response containing data asset entities with optional pagination Link header.
 */
export interface IDataAssetEntitiesResponse {
	/**
	 * Optional headers.
	 */
	headers?: {
		[HeaderTypes.Link]?: string | string[];
	};

	/**
	 * The response payload.
	 */
	body: IDataAssetItemList;
}
