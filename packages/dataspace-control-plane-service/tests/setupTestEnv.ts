// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, I18n } from "@twin.org/core";
import {
	DataspaceAppDataset,
	TransferProcess,
	type IDataspaceApp
} from "@twin.org/dataspace-models";
import type { IEngineCore } from "@twin.org/engine-models";
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import { DataspaceProtocolDataTypes } from "@twin.org/standards-dataspace-protocol";
import { addAllContextsToDocumentCache } from "@twin.org/standards-ld-contexts";
import type { ITrustComponent } from "@twin.org/trust-models";
import locales from "../locales/en.json" with { type: "json" };

/**
 * Creates a mock trust component for testing.
 * The mock passes through the trustPayload as the token (simulating a verified Bearer token).
 * The generate method creates a mock JWT token for testing token generation flows.
 *
 * TODO: Consider using real TrustService from @twin.org/trust-service for integration tests.
 * This would require setting up verifiers (e.g., JwtVerifiableCredentialVerifier) and identity infrastructure.
 *
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
	} as unknown as ITrustComponent;
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
	federatedCatalogueComponentType: "test-fedcat",
	trustComponentType: "test-trust",
	transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
	dataspaceAppDatasetEntityStorageType: nameofKebabCase<DataspaceAppDataset>(),
	urlTransformerComponentType: "test-url-transformer",
	config: {
		dataPlanePath: "data-plane/data"
	}
};

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
}

/**
 * Creates a mock Dataspace App for testing.
 * @param datasets The datasets to return from datasetsHandled().
 * @returns A mock IDataspaceApp.
 */
export function createMockDataspaceApp(
	datasets: {
		"@context": unknown;
		"@type": string;
		"@id": string;
		"dcterms:title": string;
		"dcterms:publisher"?: string;
	}[]
): IDataspaceApp {
	return {
		className: () => "MockDataspaceApp",
		datasetsHandled: () => datasets,
		activitiesHandled: () => [],
		supportedQueryTypes: () => []
	} as unknown as IDataspaceApp;
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
