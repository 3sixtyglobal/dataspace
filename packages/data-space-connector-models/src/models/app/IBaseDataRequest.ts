// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataset } from "@twin.org/standards-w3c-dcat";
import type { DataRequestType } from "./dataRequestType.js";

/**
 * Base Data Request interface to represent a data request to a Data Space Connector App
 */
export interface IBaseDataRequest {
	/**
	 * Type of Data Request.
	 */
	type: DataRequestType;

	/**
	 * The data asset we are referring to.
	 */
	dataAsset: IDataset;

	/**
	 * Cursor that points to the next item in the result set.
	 */
	cursor?: string;

	/**
	 * Maximum number of entries retrieved or to be retrieved.
	 */
	limit?: number;
}
