// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IDataAssetItemList } from "../IDataAssetItemList";

/**
 * Service Offering response
 */
export interface IDataAssetEntitiesResponse {
	/**
	 * The response payload.
	 */
	body: IDataAssetItemList;
}
