// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdContextDefinitionElement } from "@twin.org/data-json-ld";

/**
 * A query over a data asset that to be processed by a DS Connector App.
 */
export interface IFilteringQuery {
	/**
	 * The query type.
	 */
	type: string;

	/**
	 * The representation of the query.
	 */
	q: unknown;

	/**
	 * The JSON-LD context to be applied over the query terms.
	 */
	jsonLdContext?: IJsonLdContextDefinitionElement[];
}
