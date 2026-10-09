// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdContextDefinitionElement } from "@3sixty/data-json-ld";

/**
 * A query over a data asset that to be processed by a Dataspace Data Plane App.
 */
export interface IFilteringQuery {
	/**
	 * The query type.
	 */
	type: string;

	/**
	 * The representation of the query, optional depending on the query type.
	 */
	q?: unknown;

	/**
	 * The JSON-LD context to be applied over the query terms.
	 */
	jsonLdContext?: IJsonLdContextDefinitionElement[];
}
