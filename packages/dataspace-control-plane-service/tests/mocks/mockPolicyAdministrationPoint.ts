// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { NotFoundError } from "@twin.org/core";
import { nameof } from "@twin.org/nameof";
import type { IPolicyAdministrationPointComponent } from "@twin.org/rights-management-models";
import type {
	IOdrlAgreement,
	IOdrlOffer,
	IOdrlPolicy,
	IOdrlSet
} from "@twin.org/standards-w3c-odrl";

/**
 * Mock Policy Administration Point component for testing.
 * Pre-populated with test Agreements for various scenarios.
 *
 * TODO: Replace with real PolicyAdministrationPointService once stable.
 */
export class MockPolicyAdministrationPointComponent implements IPolicyAdministrationPointComponent {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<MockPolicyAdministrationPointComponent>();

	/**
	 * In-memory storage for test agreements.
	 * @internal
	 */
	private readonly _policies: Map<string, IOdrlPolicy>;

	/**
	 * Create a new instance of MockPolicyAdministrationPointComponent.
	 */
	constructor() {
		this._policies = new Map<string, IOdrlPolicy>();
		this.initializeTestAgreements();
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return MockPolicyAdministrationPointComponent.CLASS_NAME;
	}

	/**
	 * Bootstrap the component (no-op for mock).
	 * @param _nodeLoggingComponentType Optional logging component type.
	 * @returns Promise that resolves to true.
	 */
	public async bootstrap(_nodeLoggingComponentType?: string): Promise<boolean> {
		// No-op for mock
		return true;
	}

	/**
	 * Start the component (no-op for mock).
	 * @returns Promise that resolves when complete.
	 */
	public async start(): Promise<void> {
		// No-op for mock
	}

	/**
	 * Stop the component (no-op for mock).
	 * @returns Promise that resolves when complete.
	 */
	public async stop(): Promise<void> {
		// No-op for mock
	}

	/**
	 * Create a policy.
	 * Note: Type assertion is intentionally loose to allow storing
	 * invalid policy types (e.g., Offers) for error scenario testing.
	 * @param policy The policy to create (with optional uid).
	 * @returns The UID of the created policy.
	 */
	public async create(policy: Omit<IOdrlPolicy, "uid"> & { uid?: string }): Promise<string> {
		const uid = policy.uid ?? `generated-uid-${Date.now()}`;
		// Intentionally cast to Agreement - mock allows invalid types for testing
		const fullPolicy = { ...policy, uid } as IOdrlAgreement;
		this._policies.set(uid, fullPolicy);
		return uid;
	}

	/**
	 * Get a policy by ID.
	 * @param policyId The policy ID.
	 * @returns The policy (throws if not found).
	 */
	public async get(policyId: string): Promise<IOdrlPolicy> {
		const policy = this._policies.get(policyId);
		if (!policy) {
			throw new NotFoundError(
				MockPolicyAdministrationPointComponent.CLASS_NAME,
				"policyNotFound",
				undefined,
				{ policyId }
			);
		}
		return policy;
	}

	/**
	 * Get an agreement by ID.
	 * @param agreementId The agreement ID.
	 * @returns The agreement (throws if not found).
	 */
	public async getAgreement(agreementId: string): Promise<IOdrlAgreement> {
		const agreement = this._policies.get(agreementId);
		if (!agreement) {
			throw new NotFoundError(
				MockPolicyAdministrationPointComponent.CLASS_NAME,
				"policyNotFound",
				undefined,
				{ policyId: agreementId }
			);
		}
		return agreement as IOdrlAgreement;
	}

	/**
	 * Get an offer by ID.
	 * @param offerId The offer ID.
	 * @returns The offer (throws if not found).
	 */
	public async getOffer(offerId: string): Promise<IOdrlOffer> {
		const offer = this._policies.get(offerId);
		if (!offer) {
			throw new NotFoundError(
				MockPolicyAdministrationPointComponent.CLASS_NAME,
				"policyNotFound",
				undefined,
				{ policyId: offerId }
			);
		}
		return offer as IOdrlOffer;
	}

	/**
	 * Get a set by ID.
	 * @param setId The set ID.
	 * @returns The set (throws if not found).
	 */
	public async getSet(setId: string): Promise<IOdrlSet> {
		const set = this._policies.get(setId);
		if (!set) {
			throw new NotFoundError(
				MockPolicyAdministrationPointComponent.CLASS_NAME,
				"policyNotFound",
				undefined,
				{ policyId: setId }
			);
		}
		return set as IOdrlSet;
	}

	/**
	 * Update a policy.
	 * Note: Type assertion is intentionally loose to allow storing
	 * invalid policy types for error scenario testing.
	 * @param policy The policy to update.
	 * @returns Promise that resolves when complete.
	 */
	public async update(policy: IOdrlPolicy): Promise<void> {
		this._policies.set(policy.uid, policy);
	}

	/**
	 * Remove a policy.
	 * @param policyId The policy ID.
	 * @returns Promise that resolves when complete.
	 */
	public async remove(policyId: string): Promise<void> {
		this._policies.delete(policyId);
	}

	/**
	 * Query policies (mock: returns all agreements).
	 * Note: Interface defines optional parameters (conditions, cursor, limit)
	 * which are not used in this mock implementation.
	 * @returns Object with policies array and optional cursor.
	 */
	public async query(): Promise<{ cursor?: string; policies: IOdrlPolicy[] }> {
		return {
			policies: [...this._policies.values()]
		};
	}

	// ============================================================================
	// TEST HELPER METHODS
	// ============================================================================

	/**
	 * Add a test agreement.
	 * @param agreement The agreement to add.
	 */
	public addAgreement(agreement: IOdrlAgreement): void {
		this._policies.set(agreement.uid, agreement);
	}

	/**
	 * Clear all agreements.
	 */
	public clearAgreements(): void {
		this._policies.clear();
	}

	/**
	 * Initialize test agreements for common scenarios.
	 * @internal
	 */
	private initializeTestAgreements(): void {
		// ============================================================================
		// Test agreements for basic functionality tests
		// ============================================================================

		// Agreement for basic tests (agreement-123 -> dataset-123)
		this._policies.set("agreement-123", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			uid: "agreement-123",
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: "urn:uuid:dataset-123",
			permission: [
				{
					action: "read"
				}
			]
		});

		// Agreement for basic tests (agreement-456 -> dataset-456)
		this._policies.set("agreement-456", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			uid: "agreement-456",
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: "urn:uuid:dataset-456",
			permission: [
				{
					action: "read"
				}
			]
		});

		// Agreement for Federated Catalogue integration tests
		this._policies.set("agreement-new-test", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			uid: "agreement-new-test",
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: "urn:uuid:dataset-new-test",
			permission: [
				{
					action: "read"
				}
			]
		});

		// ============================================================================
		// Test agreements for PAP integration tests
		// ============================================================================

		// Valid Agreement - URN format
		this._policies.set("agreement-valid-urn", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			uid: "agreement-valid-urn",
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: "urn:uuid:dataset-123",
			permission: [
				{
					action: "read"
				}
			]
		});

		// Valid Agreement - Uses dataset-456
		this._policies.set("agreement-valid-path", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			uid: "agreement-valid-path",
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: "urn:uuid:dataset-456",
			permission: [
				{
					action: "read"
				}
			]
		});

		// Valid Agreement
		this._policies.set("agreement-active", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			uid: "agreement-active",
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: "urn:uuid:dataset-789",
			permission: [
				{
					action: "read"
				}
			]
		});

		// Invalid Agreement - Missing assignee (intentionally invalid for testing)
		this._policies.set("agreement-no-assignee", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			uid: "agreement-no-assignee",
			assigner: "did:iota:provider-node-xyz",
			// Missing assignee - intentional for testing error handling
			target: "urn:uuid:dataset-error-1"
		} as unknown as IOdrlAgreement);

		// Invalid Agreement - Missing target (still needs assignee for type checking)
		this._policies.set("agreement-no-target", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			uid: "agreement-no-target",
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc"
			// Missing target - validation will catch this at runtime
		} as IOdrlAgreement);

		// Invalid Policy - Offer instead of Agreement
		this._policies.set("offer-not-agreement", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Offer",
			uid: "offer-not-agreement",
			assigner: "did:iota:provider-node-xyz",
			target: "urn:uuid:dataset-error-2",
			permission: [
				{
					action: "read"
				}
			]
		} as unknown as IOdrlAgreement);

		// Invalid Agreement - Multiple targets (not supported)
		this._policies.set("agreement-multiple-targets", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			uid: "agreement-multiple-targets",
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: ["urn:uuid:dataset-1", "urn:uuid:dataset-2", "urn:uuid:dataset-3"],
			permission: [
				{
					action: "read"
				}
			]
		} as IOdrlAgreement);
	}
}
