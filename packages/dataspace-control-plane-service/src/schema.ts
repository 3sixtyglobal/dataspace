// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	DataspaceAppDataset,
	DataspaceAppDatasetV0,
	TransferProcess,
	TransferProcessV0,
	TransferRetrieval
} from "@3sixty/dataspace-models";
import { EntitySchemaFactory, EntitySchemaHelper } from "@3sixty/entity";
import { nameof } from "@3sixty/nameof";

/**
 * Inits schemas for Control Plane entities.
 */
export function initSchema(): void {
	EntitySchemaFactory.register(nameof<TransferProcess>(), () =>
		EntitySchemaHelper.getSchema(TransferProcess)
	);
	EntitySchemaFactory.register(nameof<TransferProcessV0>(), () =>
		EntitySchemaHelper.getSchema(TransferProcessV0)
	);
	EntitySchemaFactory.register(nameof<DataspaceAppDataset>(), () =>
		EntitySchemaHelper.getSchema(DataspaceAppDataset)
	);
	EntitySchemaFactory.register(nameof<DataspaceAppDatasetV0>(), () =>
		EntitySchemaHelper.getSchema(DataspaceAppDatasetV0)
	);
	EntitySchemaFactory.register(nameof<TransferRetrieval>(), () =>
		EntitySchemaHelper.getSchema(TransferRetrieval)
	);
}
