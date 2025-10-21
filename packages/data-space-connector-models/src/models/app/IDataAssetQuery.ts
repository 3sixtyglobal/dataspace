// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Data Asset query for denoting the data assets that can be incarnated by this app.
 * In the future other query conditions might be added. Initially only "data service Id".
 */
export interface IDataAssetQuery {
	/**
	 * Id of the data Service in the Federated Catalogue.
	 */
	serviceId: string;
}
