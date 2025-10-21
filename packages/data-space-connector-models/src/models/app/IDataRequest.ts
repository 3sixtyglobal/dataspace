// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IFilteringQuery } from "../IFilteringQuery";
import type { IBaseDataRequest } from "./IBaseDataRequest";
import type { IEntitySet } from "../IEntitySet";

/**
 * Data Request type for representing data requests received by DS Connector Apps.
 */
export type IDataRequest = IBaseDataRequest &
	(
		| {
				/**
				 * Data Asset Entities type.
				 */
				type: "DataAssetEntities";

				/**
				 * The entity set.
				 * */
				entitySet: IEntitySet;
		  }
		| {
				/**
				 * Data Asset query type.
				 */
				type: "QueryDataAsset";
				/**
				 * Query to perform filtering.
				 */
				query: IFilteringQuery;
		  }
	);
