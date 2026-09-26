// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { DataTypeHelper } from "@twin.org/data-core";
import { JsonLdDataTypes } from "@twin.org/data-json-ld";
import { ActivityStreamsDataTypes } from "@twin.org/standards-w3c-activity-streams";
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
