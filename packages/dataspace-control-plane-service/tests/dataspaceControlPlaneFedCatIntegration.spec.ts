// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Integration tests for DataspaceControlPlaneService with real FederatedCatalogue service.
 *
 * This file uses real FederatedCatalogueService with memory storage
 * instead of MockFederatedCatalogueComponent. This validates actual
 * FederatedCatalogue behavior and allows inspection of stored dataset state.
 */

import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory, Is } from "@twin.org/core";
import type { DataspaceAppDataset, TransferProcess } from "@twin.org/dataspace-models";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import type { IFederatedCatalogueComponent } from "@twin.org/federated-catalogue-models";
import type { Dataset } from "@twin.org/federated-catalogue-service";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import type { IPolicyAdministrationPointComponent } from "@twin.org/rights-management-models";
import type { IDataspaceProtocolTransferProcess } from "@twin.org/standards-dataspace-protocol";
import {
	DataspaceProtocolContexts,
	DataspaceProtocolTransferProcessStateType,
	DataspaceProtocolTransferProcessTypes
} from "@twin.org/standards-dataspace-protocol";
import { DublinCoreContexts } from "@twin.org/standards-dublin-core";
import type { IDcatDataset } from "@twin.org/standards-w3c-dcat";
import { DcatClasses, DcatContexts } from "@twin.org/standards-w3c-dcat";
import { OdrlContexts, OdrlPolicyType } from "@twin.org/standards-w3c-odrl";
import { DataspaceControlPlaneService } from "../src/dataspaceControlPlaneService.js";
import {
	cleanupFederatedCatalogueIntegration,
	setupFederatedCatalogueIntegration
} from "./integration/setupFederatedCatalogueIntegration.js";
import { cleanupPapIntegration, setupPapIntegration } from "./integration/setupPapIntegration.js";
import {
	cleanupTrustIntegration,
	setupTrustIntegration
} from "./integration/setupTrustIntegration.js";
import { generateTestJwt } from "./integration/testJwtGenerator.js";
import { MockPolicyNegotiationPointComponent } from "./mocks/mockPolicyNegotiationPoint.js";
import { setupTestEnv } from "./setupTestEnv.js";

describe("DataspaceControlPlaneService - FederatedCatalogue Integration (Real Service)", () => {
	let federatedCatalogue: IFederatedCatalogueComponent;
	let datasetStorage: MemoryEntityStorageConnector<Dataset>;
	let pap: IPolicyAdministrationPointComponent;
	let mockPnp: MockPolicyNegotiationPointComponent;
	let service: DataspaceControlPlaneService;
	let transferProcessStorage: MemoryEntityStorageConnector<TransferProcess>;

	// Test JWT tokens for different identities
	let consumerToken: string;
	let providerToken: string;

	beforeAll(async () => {
		// Setup test environment (schemas, contexts, locales)
		await setupTestEnv();

		// Setup REAL Trust Service with test JWT verifier (Phase 3 COMPLETE!)
		setupTrustIntegration("test-trust");

		// Generate test JWT tokens (async)
		consumerToken = await generateTestJwt("did:iota:consumer-node-abc");
		providerToken = await generateTestJwt("did:iota:provider-node-xyz");
	});

	afterAll(() => {
		// Cleanup Trust Service
		cleanupTrustIntegration("test-trust");
	});

	beforeEach(() => {
		// Setup REAL FederatedCatalogue service with memory storage
		const fedCatSetup = setupFederatedCatalogueIntegration("test-fedcat", "test-trust");
		federatedCatalogue = fedCatSetup.federatedCatalogue;
		datasetStorage = fedCatSetup.datasetStorage;

		// Setup REAL PAP service with memory storage (from Phase 1)
		const papSetup = setupPapIntegration("test-pap");
		pap = papSetup.pap;

		// Setup MOCK PNP
		mockPnp = new MockPolicyNegotiationPointComponent();
		ComponentFactory.register("test-pnp", () => mockPnp);

		// Create fresh transfer process storage for each test
		transferProcessStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>(),
			config: { storageKey: "transfer-process" }
		});

		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferProcess>(),
			() => transferProcessStorage
		);

		EntityStorageConnectorFactory.register(
			nameofKebabCase<DataspaceAppDataset>(),
			() =>
				new MemoryEntityStorageConnector<DataspaceAppDataset>({
					entitySchema: nameof<DataspaceAppDataset>(),
					config: { storageKey: "dataspace-app-dataset" }
				})
		);

		// Create service with REAL FederatedCatalogue, REAL PAP, and mock Trust
		service = new DataspaceControlPlaneService({
			policyAdministrationPointComponentType: "test-pap",
			policyNegotiationPointComponentType: "test-pnp",
			federatedCatalogueComponentType: "test-fedcat",
			trustComponentType: "test-trust",
			transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
			dataspaceAppDatasetEntityStorageType: nameofKebabCase<DataspaceAppDataset>()
		});
	});

	afterEach(async () => {
		// Cleanup integrations
		await cleanupFederatedCatalogueIntegration("test-fedcat");
		await cleanupPapIntegration("test-pap");

		// Cleanup mock PNP and URL transformer
		try {
			ComponentFactory.unregister("test-pnp");
			ComponentFactory.unregister("url-transformer");
		} catch {
			// Ignore errors if already unregistered
		}

		// Cleanup transfer process storage
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<TransferProcess>());
		} catch {
			// Ignore errors if already unregistered
		}

		vi.restoreAllMocks();
	});

	// ============================================================================
	// BASIC DATASET OPERATIONS - Validate Real Service Setup
	// ============================================================================

	test("Should store and retrieve dataset using REAL FederatedCatalogue", async () => {
		// NOTE: Real FederatedCatalogue enforces DS Protocol conformance!
		// Mock allowed incomplete datasets, but real service requires:
		// - dcterms:publisher (REQUIRED - mock didn't have this!)
		// - dcat:distribution with format and accessService (REQUIRED - mock didn't have this!)
		// - odrl:hasPolicy

		const datasetId = "urn:uuid:test-dataset-001";
		const testDataset: IDcatDataset = {
			"@context": {
				dcat: DcatContexts.Namespace,
				dcterms: DublinCoreContexts.NamespaceTerms,
				odrl: OdrlContexts.Namespace
			},
			"@type": DcatClasses.Dataset,
			"@id": datasetId,
			"dcterms:title": "Test Dataset 001",
			"dcterms:publisher": "did:iota:provider-node-xyz", // REQUIRED by real service
			"dcat:distribution": {
				"@type": "dcat:Distribution",
				"dcterms:format": "application/json",
				"dcat:accessService": "https://provider.example.com/api"
			}, // REQUIRED by real service (note: object, not array!)
			"odrl:hasPolicy": {
				"@context": OdrlContexts.JsonLdContext,
				"@type": OdrlPolicyType.Offer,
				"@id": "urn:policy:offer-test-001",
				assigner: "https://example.com/participants/test-publisher",
				permission: [{ action: "use" }]
			}
		} as unknown as IDcatDataset;

		// ContextIdStore.run() sets AsyncLocalStorage context shared across all module instances,
		// including the FederatedCatalogueService which resolves @twin.org/context from its own
		// node_modules. vi.spyOn only patches the local module, so run() is required here.
		await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: "did:iota:provider-node-xyz",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
				[ContextIdKeys.User]: "did:iota:test-user"
			},
			async () => {
				// Act - Store dataset using real service
				await federatedCatalogue.set(testDataset, providerToken);

				// Assert - Verify dataset was stored and retrieved
				const retrieved = await federatedCatalogue.get(datasetId, providerToken);
				expect(retrieved).toBeDefined();
				expect((retrieved as IDcatDataset)["@id"]).toBe(datasetId);

				// NOTE: JSON-LD processing transforms field names:
				// Input: "dcterms:title" -> Output: "dct:title"
				// Input: "dcat:distribution" -> Output: "distribution"
				// This is EXPECTED behavior with real service!
				const retrievedDataset = retrieved as unknown as { [key: string]: unknown };
				expect(retrievedDataset["@type"]).toBe("Dataset");
				expect(retrievedDataset["dct:title"]).toBe("Test Dataset 001");
				expect(retrievedDataset["dct:publisher"]).toBe("did:iota:provider-node-xyz");

				// NEW: Verify we can inspect storage directly
				const allDatasets = await datasetStorage.getStore();
				expect(allDatasets.length).toBe(1);
				// Storage entity has different structure than DCAT dataset
				expect(allDatasets[0].id).toBe(datasetId);
			}
		);
	});

	// ============================================================================
	// TRANSFER WITH DATASET - Integration Test
	// ============================================================================

	test("Should complete transfer flow with REAL FederatedCatalogue - REAL PAP", async () => {
		// Arrange - Create dataset and agreement using REAL services
		const datasetId = "urn:uuid:dataset-integration-001";
		const agreementUrn = "urn:policy:agreement-integration-001";

		// 1. Create dataset in FederatedCatalogue
		const dataset: IDcatDataset = {
			"@context": {
				dcat: DcatContexts.Namespace,
				dcterms: DublinCoreContexts.NamespaceTerms,
				odrl: OdrlContexts.Namespace
			},
			"@type": DcatClasses.Dataset,
			"@id": datasetId,
			"dcterms:title": "Integration Test Dataset",
			"dcterms:publisher": "did:iota:provider-node-xyz",
			"dcat:distribution": {
				"@type": "dcat:Distribution",
				"dcterms:format": "application/json",
				"dcat:accessService": "https://provider.example.com/api"
			},
			"odrl:hasPolicy": {
				"@context": OdrlContexts.JsonLdContext,
				"@type": OdrlPolicyType.Offer,
				"@id": agreementUrn, // Offer and Agreement share same UID (agreement derived from offer)
				assigner: "https://example.com/participants/test-publisher",
				permission: [{ action: "use" }]
			}
		} as unknown as IDcatDataset;

		await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: "did:iota:provider-node-xyz",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
				[ContextIdKeys.User]: "did:iota:test-user"
			},
			async () => {
				await federatedCatalogue.set(dataset, providerToken);

				// 2. Create agreement in PAP (UID matches the offer UID)
				await pap.create({
					"@context": "http://www.w3.org/ns/odrl.jsonld",
					"@type": "Agreement",
					"@id": agreementUrn,
					assigner: "did:iota:provider-node-xyz",
					assignee: "did:iota:consumer-node-abc",
					target: datasetId,
					permission: [{ action: "read" }]
				});

				// Act - Request transfer
				const result = await service.requestTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferRequestMessage",
						agreementId: agreementUrn,
						consumerPid: "consumer-pid-integration-001",
						callbackAddress: "https://consumer.example.com/callback",
						format: "application/json"
					},
					consumerToken // Real JWT token with consumer identity
				);

				// Assert DSP response
				if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
					console.log("Transfer error:", JSON.stringify(result, null, 2));
				}
				expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
				const transferProcess = result as IDataspaceProtocolTransferProcess;
				expect(transferProcess.consumerPid).toBe("consumer-pid-integration-001");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);

				// Verify context resolution includes dataset ID
				const context = await service.resolveConsumerPid(
					"consumer-pid-integration-001",
					consumerToken // Real JWT token with consumer identity
				);
				// datasetId is now the full URN (DCAT-compliant, not parsed)
				expect(context.datasetId).toBe("urn:uuid:dataset-integration-001");

				// NEW: Verify dataset still in storage (not modified by transfer)
				const retrievedDataset = await federatedCatalogue.get(datasetId, providerToken);
				expect((retrievedDataset as IDcatDataset)["@id"]).toBe(datasetId);

				// NEW: Verify storage state
				const allDatasets = await datasetStorage.getStore();
				expect(allDatasets.length).toBe(1);
			}
		);
	});

	// ============================================================================
	// CATALOG VALIDATION TESTS - Migrated from mock-based tests
	// ============================================================================

	test("Should validate dataset exists in catalog during transfer initiation - REAL Services", async () => {
		// Arrange - Create dataset in REAL FederatedCatalogue
		const datasetId = "urn:uuid:valid-dataset-catalog-001";
		const policyUrn = "urn:policy:catalog-001"; // Same UID for both offer and agreement

		const dataset: IDcatDataset = {
			"@context": {
				dcat: DcatContexts.Namespace,
				dcterms: DublinCoreContexts.NamespaceTerms,
				odrl: OdrlContexts.Namespace
			},
			"@type": DcatClasses.Dataset,
			"@id": datasetId,
			"dcterms:title": "Valid Catalog Dataset",
			"dcterms:publisher": "did:iota:provider-node-xyz",
			"dcat:distribution": {
				"@type": "dcat:Distribution",
				"dcterms:format": "application/json",
				"dcat:accessService": "https://provider.example.com/api"
			},
			"odrl:hasPolicy": {
				"@context": OdrlContexts.JsonLdContext,
				"@type": OdrlPolicyType.Offer,
				"@id": policyUrn, // Offer UID
				assigner: "https://example.com/participants/test-publisher",
				permission: [{ action: "use" }]
			}
		} as unknown as IDcatDataset;

		await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: "did:iota:provider-node-xyz",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
				[ContextIdKeys.User]: "did:iota:test-user"
			},
			async () => {
				await federatedCatalogue.set(dataset, providerToken);

				// Create matching agreement in REAL PAP (same UID as offer)
				await pap.create({
					"@context": "http://www.w3.org/ns/odrl.jsonld",
					"@type": "Agreement",
					"@id": policyUrn, // Agreement UID matches offer UID

					assignee: "did:iota:consumer-node-abc",
					assigner: "did:iota:provider-node-xyz",
					target: datasetId,
					permission: [{ action: "use" }]
				});

				// Act - Request transfer
				const result = await service.requestTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferRequestMessage",
						consumerPid: "consumer-pid-catalog-test",
						agreementId: policyUrn,
						callbackAddress: "https://callback.example.com",
						format: "application/json"
					},
					consumerToken // Real JWT token with consumer identity
				);

				// Assert - Transfer should succeed (dataset found in catalog)
				expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
				const transferProcess = result as IDataspaceProtocolTransferProcess;
				expect(transferProcess.consumerPid).toBe("consumer-pid-catalog-test");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);

				// NEW: Verify dataset lookup occurred (dataset still in storage)
				const retrievedDataset = await federatedCatalogue.get(datasetId, providerToken);
				expect((retrievedDataset as IDcatDataset)["@id"]).toBe(datasetId);
			}
		);
	});

	test("Should return TransferError if dataset not in catalog - REAL Services", async () => {
		// Arrange - Create agreement in REAL PAP for non-existent dataset
		const missingDatasetId = "urn:uuid:missing-dataset-456";
		const agreementUrn = "urn:policy:agreement-missing-dataset";

		await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: "did:iota:provider-node-xyz",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
				[ContextIdKeys.User]: "did:iota:test-user"
			},
			async () => {
				await pap.create({
					"@context": "http://www.w3.org/ns/odrl.jsonld",
					"@type": "Agreement",
					"@id": agreementUrn,

					assignee: "did:iota:consumer-node-abc",
					assigner: "did:iota:provider-node-xyz",
					target: missingDatasetId, // Dataset NOT in catalog
					permission: [{ action: "use" }]
				});

				// Act - Request transfer for missing dataset
				const result = await service.requestTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferRequestMessage",
						consumerPid: "consumer-pid-missing-dataset",
						agreementId: agreementUrn,
						callbackAddress: "https://callback.example.com",
						format: "application/json"
					},
					consumerToken // Real JWT token with consumer identity
				);

				// Assert - Should return DSP-compliant TransferError
				expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
				const transferError = result as unknown as { [key: string]: unknown };
				expect(transferError.code).toMatch(/^NotFoundError:/);
				expect(transferError.consumerPid).toBe("consumer-pid-missing-dataset");
				expect(transferError.providerPid).toBeDefined();
				expect(transferError.reason).toBeDefined();
				expect(Is.array(transferError.reason)).toBe(true);

				// Verify error contains expected message
				const reason = transferError.reason as unknown[];
				if (reason && reason.length > 0) {
					const firstError = reason[0] as { name?: string; message?: string };
					expect(firstError.name).toBe("NotFoundError");
					expect(firstError.message).toContain("datasetNotInCatalog");
				}

				// NEW: Verify catalog is actually empty (no datasets stored)
				const allDatasets = await datasetStorage.getStore();
				expect(allDatasets.length).toBe(0);
			}
		);
	});

	test("Should return TransferError if Agreement doesn't match Catalog Offer - REAL Services", async () => {
		// NOTE: This test now works! Service updated to handle JSON-LD transformations
		// (`uid` → `@id`) using extractPolicyUid() helper method.
		//
		// Test validates that when agreement UID doesn't match ANY offer UID in catalog,
		// transfer is rejected with proper error.

		// Arrange - Create dataset with specific offer in REAL FederatedCatalogue
		const datasetId = "urn:uuid:dataset-mismatch-789";
		const offerUrn = "urn:policy:offer-mismatch-789";
		const agreementUrn = "urn:policy:agreement-DIFFERENT-789"; // Different UID!

		const dataset: IDcatDataset = {
			"@context": {
				dcat: DcatContexts.Namespace,
				dcterms: DublinCoreContexts.NamespaceTerms,
				odrl: OdrlContexts.Namespace
			},
			"@type": DcatClasses.Dataset,
			"@id": datasetId,
			"dcterms:title": "Mismatch Test Dataset",
			"dcterms:publisher": "did:iota:provider-node-xyz",
			"dcat:distribution": {
				"@type": "dcat:Distribution",
				"dcterms:format": "application/json",
				"dcat:accessService": "https://provider.example.com/api"
			},
			"odrl:hasPolicy": {
				"@context": OdrlContexts.JsonLdContext,
				"@type": OdrlPolicyType.Offer,
				"@id": offerUrn, // Offer has UID "offer-mismatch-789"
				assigner: "did:iota:different-provider",
				permission: [{ action: "use" }]
			}
		} as unknown as IDcatDataset;

		await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: "did:iota:provider-node-xyz",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
				[ContextIdKeys.User]: "did:iota:test-user"
			},
			async () => {
				await federatedCatalogue.set(dataset, providerToken);

				// Create agreement with DIFFERENT UID in REAL PAP (UID doesn't match offer)
				await pap.create({
					"@context": "http://www.w3.org/ns/odrl.jsonld",
					"@type": "Agreement",
					"@id": agreementUrn, // Agreement UID "agreement-DIFFERENT-789" != Offer UID!

					assignee: "did:iota:consumer-node-abc",
					assigner: "did:iota:provider-node-xyz",
					target: datasetId,
					permission: [{ action: "use" }]
				});

				// Act - Request transfer with mismatched agreement
				const result = await service.requestTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferRequestMessage",
						consumerPid: "consumer-pid-mismatch",
						agreementId: agreementUrn,
						callbackAddress: "https://callback.example.com",
						format: "application/json"
					},
					consumerToken // Real JWT token with consumer identity
				);

				// Assert - Should return TransferError with specific error
				expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
				const transferError = result as unknown as { [key: string]: unknown };
				expect(transferError.code).toMatch(/GeneralError:/);
				expect(transferError.reason).toBeDefined();

				// Verify error message indicates agreement/offer mismatch
				const reason = transferError.reason as unknown[];
				if (reason && reason.length > 0) {
					const firstError = reason[0] as { message?: string };
					expect(firstError.message).toContain("agreementNotMatchingOffer");
				}

				// NEW: Verify dataset exists but validation failed
				const retrievedDataset = await federatedCatalogue.get(datasetId, providerToken);
				expect((retrievedDataset as IDcatDataset)["@id"]).toBe(datasetId);
				expect((await datasetStorage.getStore()).length).toBe(1);
			}
		);
	});
});
