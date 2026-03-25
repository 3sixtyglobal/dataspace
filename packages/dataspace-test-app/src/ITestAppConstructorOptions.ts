// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdDocument } from "@twin.org/data-json-ld";

/**
 * Test App Constructor options.
 */
export interface ITestAppConstructorOptions {
	/**
	 * Logging component type.
	 * @default logging
	 */
	loggingComponentType?: string;

	/**
	 * List of consignment documents to serve.
	 * Can be loaded from a JSON file via the `@json:` env var syntax.
	 * Falls back to built-in default consignments if not provided.
	 */
	consignments?: IJsonLdDocument[];
}
