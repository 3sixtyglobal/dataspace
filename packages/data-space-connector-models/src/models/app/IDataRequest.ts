// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataAssetEntitiesRequest } from "./IDataAssetEntitiesRequest.js";
import type { IQueryDataAssetRequest } from "./IQueryDataAssetRequest.js";

/**
 * Data Request type for representing data requests received by DS Connector Apps.
 */
export type IDataRequest = IDataAssetEntitiesRequest | IQueryDataAssetRequest;
