// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	IDataResourceEntry,
	IServiceOfferingEntry
} from "@twin.org/federated-catalogue-models";
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
	dataAsset: {
		/**
		 * The data service component of the data asset.
		 */
		dataService: IServiceOfferingEntry;
		/**
		 * The dataset components of the data asset.
		 */
		dataset: IDataResourceEntry[];
	};

	/**
	 * Cursor that points to the next item in the result set.
	 */
	cursor?: string;

	/**
	 * Maximum number of entries retrieved or to be retrieved.
	 */
	limit?: number;
}
