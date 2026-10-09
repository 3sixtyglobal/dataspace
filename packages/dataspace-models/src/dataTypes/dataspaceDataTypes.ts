// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { DataTypeHelper } from "@3sixty/data-core";
import { JsonLdDataTypes } from "@3sixty/data-json-ld";
import { ActivityStreamsDataTypes } from "@3sixty/standards-w3c-activity-streams";
import * as CompiledValidators from "../compiled/validators.js";
import { DataspaceContexts } from "../models/dataspaceContexts.js";
import { DataspaceTypes } from "../models/dataspaceTypes.js";
import DataspaceActivitySchema from "../schemas/DataspaceActivity.json" with { type: "json" };

/**
 * Dataspace datatypes.
 */
export class DataspaceDataTypes {
	/**
	 * Register all the data types.
	 */
	public static registerTypes(): void {
		// Register the types referenced by the schemas, which are only registered once.
		JsonLdDataTypes.registerTypes();
		ActivityStreamsDataTypes.registerRedirects();
		ActivityStreamsDataTypes.registerTypes();

		const types = [
			{
				type: DataspaceTypes.Activity,
				schema: DataspaceActivitySchema,
				compiledValidator: CompiledValidators.CompiledDataspaceActivity
			}
		];

		DataTypeHelper.registerTypes(
			DataspaceContexts.JsonSchemaNamespace,
			undefined,
			types.map(t => ({
				type: `Dataspace${t.type}`,
				schema: t.schema,
				compiledValidator: t.compiledValidator
			}))
		);
	}
}
