// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IPlatformComponent } from "@twin.org/api-models";
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { Converter, ComponentFactory, I18n } from "@twin.org/core";
import {
	DataspaceAppDataset,
	TransferProcess,
	TransferRetrieval,
	type IDataspaceDataPlaneComponent
} from "@twin.org/dataspace-models";
import type { IEngineCore } from "@twin.org/engine-models";
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import { DataspaceProtocolDataTypes } from "@twin.org/standards-dataspace-protocol";
import { addAllContextsToDocumentCache } from "@twin.org/standards-ld-contexts";
import type { ITrustComponent } from "@twin.org/trust-models";
import { vi } from "vitest";
import { MockPolicyNegotiationAdminPointComponent } from "./mocks/mockPolicyNegotiationAdminPoint.js";
import locales from "../locales/en.json" with { type: "json" };

/**
 * Creates a mock trust component for testing.
 * The mock passes through the trustPayload as the token (simulating a verified Bearer token).
 * The generate method creates a mock JWT token for testing token generation flows.
 * @param identity The identity to return from the trust component.
 * @returns A mock ITrustComponent for testing.
 */
export function createMockTrustComponent(
	identity: string = "did:iota:consumer-node-abc"
): ITrustComponent {
	return {
		className: () => "MockTrustComponent",
		verify: async (payload: unknown) => ({
			verified: true,
			info: {
				// Passthrough: the payload is the Bearer token string
				token: payload as string,
				identity
			}
		}),
		generate: async (
			issuerIdentity: string,
			generatorType?: string,
			options?: { subject?: unknown }
		) => {
			// Generate a mock JWT-like token that includes the subject claims
			// In real usage, this would be a signed JWT Verifiable Credential
			const subject = options?.subject ?? {};
			const payload = {
				iss: issuerIdentity,
				sub: subject,
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
			};
			// Return a base64-encoded mock token (simulating JWT structure)
			const payloadBytes = Converter.utf8ToBytes(JSON.stringify(payload));
			const payloadBase64 = Converter.bytesToBase64(payloadBytes);
			return `mock-jwt.${payloadBase64}.mock-signature`;
		}
	};
}

/**
 * Creates a mock trust component that fails verification.
 * Used for testing trust verification failure scenarios.
 *
 * TODO: Consider using real TrustService with invalid/expired tokens for integration tests.
 *
 * @returns A mock ITrustComponent that always returns verified: false.
 */
export function createFailingMockTrustComponent(): ITrustComponent {
	return {
		className: () => "MockFailingTrustComponent",
		verify: async () => ({
			verified: false,
			info: undefined
		})
	} as unknown as ITrustComponent;
}

/**
 * Default service options for tests.
 * Provides consistent configuration across test files.
 * Note: transferProcessEntityStorageType must match the storage registered in beforeEach().
 */
export const DEFAULT_SERVICE_OPTIONS = {
	policyAdministrationPointComponentType: "test-pap",
	policyNegotiationPointComponentType: "test-pnp",
	policyNegotiationAdminPointComponentType: "test-pnap-admin",
	federatedCatalogueComponentType: "test-fedcat",
	trustComponentType: "test-trust",
	transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
	dataspaceAppDatasetEntityStorageType: nameofKebabCase<DataspaceAppDataset>(),
	config: {
		dataPlanePath: "data-plane/data"
	}
};

/**
 * Creates a mock IDataspaceDataPlaneComponent with vi.fn() stubs.
 * Register this under a component type name before constructing DataspaceControlPlaneService,
 * since the service now requires the component via ComponentFactory.get().
 * @returns A mock IDataspaceDataPlaneComponent.
 */
export function createMockDataspaceDataPlaneComponent(): IDataspaceDataPlaneComponent {
	return {
		className: () => "MockDataspaceDataPlaneComponent",
		setupPushSubscription: vi.fn().mockResolvedValue(undefined),
		resumePushSubscription: vi.fn().mockResolvedValue(undefined),
		suspendPushSubscription: vi.fn().mockResolvedValue(undefined),
		teardownPushSubscription: vi.fn().mockResolvedValue(undefined),
		getDataAssetEntities: vi.fn().mockResolvedValue({ itemList: [] }),
		queryDataAsset: vi.fn().mockResolvedValue({ itemList: [] }),
		notifyActivity: vi.fn().mockResolvedValue("mock-activity-id"),
		subscribeToActivityLog: vi.fn().mockResolvedValue("mock-sub-id"),
		unSubscribeToActivityLog: vi.fn().mockResolvedValue(undefined),
		processOutboxActivity: vi.fn().mockResolvedValue(undefined),
		getActivityLogEntry: vi.fn().mockResolvedValue(undefined)
	};
}

/**
 * Setup the test environment for Dataspace Control Plane Service tests.
 * Registers schemas, contexts, and locales required for all tests.
 * Call this in beforeAll() of test suites.
 */
export async function setupTestEnv(): Promise<void> {
	// Register DSP schemas and contexts
	DataspaceProtocolDataTypes.registerTypes();
	await addAllContextsToDocumentCache();

	// Setup I18n
	I18n.addDictionary("en", locales);
	I18n.setLocale("en");

	// Register TransferProcess schema for entity storage
	EntitySchemaFactory.register(nameof<TransferProcess>(), () =>
		EntitySchemaHelper.getSchema(TransferProcess)
	);

	EntitySchemaFactory.register(nameof<DataspaceAppDataset>(), () =>
		EntitySchemaHelper.getSchema(DataspaceAppDataset)
	);

	EntitySchemaFactory.register(nameof<TransferRetrieval>(), () =>
		EntitySchemaHelper.getSchema(TransferRetrieval)
	);

	// Register a default single-tenant platform component. Tests that need
	// multi-tenant behaviour register their own under a separate key.
	ComponentFactory.register("platform", () => createSingleTenantPlatformComponent());

	// Register a default mock data plane component so all test suites can construct
	// DataspaceControlPlaneService without specifying dataPlaneComponentType.
	ComponentFactory.register("dataspace-data-plane-service", () =>
		createMockDataspaceDataPlaneComponent()
	);

	// Register a default mock PNAP admin component so all test suites can construct
	// DataspaceControlPlaneService without specifying policyNegotiationAdminPointComponentType.
	// PNAP is now required (get vs getIfExists), so a default must always be present.
	ComponentFactory.register(
		"policy-negotiation-admin-point",
		() => new MockPolicyNegotiationAdminPointComponent()
	);
}

/**
 * Creates a mock Engine Core for testing.
 * @param isClone Whether this engine is a clone.
 * @returns A mock IEngineCore.
 */
export function createMockEngineCore(isClone: boolean = false): IEngineCore {
	return {
		className: () => "MockEngineCore",
		isClone: () => isClone
	} as unknown as IEngineCore;
}

/**
 * Creates a single-tenant platform component mock.
 * execute() runs the callback once in the current context.
 * getLocalOriginContext() returns a local context whose Organization is
 * `localOriginOrg` when provided (i.e. the URL is treated as local to that org),
 * otherwise undefined (no URL is treated as local).
 * @param localOriginOrg When set, getLocalOriginContext resolves any URL to a
 * local context with this Organization; used to exercise the same-org implicit-trust path.
 * @returns A mock IPlatformComponent for single-tenant mode.
 */
export function createSingleTenantPlatformComponent(localOriginOrg?: string): IPlatformComponent {
	const localContext = localOriginOrg
		? { [ContextIdKeys.Organization]: localOriginOrg }
		: undefined;
	return {
		className: () => "MockSingleTenantPlatformComponent",
		isMultiTenant: () => false,
		execute: async (method: () => Promise<void>) => {
			await method();
		},
		getLocalOriginContext: async () => localContext
	};
}

/**
 * Creates a multi-tenant platform component mock.
 * execute() iterates the given tenant identities, injecting each as
 * ContextIdKeys.Tenant into the async context before invoking the callback.
 * This mirrors the production behaviour where the tenant component iterates
 * every registered tenant and wraps execution in its context.
 * isLocalOrigin() always returns false (no URL is treated as local by default).
 * @param tenants Array of tenant context objects to iterate.
 * @returns A mock IPlatformComponent for multi-tenant mode.
 */
export function createMultiTenantPlatformComponent(
	tenants: { [key: string]: string }[]
): IPlatformComponent {
	return {
		className: () => "MockMultiTenantPlatformComponent",
		isMultiTenant: () => true,
		execute: async (method: () => Promise<void>) => {
			const baseContextIds = (await ContextIdStore.getContextIds()) ?? {};
			for (const tenantContextIds of tenants) {
				await ContextIdStore.run({ ...baseContextIds, ...tenantContextIds }, method);
			}
		},
		getLocalOriginContext: async () => undefined
	};
}
