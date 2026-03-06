// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { DataTypeHelper } from "@twin.org/data-core";
import { ActivityStreamsDataTypes } from "@twin.org/standards-w3c-activity-streams";
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
		ActivityStreamsDataTypes.registerRedirects();
		ActivityStreamsDataTypes.registerTypes();

		const types = [
			{
				type: DataspaceTypes.Activity,
				schema: DataspaceActivitySchema
			}
		];

		DataTypeHelper.registerTypes(
			DataspaceContexts.JsonSchemaNamespace,
			DataspaceContexts.JsonSchemaNamespace,
			types
		);
	}
}
