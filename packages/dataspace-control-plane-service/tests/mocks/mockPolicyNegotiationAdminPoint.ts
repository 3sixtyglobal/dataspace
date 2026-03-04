// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	IPolicyNegotiation,
	IPolicyNegotiationAdminPointComponent
} from "@twin.org/rights-management-models";
import type { DataspaceProtocolContractNegotiationStateType } from "@twin.org/standards-dataspace-protocol";
import { DataspaceProtocolContractNegotiationStateType as StateType } from "@twin.org/standards-dataspace-protocol";

/**
 * Mock implementation of IPolicyNegotiationAdminPointComponent for testing.
 */
export class MockPolicyNegotiationAdminPointComponent
	implements IPolicyNegotiationAdminPointComponent
{
	/**
	 * Stored negotiations indexed by negotiation ID.
	 */
	private readonly _negotiations: Map<string, IPolicyNegotiation>;

	/**
	 * Create a new instance of MockPolicyNegotiationAdminPointComponent.
	 */
	constructor() {
		this._negotiations = new Map();
	}

	/**
	 * Create a sample negotiation for testing.
	 * @param overrides Partial negotiation to override defaults.
	 * @returns A complete IPolicyNegotiation object.
	 */
	public static createSampleNegotiation(
		overrides: Partial<IPolicyNegotiation> = {}
	): IPolicyNegotiation {
		const id = overrides.id ?? `negotiation-${Date.now()}`;
		return {
			id,
			correlationId: overrides.correlationId ?? `provider-${id}`,
			state: overrides.state ?? StateType.FINALIZED,
			dateCreated: overrides.dateCreated ?? new Date().toISOString(),
			offer: overrides.offer,
			agreement: overrides.agreement,
			organizationIdentity: overrides.organizationIdentity ?? "did:example:123456789",
			policyId: overrides.policyId,
			expires: overrides.expires,
			callbackAddress: overrides.callbackAddress,
			trustVerificationInfo: overrides.trustVerificationInfo,
			code: overrides.code,
			reason: overrides.reason,
			description: overrides.description,
			handlerId: overrides.handlerId,
			interventionRequired: overrides.interventionRequired
		};
	}

	/**
	 * Get the class name for the component.
	 * @returns The class name.
	 */
	public className(): string {
		return "MockPolicyNegotiationAdminPointComponent";
	}

	/**
	 * Retrieves a policy negotiation.
	 * @param id The ID of the policy to retrieve the negotiation for.
	 * @returns The policy negotiation.
	 */
	public async get(id: string): Promise<IPolicyNegotiation> {
		const negotiation = this._negotiations.get(id);

		if (!negotiation) {
			throw new Error(`Negotiation not found: ${id}`);
		}

		return negotiation;
	}

	/**
	 * Sets a policy negotiation.
	 * @param negotiation The updated policy negotiation.
	 * @returns Nothing.
	 */
	public async set(negotiation: IPolicyNegotiation): Promise<void> {
		this._negotiations.set(negotiation.id, negotiation);
	}

	/**
	 * Cancels an ongoing negotiation for a resource.
	 * @param policyId The ID of the policy to cancel.
	 * @returns Nothing.
	 */
	public async remove(policyId: string): Promise<void> {
		this._negotiations.delete(policyId);
	}

	/**
	 * Get a list of the negotiations.
	 * @param status The state of the negotiations to retrieve.
	 * @param cursor The cursor to use for pagination.
	 * @returns A list of negotiations and cursor if there are more entries.
	 */
	public async query(
		status?: DataspaceProtocolContractNegotiationStateType,
		cursor?: string
	): Promise<{ items: IPolicyNegotiation[]; cursor?: string }> {
		// Convert map to array
		let items = [...this._negotiations.values()];

		// Filter by status if provided
		if (status) {
			items = items.filter(neg => neg.state === status);
		}

		// Sort by dateCreated (newest first)
		items.sort((a, b) => {
			const dateA = new Date(a.dateCreated).getTime();
			const dateB = new Date(b.dateCreated).getTime();
			return dateB - dateA;
		});

		// Handle pagination with cursor
		const pageSize = 10;
		let startIndex = 0;

		if (cursor) {
			// Cursor is the index of the last item in the previous page
			startIndex = Number.parseInt(cursor, 10);
		}

		const paginatedItems = items.slice(startIndex, startIndex + pageSize);
		const hasMore = items.length > startIndex + pageSize;

		return {
			items: paginatedItems,
			cursor: hasMore ? String(startIndex + pageSize) : undefined
		};
	}

	/**
	 * Add a negotiation to the mock (for testing).
	 * @param negotiation The negotiation to add.
	 */
	public addNegotiation(negotiation: IPolicyNegotiation): void {
		this._negotiations.set(negotiation.id, negotiation);
	}

	/**
	 * Clear all stored negotiations.
	 */
	public clearNegotiations(): void {
		this._negotiations.clear();
	}
}
