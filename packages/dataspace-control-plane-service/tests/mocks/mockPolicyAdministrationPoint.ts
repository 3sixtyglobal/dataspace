// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Is, NotFoundError } from "@3sixty/core";
import { EntitySchemaPropertyType, EntitySorter, SortDirection } from "@3sixty/entity";
import { nameof } from "@3sixty/nameof";
import {
	OdrlPolicyHelper,
	type IPolicyAdministrationPointComponent,
	type IPolicyLocator,
	type IRightsManagementAgreement,
	type IRightsManagementOffer,
	type IRightsManagementPolicy,
	type IRightsManagementSet
} from "@3sixty/rights-management-models";

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
	private readonly _policies: Map<string, IRightsManagementPolicy>;

	/**
	 * Create a new instance of MockPolicyAdministrationPointComponent.
	 */
	constructor() {
		this._policies = new Map<string, IRightsManagementPolicy>();
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
	 * @param nodeLoggingComponentType Optional logging component type.
	 * @returns Promise that resolves to true.
	 */
	public async bootstrap(nodeLoggingComponentType?: string): Promise<boolean> {
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
	public async create(
		policy: Omit<IRightsManagementPolicy, "uid"> & { uid?: string }
	): Promise<string> {
		const uid = policy.uid ?? `generated-uid-${Date.now()}`;
		// Intentionally cast to Agreement - mock allows invalid types for testing
		const fullPolicy = { ...policy, uid } as IRightsManagementPolicy;
		this._policies.set(uid, fullPolicy);
		return uid;
	}

	/**
	 * Get a policy by ID.
	 * @param policyId The policy ID.
	 * @returns The policy (throws if not found).
	 */
	public async get(policyId: string): Promise<IRightsManagementPolicy> {
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
	public async getAgreement(agreementId: string): Promise<IRightsManagementAgreement> {
		const agreement = this._policies.get(agreementId);
		if (!agreement) {
			throw new NotFoundError(
				MockPolicyAdministrationPointComponent.CLASS_NAME,
				"policyNotFound",
				undefined,
				{ policyId: agreementId }
			);
		}
		return agreement as IRightsManagementAgreement;
	}

	/**
	 * Get an offer by ID.
	 * @param offerId The offer ID.
	 * @returns The offer (throws if not found).
	 */
	public async getOffer(offerId: string): Promise<IRightsManagementOffer> {
		const offer = this._policies.get(offerId);
		if (!offer) {
			throw new NotFoundError(
				MockPolicyAdministrationPointComponent.CLASS_NAME,
				"policyNotFound",
				undefined,
				{ policyId: offerId }
			);
		}
		return offer as IRightsManagementOffer;
	}

	/**
	 * Get a set by ID.
	 * @param setId The set ID.
	 * @returns The set (throws if not found).
	 */
	public async getSet(setId: string): Promise<IRightsManagementSet> {
		const set = this._policies.get(setId);
		if (!set) {
			throw new NotFoundError(
				MockPolicyAdministrationPointComponent.CLASS_NAME,
				"policyNotFound",
				undefined,
				{ policyId: setId }
			);
		}
		return set as IRightsManagementSet;
	}

	/**
	 * Update a policy.
	 * Note: Type assertion is intentionally loose to allow storing
	 * invalid policy types for error scenario testing.
	 * @param policy The policy to update.
	 * @returns Promise that resolves when complete.
	 */
	public async update(policy: IRightsManagementPolicy): Promise<void> {
		this._policies.set(policy["@id"], policy);
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
	 * Query policies filtered by the optional locator, with cursor pagination (default page size
	 * 40, matching the memory entity storage connector).
	 * @param locator Optional criteria to filter policies by type, assigner, assignee, and target.
	 * @param conditions Unused in the mock; matches the component signature.
	 * @param cursor The pagination cursor (the offset into the filtered results).
	 * @param limit The page size; defaults to 40 like the memory entity storage connector.
	 * @param properties Optional reduced property list, mirroring the real PAP: both the model and
	 * storage key forms are accepted and the policy "@id" is always included.
	 * @param orderBy Optional policy property to order the results by, applied before paging.
	 * @param orderByDirection The direction for the order, defaults to descending.
	 * @returns Object with policies array and optional cursor.
	 */
	public async query(
		locator?: IPolicyLocator,
		conditions?: unknown,
		cursor?: string,
		limit?: number,
		properties?: (keyof IRightsManagementPolicy)[],
		orderBy?: keyof IRightsManagementPolicy,
		orderByDirection?: SortDirection
	): Promise<{ cursor?: string; policies: IRightsManagementPolicy[] }> {
		let policies = [...this._policies.values()];

		if (locator) {
			if (locator.type) {
				policies = policies.filter(p => p["@type"] === locator.type);
			}
			if (locator.assigner) {
				const wantedAssigner = locator.assigner;
				policies = policies.filter(p =>
					OdrlPolicyHelper.getPartyIds(p.assigner).includes(wantedAssigner)
				);
			}
			if (locator.assignee) {
				const wantedAssignee = locator.assignee;
				policies = policies.filter(p =>
					OdrlPolicyHelper.getPartyIds(p.assignee).includes(wantedAssignee)
				);
			}
			if (locator.target) {
				const wantedTarget = locator.target;
				policies = policies.filter(p =>
					OdrlPolicyHelper.getDatasetTargets(p).includes(wantedTarget)
				);
			}
		}

		if (Is.stringValue(orderBy)) {
			policies = EntitySorter.sort(policies, [
				{
					property: orderBy,
					type: EntitySchemaPropertyType.String,
					sortDirection: orderByDirection ?? SortDirection.Descending
				}
			]);
		}

		const pageSize = limit ?? 40;
		const start = cursor ? Number.parseInt(cursor, 10) : 0;
		let page = policies.slice(start, start + pageSize);
		const nextCursor = start + pageSize < policies.length ? String(start + pageSize) : undefined;

		if (Is.arrayValue(properties)) {
			const storageToModelKeys: { [key: string]: string } = {
				id: "@id",
				type: "@type",
				context: "@context"
			};
			page = page.map(policy => {
				const source = policy as unknown as { [key: string]: unknown };
				const reduced: { [key: string]: unknown } = { "@id": source["@id"] };
				for (const property of properties) {
					const key = storageToModelKeys[property] ?? property;
					reduced[key] = source[key];
				}
				return reduced as unknown as IRightsManagementPolicy;
			});
		}

		return { cursor: nextCursor, policies: page };
	}

	// ============================================================================
	// TEST HELPER METHODS
	// ============================================================================

	/**
	 * Add a test agreement.
	 * @param agreement The agreement to add.
	 */
	public addAgreement(agreement: IRightsManagementAgreement): void {
		this._policies.set(agreement["@id"], agreement);
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
			"@id": "agreement-123",
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
			"@id": "agreement-456",
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: "urn:uuid:dataset-456",
			permission: [
				{
					action: "read"
				}
			]
		});

		// Agreement with multiple assignees (D6: check all assignees)
		this._policies.set("agreement-multi-assignee", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			"@id": "agreement-multi-assignee",
			assigner: "did:iota:provider-node-xyz",
			assignee: ["did:iota:other-consumer", "did:iota:consumer-node-abc"],
			target: "urn:uuid:dataset-123",
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
			"@id": "agreement-new-test",
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
			"@id": "agreement-valid-urn",
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
			"@id": "agreement-valid-path",
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
			"@id": "agreement-active",
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
			"@id": "agreement-no-assignee",
			assigner: "did:iota:provider-node-xyz",
			// Missing assignee - intentional for testing error handling
			target: "urn:uuid:dataset-error-1"
		} as unknown as IRightsManagementAgreement);

		// Invalid Agreement - Missing target (still needs assignee for type checking)
		this._policies.set("agreement-no-target", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			"@id": "agreement-no-target",
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc"
			// Missing target - validation will catch this at runtime
		} as unknown as IRightsManagementAgreement);

		// Invalid Policy - Offer instead of Agreement
		this._policies.set("offer-not-agreement", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Offer",
			"@id": "offer-not-agreement",
			assigner: "did:iota:provider-node-xyz",
			target: "urn:uuid:dataset-error-2",
			permission: [
				{
					action: "read"
				}
			]
		} as unknown as IRightsManagementAgreement);

		// Invalid Agreement - Multiple targets (not supported)
		this._policies.set("agreement-multiple-targets", {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			"@id": "agreement-multiple-targets",
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: ["urn:uuid:dataset-1", "urn:uuid:dataset-2", "urn:uuid:dataset-3"],
			permission: [
				{
					action: "read"
				}
			]
		} as unknown as IRightsManagementAgreement);
	}
}
