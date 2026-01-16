// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { SchemaOrgContexts, SchemaOrgTypes } from "@twin.org/standards-schema-org";

/**
 * Interface describing a list of entities that are within a Data Asset.
 * Pagination is handled via HTTP Link headers.
 */
export interface IDataAssetItemList {
	/**
	 * The LD Context.
	 */
	"@context": typeof SchemaOrgContexts.Namespace;

	/**
	 * The type
	 */
	type: typeof SchemaOrgTypes.ItemList;

	/**
	 * The components of the Collection
	 *
	 */
	[SchemaOrgTypes.ItemListElement]: IJsonLdNodeObject[];
}
