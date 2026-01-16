// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataAssetItemList } from "./IDataAssetItemList.js";

/**
 * Result containing the data asset item list and optional pagination cursor.
 * The cursor is returned via HTTP Link headers (RFC 8288), not in the response body.
 */
export interface IDataAssetItemListResult {
	/**
	 * The item list data.
	 */
	itemList: IDataAssetItemList;

	/**
	 * Pagination cursor for retrieving the next page.
	 * This is used to generate the Link header, not included in the response body.
	 */
	cursor?: string;
}
