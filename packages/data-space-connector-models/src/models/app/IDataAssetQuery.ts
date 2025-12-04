// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Data Asset query for internal service matching of datasets to apps.
 *
 * This interface is used internally by the Data Space Connector service to match
 * datasets with their corresponding apps. Apps should use `datasetsHandled(): IDataset[]`
 * to declare which datasets they handle.
 *
 * @see IDataSpaceConnectorApp.datasetsHandled
 */
export interface IDataAssetQuery {
	/**
	 * Id of the dataset in the Federated Catalogue (dataset @id).
	 */
	datasetId: string;
}
