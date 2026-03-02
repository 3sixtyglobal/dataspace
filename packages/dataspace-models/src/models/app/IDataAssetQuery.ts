// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Data Asset query for internal service matching of datasets to apps.
 *
 * This interface is used internally by the Dataspace Data Plane service to match
 * datasets with their corresponding apps. Apps should use `datasetsHandled(): IDataset[]`
 * to declare which datasets they handle.
 *
 * @see IDataspaceDataPlaneApp.datasetsHandled
 */
export interface IDataAssetQuery {
	/**
	 * Id of the dataset in the Catalogue (dataset @id).
	 */
	datasetId: string;
}
