// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { ComponentFactory } from "@twin.org/core";
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import type { IPolicyAdministrationPointComponent } from "@twin.org/rights-management-models";
import {
	OdrlPolicy,
	PolicyAdministrationPointService
} from "@twin.org/rights-management-pap-service";

/**
 * Create a real PolicyAdministrationPointService with memory storage for integration tests.
 * @returns Configured PAP service instance and storage connector for inspection.
 */
export function createRealPolicyAdministrationPoint(): {
	pap: PolicyAdministrationPointService;
	policyStorage: MemoryEntityStorageConnector<OdrlPolicy>;
} {
	// Create memory storage for policies
	const policyStorage = new MemoryEntityStorageConnector<OdrlPolicy>({
		entitySchema: nameof<OdrlPolicy>(),
		config: { storageKey: "odrl-policy" }
	});

	// Register the storage connector
	EntityStorageConnectorFactory.register("odrl-policy", () => policyStorage);

	// Create the real PAP service
	const pap = new PolicyAdministrationPointService({
		odrlPolicyEntityStorageType: "odrl-policy"
	});

	return {
		pap,
		policyStorage
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
} {
	// Register entity schema for OdrlPolicy
	EntitySchemaFactory.register(nameof<OdrlPolicy>(), () =>
		EntitySchemaHelper.getSchema(OdrlPolicy)
	);

	// Create and register the PAP service
	const { pap, policyStorage } = createRealPolicyAdministrationPoint();
	ComponentFactory.register(componentName, () => pap);

	return {
		pap,
		policyStorage
	};
}

/**
 * Cleanup PAP integration test setup.
 * Call this in afterEach to clean up registrations and clear the shared buffer.
 * @param componentName - The component name to unregister (default: "test-pap").
 */
export async function cleanupPapIntegration(componentName: string = "test-pap"): Promise<void> {
	// Teardown clears SharedObjectBuffer["odrl-policy"] so subsequent tests start with an empty store.
	const tempStorage = new MemoryEntityStorageConnector<OdrlPolicy>({
		entitySchema: nameof<OdrlPolicy>(),
		config: { storageKey: "odrl-policy" }
	});
	await tempStorage.teardown();
	ComponentFactory.unregister(componentName);
	EntityStorageConnectorFactory.unregister("odrl-policy");
}
