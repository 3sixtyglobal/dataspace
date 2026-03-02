// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory, Is } from "@twin.org/core";
import type { TransferProcess } from "@twin.org/dataspace-models";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import {
	DataspaceProtocolContexts,
	DataspaceProtocolTransferProcessStateType,
	DataspaceProtocolTransferProcessTypes
} from "@twin.org/standards-dataspace-protocol";
import type {
	IDataspaceProtocolTransferError,
	IDataspaceProtocolTransferProcess
} from "@twin.org/standards-dataspace-protocol";
import type { IOdrlAgreement } from "@twin.org/standards-w3c-odrl";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { DataspaceControlPlaneService } from "../src/dataspaceControlPlaneService.js";
import { MockFederatedCatalogueComponent } from "./mocks/mockFederatedCatalogue.js";
import { MockPolicyAdministrationPointComponent } from "./mocks/mockPolicyAdministrationPoint.js";
import { MockPolicyNegotiationPointComponent } from "./mocks/mockPolicyNegotiationPoint.js";
import { createMockTrustComponent, setupTestEnv } from "./setupTestEnv.js";

describe("DataspaceControlPlaneService - PAP Integration", () => {
	let mockPap: MockPolicyAdministrationPointComponent;
	let mockFedCat: MockFederatedCatalogueComponent;
	let mockPnp: MockPolicyNegotiationPointComponent;
	let service: DataspaceControlPlaneService;
	let transferProcessStorage: MemoryEntityStorageConnector<TransferProcess>;

	beforeAll(async () => {
		// Setup test environment (schemas, contexts, locales)
		await setupTestEnv();

		// Register mock PAP, FedCat, PNP, and Trust with ComponentFactory
		mockPap = new MockPolicyAdministrationPointComponent();
		mockFedCat = new MockFederatedCatalogueComponent();
		mockPnp = new MockPolicyNegotiationPointComponent();
		ComponentFactory.register("test-pap", () => mockPap);
		ComponentFactory.register("test-fedcat", () => mockFedCat);
		ComponentFactory.register("test-pnp", () => mockPnp);
		ComponentFactory.register("test-trust", () => createMockTrustComponent());
	});

	afterAll(() => {
		ComponentFactory.unregister("test-pap");
		ComponentFactory.unregister("test-fedcat");
		ComponentFactory.unregister("test-pnp");
		ComponentFactory.unregister("test-trust");
	});

	beforeEach(() => {
		// Create fresh storage for each test
		transferProcessStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>()
		});

		// Register the entity storage connector
		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferProcess>(),
			() => transferProcessStorage
		);

		// Create service with PAP, FedCat, and Trust configured
		service = new DataspaceControlPlaneService({
			policyAdministrationPointComponentType: "test-pap",
			policyNegotiationPointComponentType: "test-pnp",
			federatedCatalogueComponentType: "test-fedcat",
			trustComponentType: "test-trust",
			transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
		});

		// Mock PAP retains its pre-initialized test agreements
		// Individual tests can add more as needed

		// Mock ContextIdStore to return test organization ID
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
			[ContextIdKeys.Node]: "did:iota:test-node",
			[ContextIdKeys.Tenant]: "did:iota:test-tenant",
			[ContextIdKeys.Organization]: "did:iota:provider-node-xyz", // Matches assigner in test agreements
			[ContextIdKeys.User]: "did:iota:test-user"
		});
	});

	afterEach(() => {
		// Unregister the entity storage connector after each test
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<TransferProcess>());
		} catch {
			// Ignore errors if already unregistered
		}
	});

	// ============================================================================
	// SUCCESS CASES - Valid Agreement Lookup
	// ============================================================================

	test("Should initiate transfer with valid Agreement (URN format)", async () => {
		// Act - Use pre-initialized agreement-valid-urn from mock
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: "agreement-valid-urn",
				consumerPid: "consumer-pid-001",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
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

		// Pass a valid trust payload (trust verification handles authentication)
		const context = await service.resolveConsumerPid("consumer-pid-001", "valid-trust-payload");
		// datasetId is now the full URN (DCAT-compliant, not parsed)
		expect(context.datasetId).toBe("urn:uuid:dataset-123");
		expect(context.consumerIdentity).toBe("did:iota:consumer-node-abc");
		expect(context.agreement).toBeDefined();
		expect(context.agreement.uid).toBe("agreement-valid-urn");
		expect(context.agreement.permission).toBeDefined();
		const permissions = Is.array(context.agreement.permission)
			? context.agreement.permission
			: [context.agreement.permission];
		expect(permissions.length).toBeGreaterThan(0);
	});

	test("Should parse dataset ID from URN format target", async () => {
		// Arrange - Use an existing dataset from mock FedCat (dataset-456)
		mockPap.addAgreement({
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			uid: "agreement-urn",
			assigner: "did:iota:provider-node-xyz", // Must match ContextIdStore mock
			assignee: "did:iota:consumer-abc",
			target: "urn:uuid:dataset-456", // Matches dataset-456 in mock FedCat
			permission: [{ action: "read" }]
		});

		// Act
		await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: "agreement-urn",
				consumerPid: "consumer-pid-urn",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			"valid-trust-payload"
		);

		// Assert - datasetId is now the full URN (not parsed)
		const storedEntity = await transferProcessStorage.get("consumer-pid-urn");
		expect(storedEntity).toBeDefined();
		if (!storedEntity) {
			throw new Error("Entity not found");
		}

		// Pass a valid trust payload (trust verification handles authentication)
		const context = await service.resolveConsumerPid("consumer-pid-urn", "valid-trust-payload");
		// datasetId is now the full URN (DCAT-compliant, not parsed)
		expect(context.datasetId).toBe("urn:uuid:dataset-456");
	});

	test("Should handle Agreement with active status", async () => {
		// Act - Use pre-initialized agreement-active from mock
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: "agreement-active",
				consumerPid: "consumer-pid-active",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			"valid-trust-payload"
		);

		// Assert
		expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		const transferProcess = result as IDataspaceProtocolTransferProcess;
		expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);
	});

	// ============================================================================
	// ERROR CASES - Agreement Not Found
	// ============================================================================

	test("Should return TransferError for non-existent Agreement", async () => {
		// Act - Should return TransferError (DSP-compliant) instead of throwing
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: "non-existent-agreement",
				consumerPid: "consumer-pid-notfound",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			"valid-trust-payload"
		);

		// Should be a TransferError
		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		const transferError = result as IDataspaceProtocolTransferError;
		// Semantic error code format: "ErrorName:message"
		expect(transferError.code).toMatch(/^NotFoundError:/);
		expect(transferError.reason).toBeDefined();

		if (transferError.reason && transferError.reason.length > 0) {
			const firstError = transferError.reason[0] as { name?: string; message?: string };
			expect(firstError.name).toBe("NotFoundError");
			expect(firstError.message).toContain("mockPolicyAdministrationPointComponent.policyNotFound");
		}
	});

	// ============================================================================
	// ERROR CASES - Invalid Agreement Structure
	// ============================================================================

	test("Should return TransferError for Agreement missing assignee", async () => {
		// Arrange (intentionally invalid agreement for testing error handling)
		mockPap.addAgreement({
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			uid: "agreement-no-assignee",
			assigner: "did:iota:provider-node-xyz", // Must match ContextIdStore mock
			// Missing assignee - intentional for test
			target: "urn:uuid:dataset-error"
		} as unknown as IOdrlAgreement);

		// Act
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: "agreement-no-assignee",
				consumerPid: "consumer-pid-error-1",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			"valid-trust-payload"
		);

		// Should be a TransferError
		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		const transferError = result as IDataspaceProtocolTransferError;
		expect(transferError.code).toMatch(/GeneralError:/);
		expect(transferError.reason).toBeDefined();
		if (transferError.reason && transferError.reason.length > 0) {
			const firstError = transferError.reason[0] as { message?: string };
			expect(firstError.message).toContain("policyMissingAssignee");
		}
	});

	test("Should return TransferError for Agreement missing target", async () => {
		// Arrange (agreement already in mock PAP with missing target)
		// Note: The mock has an agreement-no-target with missing target field

		// Act
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: "agreement-no-target",
				consumerPid: "consumer-pid-error-2",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			"valid-trust-payload"
		);

		// Should be a TransferError
		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		const transferError = result as IDataspaceProtocolTransferError;
		expect(transferError.code).toMatch(/GeneralError:/);
		expect(transferError.reason).toBeDefined();
		if (transferError.reason && transferError.reason.length > 0) {
			const firstError = transferError.reason[0] as { message?: string };
			expect(firstError.message).toContain("agreementMissingTarget");
		}
	});

	test("Should return TransferError for invalid policy type (Offer instead of Agreement)", async () => {
		// Act - Use pre-initialized offer-not-agreement from mock
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: "offer-not-agreement",
				consumerPid: "consumer-pid-error-3",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			"valid-trust-payload"
		);

		// Should be a TransferError
		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		const transferError = result as IDataspaceProtocolTransferError;
		expect(transferError.code).toMatch(/GeneralError:/);
		expect(transferError.reason).toBeDefined();
		if (transferError.reason && transferError.reason.length > 0) {
			const firstError = transferError.reason[0] as { message?: string };
			expect(firstError.message).toContain("odrlPolicyHelper.policyMissingAssignee");
		}
	});

	test("Should return TransferError for Agreement with multiple targets", async () => {
		// Act - Use pre-initialized agreement-multiple-targets from mock
		const result = await service.requestTransfer(
			{
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				agreementId: "agreement-multiple-targets",
				consumerPid: "consumer-pid-error-4",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			},
			"valid-trust-payload"
		);

		// Should be a TransferError
		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		const transferError = result as IDataspaceProtocolTransferError;
		expect(transferError.code).toMatch(/GeneralError:/);
		expect(transferError.reason).toBeDefined();
		if (transferError.reason && transferError.reason.length > 0) {
			const firstError = transferError.reason[0] as { message?: string };
			expect(firstError.message).toContain("agreementMultipleTargetsNotSupported");
		}
	});
});
