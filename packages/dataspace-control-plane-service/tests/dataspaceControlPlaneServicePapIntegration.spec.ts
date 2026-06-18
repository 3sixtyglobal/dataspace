// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Integration tests for DataspaceControlPlaneService with real PAP service.
 *
 * This file uses real PolicyAdministrationPointService with memory storage
 * instead of MockPolicyAdministrationPointComponent. This validates actual
 * PAP behavior and allows inspection of stored policy state.
 */

import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory, Is } from "@twin.org/core";
import type { DataspaceAppDataset, TransferProcess } from "@twin.org/dataspace-models";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import type { IPolicyAdministrationPointComponent } from "@twin.org/rights-management-models";
import type { OdrlPolicy } from "@twin.org/rights-management-pap-service";
import {
	DataspaceProtocolContexts,
	DataspaceProtocolTransferProcessStateType,
	DataspaceProtocolTransferProcessTypes,
	type IDataspaceProtocolTransferError,
	type IDataspaceProtocolTransferProcess,
	type IDataspaceProtocolAgreement
} from "@twin.org/standards-dataspace-protocol";
import { OdrlContexts } from "@twin.org/standards-w3c-odrl";
import { DataspaceControlPlaneService } from "../src/dataspaceControlPlaneService.js";
import { cleanupPapIntegration, setupPapIntegration } from "./integration/setupPapIntegration.js";
import { MockFederatedCatalogueComponent } from "./mocks/mockFederatedCatalogue.js";
import { MockPolicyNegotiationPointComponent } from "./mocks/mockPolicyNegotiationPoint.js";
import { createMockTrustComponent, setupTestEnv } from "./setupTestEnv.js";
describe("DataspaceControlPlaneService - PAP Integration (Real Service)", () => {
	let pap: IPolicyAdministrationPointComponent;
	let policyStorage: MemoryEntityStorageConnector<OdrlPolicy>;
	let mockFedCat: MockFederatedCatalogueComponent;
	let mockPnp: MockPolicyNegotiationPointComponent;
	let service: DataspaceControlPlaneService;
	let transferProcessStorage: MemoryEntityStorageConnector<TransferProcess>;

	beforeAll(async () => {
		// Setup test environment (schemas, contexts, locales)
		await setupTestEnv();

		// Still using mock FedCat, PNP, Trust, and URL transformer for now
		mockFedCat = new MockFederatedCatalogueComponent();
		mockPnp = new MockPolicyNegotiationPointComponent();
		ComponentFactory.register("test-fedcat", () => mockFedCat);
		ComponentFactory.register("test-pnp", () => mockPnp);
		ComponentFactory.register("test-trust", () => createMockTrustComponent());
	});

	afterAll(() => {
		ComponentFactory.unregister("test-fedcat");
		ComponentFactory.unregister("test-pnp");
		ComponentFactory.unregister("test-trust");
	});

	beforeEach(() => {
		// Setup REAL PAP service with memory storage
		const papSetup = setupPapIntegration("test-pap");
		pap = papSetup.pap;
		policyStorage = papSetup.policyStorage;

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

		// Create service with REAL PAP, mock FedCat, and mock Trust
		service = new DataspaceControlPlaneService({
			policyAdministrationPointComponentType: "test-pap",
			policyNegotiationPointComponentType: "test-pnp",
			federatedCatalogueComponentType: "test-fedcat",
			trustComponentType: "test-trust",
			transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
			dataspaceAppDatasetEntityStorageType: nameofKebabCase<DataspaceAppDataset>()
		});

		// Caller-validation builds the caller's composite from
		// node+tenant. This file's fixtures all use a bare DID
		// (`did:iota:provider-node-xyz`) as the agreement assigner, so we pin
		// the context to a single-tenant shape (no Tenant) and Node = same DID
		// — making the composite collapse to the bare DID and line up.
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
			[ContextIdKeys.Node]: "did:iota:provider-node-xyz",
			[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
			[ContextIdKeys.User]: "did:iota:test-user"
		});
	});

	afterEach(async () => {
		// Cleanup PAP integration
		await cleanupPapIntegration("test-pap");

		// Cleanup transfer process storage
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<TransferProcess>());
		} catch {
			// Ignore errors if already unregistered
		}

		vi.restoreAllMocks();
	});

	// ============================================================================
	// SUCCESS CASES - Valid Agreement Lookup
	// ============================================================================

	test("Should initiate transfer with valid Agreement (URN format) - REAL PAP", async () => {
		// Arrange - Dynamically create agreement using REAL PAP service
		// NOTE: Real PAP requires uid to be in URN format with 'policy' namespace (mock didn't validate this)
		const agreementUrn = "urn:policy:valid-urn-001";
		const agreementId = await pap.create({
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			"@id": agreementUrn,
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: "urn:uuid:dataset-123",
			permission: [{ action: "read" }]
		});

		// Verify agreement was stored
		const storedAgreement = await pap.getAgreement(agreementId);
		expect(storedAgreement).toBeDefined();
		expect(storedAgreement["@id"]).toBe(agreementUrn);

		// Act - Use dynamically created agreement with URN format
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: agreementUrn,
				consumerPid: "consumer-pid-001",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			undefined,
			"valid-trust-payload"
		);

		// Assert DSP response
		expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		const transferProcess = result as IDataspaceProtocolTransferProcess;
		expect(transferProcess.consumerPid).toBe("consumer-pid-001");
		expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);
		expect(transferProcess.providerPid).toBeDefined();

		// Verify internal entity has Agreement data
		const storedEntity = await transferProcessStorage.get("consumer-pid-001");
		expect(storedEntity).toBeDefined();
		if (!storedEntity) {
			throw new Error("Entity not found");
		}

		// Resolve consumer PID and verify agreement details
		const context = await service.resolveConsumerPid("consumer-pid-001", "valid-trust-payload");
		// datasetId is now the full URN (DCAT-compliant, not parsed)
		expect(context.datasetId).toBe("urn:uuid:dataset-123");
		expect(context.consumerIdentity).toBe("did:iota:consumer-node-abc");
		expect(context.agreement).toBeDefined();
		expect(context.agreement["@id"]).toBe(agreementUrn);
		expect(context.agreement.permission).toBeDefined();
		const permissions = Is.array(context.agreement.permission)
			? context.agreement.permission
			: [context.agreement.permission];
		expect(permissions.length).toBeGreaterThan(0);

		// NEW: Verify agreement is still in PAP storage (not modified by transfer)
		const agreementAfterTransfer = await pap.getAgreement(agreementUrn);
		expect(agreementAfterTransfer["@id"]).toBe(agreementUrn);
		expect(agreementAfterTransfer.assignee).toBe("did:iota:consumer-node-abc");
	});

	test("Should parse dataset ID from URN format target - REAL PAP", async () => {
		// Arrange - Create agreement with URN target using REAL PAP
		const agreementUrn = "urn:policy:parse-dataset-id";
		await pap.create({
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			"@id": agreementUrn,
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: "urn:uuid:dataset-456", // URN format
			permission: [{ action: "read" }]
		});

		// Act
		await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: agreementUrn,
				consumerPid: "consumer-pid-urn",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			undefined,
			"valid-trust-payload"
		);

		// Assert - datasetId is now the full URN (not parsed)
		const storedEntity = await transferProcessStorage.get("consumer-pid-urn");
		expect(storedEntity).toBeDefined();
		if (!storedEntity) {
			throw new Error("Entity not found");
		}

		const context = await service.resolveConsumerPid("consumer-pid-urn", "valid-trust-payload");
		// datasetId is now the full URN (DCAT-compliant, not parsed)
		expect(context.datasetId).toBe("urn:uuid:dataset-456");

		// NEW: Verify we can inspect policy storage directly
		const allPolicies = await policyStorage.getStore();
		expect(allPolicies.length).toBeGreaterThan(0);
		const ourPolicy = allPolicies.find(p => p.id === agreementUrn);
		expect(ourPolicy).toBeDefined();
		expect(ourPolicy?.target).toBe("urn:uuid:dataset-456");
	});

	// ============================================================================
	// ERROR CASES - Agreement Not Found
	// ============================================================================

	test("Should return TransferError for non-existent Agreement - REAL PAP", async () => {
		// Act - Request with non-existent agreement (nothing created in PAP)
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: "non-existent-agreement",
				consumerPid: "consumer-pid-notfound",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			undefined,
			"valid-trust-payload"
		);

		// Should be a TransferError
		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		const transferError = result as IDataspaceProtocolTransferError;
		expect(transferError.code).toMatch(/^NotFoundError:/);
		expect(transferError.reason).toBeDefined();

		if (transferError.reason && transferError.reason.length > 0) {
			const firstError = transferError.reason[0] as { name?: string; message?: string };
			expect(firstError.name).toBe("NotFoundError");
			// Real PAP uses more specific error message than mock
			expect(firstError.message).toContain("agreementNotFound");
		}

		// NEW: Verify PAP storage is empty (no policies created)
		const allPolicies = await policyStorage.getStore();
		expect(allPolicies.length).toBe(0);
	});

	// ============================================================================
	// ERROR CASES - Invalid Agreement Structure
	// ============================================================================

	test("Should reject creating Agreement with missing assignee at PAP level - REAL PAP", async () => {
		// NOTE: Key difference from mock - real PAP validates on create!
		// The mock allowed creating invalid agreements, but real PAP rejects them.
		// This is BETTER behavior - validation happens at the right layer.

		const agreementUrn = "urn:policy:missing-assignee-test";

		// Act & Assert - Real PAP should reject invalid agreement at creation
		await expect(
			pap.create({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": agreementUrn,
				assigner: "did:iota:provider-node-xyz",
				// Missing assignee - intentional for test
				target: "urn:uuid:dataset-error"
			} as unknown as IDataspaceProtocolAgreement)
		).rejects.toThrow("common.validation");

		// NEW: Verify PAP storage remains empty (invalid agreement was rejected)
		const allPolicies = await policyStorage.getStore();
		expect(allPolicies.length).toBe(0); // No invalid policies stored - validation prevented creation!
	});

	test("Should handle Agreement with active status - REAL PAP", async () => {
		// Arrange - Create agreement with status field using REAL PAP
		const agreementUrn = "urn:policy:active-status-test";
		await pap.create({
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			"@id": agreementUrn,
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: "urn:uuid:dataset-789",
			permission: [{ action: "read" }]
		});

		// Act
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: agreementUrn,
				consumerPid: "consumer-pid-active",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			undefined,
			"valid-trust-payload"
		);

		// Assert
		expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		const transferProcess = result as IDataspaceProtocolTransferProcess;
		expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);

		// NEW: Verify agreement was stored (status field may be optional and not persisted)
		const storedAgreement = await pap.getAgreement(agreementUrn);
		expect(storedAgreement["@id"]).toBe(agreementUrn);
		expect(storedAgreement.assignee).toBe("did:iota:consumer-node-abc");
		// Note: status field may not be persisted by entity schema
	});

	test("Should return TransferError for Agreement with missing target - REAL PAP", async () => {
		// NOTE: Real PAP allows creating agreement without target (optional field)
		// but transfer request should fail when trying to use it
		const agreementUrn = "urn:policy:missing-target-test";

		// Real PAP allows creating this (target is optional in ODRL)
		await pap.create({
			"@context": OdrlContexts.Context,
			"@type": "Agreement",
			"@id": agreementUrn,
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc"
			// Missing target - intentional for test
		});

		// Act - Try to use agreement without target in transfer request
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: agreementUrn,
				consumerPid: "consumer-pid-no-target",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			undefined,
			"valid-trust-payload"
		);

		// Should return TransferError (missing target can't be processed)
		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		const transferError = result as IDataspaceProtocolTransferError;
		expect(transferError.code).toMatch(/GeneralError:/);
		expect(transferError.reason).toBeDefined();
		if (transferError.reason && transferError.reason.length > 0) {
			const firstError = transferError.reason[0] as { message?: string };
			expect(firstError.message).toContain("agreementMissingTarget");
		}

		// NEW: Verify agreement WAS stored (PAP allowed it), but transfer rejected it
		const storedAgreement = await pap.getAgreement(agreementUrn);
		expect(storedAgreement).toBeDefined();
		expect(storedAgreement.target).toBeUndefined(); // No target, as expected
	});

	test("Should reject creating Offer when Agreement is expected - REAL PAP", async () => {
		// NOTE: Testing that PAP properly handles type validation
		const offerUrn = "urn:policy:offer-not-agreement";

		// Create an Offer (different from Agreement)
		await pap.create({
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Offer",
			"@id": offerUrn,
			assigner: "did:iota:provider-node-xyz",
			target: "urn:uuid:dataset-error-2",
			permission: [{ action: "read" }]
		});

		// Act - Try to use Offer ID where Agreement is expected
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: offerUrn,
				consumerPid: "consumer-pid-error-3",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			undefined,
			"valid-trust-payload"
		);

		// Should return TransferError because it's not an Agreement
		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		const transferError = result as IDataspaceProtocolTransferError;
		expect(transferError.code).toMatch(/GeneralError:/);
		expect(transferError.reason).toBeDefined();

		// NEW: Verify the Offer WAS stored (valid Offer, just wrong type for this operation)
		const storedPolicy = await pap.get(offerUrn);
		expect(storedPolicy).toBeDefined();
		expect(storedPolicy["@type"]).toBe("Offer"); // Stored as Offer, not Agreement
	});

	test("Should return TransferError for Agreement with multiple targets - REAL PAP", async () => {
		// NOTE: Real PAP allows creating agreement with multiple targets (ODRL spec allows this)
		// but transfer request should fail because DSP doesn't support multiple targets
		const agreementUrn = "urn:policy:multiple-targets-test";

		// Real PAP allows this (valid in ODRL spec)
		await pap.create({
			"@context": OdrlContexts.Context,
			"@type": "Agreement",
			"@id": agreementUrn,
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: ["urn:uuid:dataset-1", "urn:uuid:dataset-2", "urn:uuid:dataset-3"],
			permission: [{ action: "read" }]
		});

		// Act - Try to use agreement with multiple targets in transfer request
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: agreementUrn,
				consumerPid: "consumer-pid-multi-target",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			undefined,
			"valid-trust-payload"
		);

		// Should return TransferError (DSP doesn't support multiple targets)
		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		const transferError = result as IDataspaceProtocolTransferError;
		expect(transferError.code).toMatch(/GeneralError:/);
		expect(transferError.reason).toBeDefined();
		if (transferError.reason && transferError.reason.length > 0) {
			const firstError = transferError.reason[0] as { message?: string };
			expect(firstError.message).toContain("agreementMultipleTargetsNotSupported");
		}

		// NEW: Verify agreement WAS stored (PAP allowed it), but transfer rejected it
		const storedAgreement = await pap.getAgreement(agreementUrn);
		expect(storedAgreement).toBeDefined();
		expect(Is.array(storedAgreement.target)).toBe(true);
		expect((storedAgreement.target as string[]).length).toBe(3);
	});

	test("Should accept Agreement whose rule-level target refines the top-level dataset", async () => {
		const datasetUrn = "urn:uuid:single-dataset-with-refinement";
		const agreementUrn = "urn:policy:single-dataset-rule-refinement-test";

		await pap.create({
			"@context": OdrlContexts.Context,
			"@type": "Agreement",
			"@id": agreementUrn,
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: datasetUrn,
			permission: [
				{
					action: "read",
					target: {
						"@type": "AssetCollection",
						source: datasetUrn,
						refinement: {
							leftOperand: "unloadingLocation.id",
							operator: "eq",
							rightOperand: "unece:LOCODE#GBDVR"
						}
					}
				}
			]
		} as unknown as IDataspaceProtocolAgreement);

		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: agreementUrn,
				consumerPid: "consumer-pid-rule-refinement",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			undefined,
			"valid-trust-payload"
		);

		// Specifically assert the multi-target error does NOT fire. Other
		// downstream errors (e.g. dataset not in catalogue) are unrelated to
		// this regression and not part of this test's setup.
		if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
			const messages = (result.reason ?? [])
				.map(r => (r as { message?: string }).message ?? "")
				.join(" ");
			expect(messages).not.toContain("agreementMultipleTargetsNotSupported");
		}
	});
});
