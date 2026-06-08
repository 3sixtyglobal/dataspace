// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { ComponentFactory } from "@twin.org/core";
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import type { IFederatedCatalogueComponent } from "@twin.org/federated-catalogue-models";
import { Dataset, FederatedCatalogueService } from "@twin.org/federated-catalogue-service";
import { nameof } from "@twin.org/nameof";

/**
 * Create a real FederatedCatalogueService with memory storage for integration tests.
 * @param trustComponentType The component factory name for the trust service (default: "trust").
 * @returns Configured FederatedCatalogue service instance and storage connector for inspection.
 */
export function createRealFederatedCatalogue(trustComponentType: string = "trust"): {
	federatedCatalogue: FederatedCatalogueService;
	datasetStorage: MemoryEntityStorageConnector<Dataset>;
} {
	// Create memory storage for datasets
	const datasetStorage = new MemoryEntityStorageConnector<Dataset>({
		entitySchema: nameof<Dataset>()
	});

	// Register the storage connector
	EntityStorageConnectorFactory.register("dataset", () => datasetStorage);

	// Create the real FederatedCatalogue service
	const federatedCatalogue = new FederatedCatalogueService({
		datasetEntityStorageType: "dataset",
		trustComponentType
	});

	return {
		federatedCatalogue,
		datasetStorage
	};
}

/**
 * Register FederatedCatalogue service and schemas for integration tests.
 * Call this in beforeEach or beforeAll of test suites.
 * @param componentName The component name to register (default: "test-fedcat").
 * @param trustComponentType The component factory name for the trust service (default: "trust").
 * @returns The FederatedCatalogue service instance and storage for inspection.
 */
export function setupFederatedCatalogueIntegration(
	componentName: string = "test-fedcat",
	trustComponentType: string = "trust"
): {
	federatedCatalogue: IFederatedCatalogueComponent;
	datasetStorage: MemoryEntityStorageConnector<Dataset>;
} {
	// Register entity schema for Dataset
	EntitySchemaFactory.register(nameof<Dataset>(), () => EntitySchemaHelper.getSchema(Dataset));

	// Create and register the FederatedCatalogue service
	const { federatedCatalogue, datasetStorage } = createRealFederatedCatalogue(trustComponentType);
	ComponentFactory.register(componentName, () => federatedCatalogue);

	return {
		federatedCatalogue,
		datasetStorage
	};
}

/**
 * Cleanup FederatedCatalogue integration test setup.
 * Call this in afterEach to clean up registrations.
 * @param componentName - The component name to unregister (default: "test-fedcat").
 */
export function cleanupFederatedCatalogueIntegration(componentName: string = "test-fedcat"): void {
	ComponentFactory.unregister(componentName);
	EntityStorageConnectorFactory.unregister("dataset");
}
