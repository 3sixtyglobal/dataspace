// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonSchema } from "@twin.org/data-core";
import { DataTypeHandlerFactory } from "@twin.org/data-core";
import DsProtocolDatasetSchema from "../schemas/DsProtocolDataset.json" with { type: "json" };

/**
 * Class providing Data Space Protocol data type utilities and schema registration.
 */
export class DsProtocolDataTypes {
	/**
	 * Context root for Data Space Protocol schemas.
	 */
	private static readonly _CONTEXT_ROOT = "https://schema.twindev.org/data-space-connector/";

	/**
	 * Register all the Data Space Protocol data types with their JSON schemas.
	 */
	public static registerTypes(): void {
		DataTypeHandlerFactory.register(
			`${DsProtocolDataTypes._CONTEXT_ROOT}DsProtocolDataset`,
			() => ({
				context: DsProtocolDataTypes._CONTEXT_ROOT,
				type: "DsProtocolDataset",
				jsonSchema: async () => DsProtocolDatasetSchema as IJsonSchema
			})
		);
	}
}
