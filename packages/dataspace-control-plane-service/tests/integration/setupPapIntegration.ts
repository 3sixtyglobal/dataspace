// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { ComponentFactory } from "@3sixty/core";
import { EntitySchemaFactory, EntitySchemaHelper } from "@3sixty/entity";
import { MemoryEntityStorageConnector } from "@3sixty/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@3sixty/entity-storage-models";
import { nameof } from "@3sixty/nameof";
import type { IPolicyAdministrationPointComponent } from "@3sixty/rights-management-models";
import {
	OdrlPolicy,
	OdrlPolicyIndex,
	PolicyAdministrationPointService
} from "@3sixty/rights-management-pap-service";

/**
 * Create a real PolicyAdministrationPointService with memory storage for integration tests.
 * @returns Configured PAP service instance and storage connectors for inspection.
 */
export function createRealPolicyAdministrationPoint(): {
	pap: PolicyAdministrationPointService;
	policyStorage: MemoryEntityStorageConnector<OdrlPolicy>;
	policyIndexStorage: MemoryEntityStorageConnector<OdrlPolicyIndex>;
} {
	// Create memory storage for policies
	const policyStorage = new MemoryEntityStorageConnector<OdrlPolicy>({
		entitySchema: nameof<OdrlPolicy>(),
		config: { storageKey: "odrl-policy" }
	});

	// Create memory storage for the policy query index
	const policyIndexStorage = new MemoryEntityStorageConnector<OdrlPolicyIndex>({
		entitySchema: nameof<OdrlPolicyIndex>(),
		config: { storageKey: "odrl-policy-index" }
	});

	// Register the storage connectors
	EntityStorageConnectorFactory.register("odrl-policy", () => policyStorage);
	EntityStorageConnectorFactory.register("odrl-policy-index", () => policyIndexStorage);

	// Create the real PAP service
	const pap = new PolicyAdministrationPointService({
		odrlPolicyEntityStorageType: "odrl-policy",
		odrlPolicyIndexEntityStorageType: "odrl-policy-index"
	});

	return {
		pap,
		policyStorage,
		policyIndexStorage
	};
}

/**
 * Register PAP service and schemas for integration tests.
 * Call this in beforeEach or beforeAll of test suites.
 * @param componentName The component name to register (default: "test-pap").
 * @returns The PAP service instance and storage for inspection.
 */
export function setupPapIntegration(componentName: string = "test-pap"): {
	pap: IPolicyAdministrationPointComponent;
	policyStorage: MemoryEntityStorageConnector<OdrlPolicy>;
	policyIndexStorage: MemoryEntityStorageConnector<OdrlPolicyIndex>;
} {
	// Register entity schemas for OdrlPolicy and its query index
	EntitySchemaFactory.register(nameof<OdrlPolicy>(), () =>
		EntitySchemaHelper.getSchema(OdrlPolicy)
	);
	EntitySchemaFactory.register(nameof<OdrlPolicyIndex>(), () =>
		EntitySchemaHelper.getSchema(OdrlPolicyIndex)
	);

	// Create and register the PAP service
	const { pap, policyStorage, policyIndexStorage } = createRealPolicyAdministrationPoint();
	ComponentFactory.register(componentName, () => pap);

	return {
		pap,
		policyStorage,
		policyIndexStorage
	};
}

/**
 * Cleanup PAP integration test setup.
 * Call this in afterEach to clean up registrations and clear the shared buffer.
 * @param componentName - The component name to unregister (default: "test-pap").
 */
export async function cleanupPapIntegration(componentName: string = "test-pap"): Promise<void> {
	// Teardown clears the SharedObjectBuffer entries so subsequent tests start with empty stores.
	const tempStorage = new MemoryEntityStorageConnector<OdrlPolicy>({
		entitySchema: nameof<OdrlPolicy>(),
		config: { storageKey: "odrl-policy" }
	});
	await tempStorage.teardown();
	const tempIndexStorage = new MemoryEntityStorageConnector<OdrlPolicyIndex>({
		entitySchema: nameof<OdrlPolicyIndex>(),
		config: { storageKey: "odrl-policy-index" }
	});
	await tempIndexStorage.teardown();
	ComponentFactory.unregister(componentName);
	EntityStorageConnectorFactory.unregister("odrl-policy");
	EntityStorageConnectorFactory.unregister("odrl-policy-index");
}
