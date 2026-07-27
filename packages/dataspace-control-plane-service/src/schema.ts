// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	DataspaceAppDataset,
	DataspaceAppDatasetV0,
	TransferProcess,
	TransferRetrieval
} from "@twin.org/dataspace-models";
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { nameof } from "@twin.org/nameof";

/**
 * Inits schemas for Control Plane entities.
 */
export function initSchema(): void {
	EntitySchemaFactory.register(nameof<TransferProcess>(), () =>
		EntitySchemaHelper.getSchema(TransferProcess)
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
