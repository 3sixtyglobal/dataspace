// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
/* eslint-disable @typescript-eslint/member-ordering, no-restricted-syntax -- vi.fn() callback props for tests */
import type { IPolicyNegotiationPointComponent } from "@twin.org/rights-management-models";
import type {
	IDataspaceProtocolContractAgreementMessage,
	IDataspaceProtocolContractAgreementVerificationMessage,
	IDataspaceProtocolContractNegotiation,
	IDataspaceProtocolContractNegotiationError,
	IDataspaceProtocolContractNegotiationEventMessage,
	IDataspaceProtocolContractNegotiationTerminationMessage,
	IDataspaceProtocolContractOfferMessage,
	IDataspaceProtocolContractRequestMessage
} from "@twin.org/standards-dataspace-protocol";
import {
	DataspaceProtocolContractNegotiationStateType,
	DataspaceProtocolContractNegotiationTypes,
	DataspaceProtocolContexts
} from "@twin.org/standards-dataspace-protocol";

/**
 * Mock implementation of IPolicyNegotiationPointComponent for testing.
 */
export class MockPolicyNegotiationPointComponent implements IPolicyNegotiationPointComponent {
	/**
	 * Stored negotiations indexed by negotiation ID.
	 */
	private readonly _negotiations: Map<
		string,
		IDataspaceProtocolContractNegotiation | IDataspaceProtocolContractNegotiationError
	>;

	/**
	 * Counter for generating unique negotiation IDs.
	 */
	private _negotiationCounter: number;

	/**
	 * Create a new instance of MockPolicyNegotiationPointComponent.
	 */
	constructor() {
		this._negotiations = new Map();
		this._negotiationCounter = 0;
	}

	/**
	 * Get the class name for the component.
	 * @returns The class name.
	 */
	public className(): string {
		return "MockPolicyNegotiationPointComponent";
	}

	/**
	 * Send a request to a provider (mock implementation).
	 * @param url The url of the provider.
	 * @param requesterType The type of the requester.
	 * @param odrlOfferId The id of the offer to request.
	 * @param publicOrigin The public origin url.
	 * @returns The negotiation id.
	 */
	public async sendRequestToProvider(
		url: string,
		requesterType: string,
		odrlOfferId: string,
		publicOrigin: string
	): Promise<string> {
		const negotiationId = `mock-negotiation-${++this._negotiationCounter}`;
		const consumerPid = `consumer-${negotiationId}`;
		const providerPid = `provider-${negotiationId}`;

		// Create a mock negotiation in FINALIZED state
		const negotiation: IDataspaceProtocolContractNegotiation = {
			"@context": [DataspaceProtocolContexts.JsonLdContext],
			"@type": DataspaceProtocolContractNegotiationTypes.ContractNegotiation,
			providerPid,
			consumerPid,
			state: DataspaceProtocolContractNegotiationStateType.FINALIZED
		};

		this._negotiations.set(negotiationId, negotiation);

		return negotiationId;
	}

	/**
	 * Get the current state of the negotiation.
	 * @param id The id of the negotiation to retrieve.
	 * @param trustPayload Trust payload to verify the requesters identity.
	 * @returns The current state of the negotiation or an error.
	 */
	public async getNegotiation(
		id: string,
		trustPayload: unknown
	): Promise<IDataspaceProtocolContractNegotiation | IDataspaceProtocolContractNegotiationError> {
		const negotiation = this._negotiations.get(id);

		if (!negotiation) {
			return {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": DataspaceProtocolContractNegotiationTypes.ContractNegotiationError,
				providerPid: "",
				consumerPid: "",
				code: "404",
				reason: [{ message: "Negotiation not found", language: "en" }]
			};
		}

		return negotiation;
	}

	/**
	 * Set a specific negotiation state (for testing).
	 * @param id The negotiation ID.
	 * @param negotiation The negotiation object to store.
	 */
	public setNegotiation(
		id: string,
		negotiation: IDataspaceProtocolContractNegotiation | IDataspaceProtocolContractNegotiationError
	): void {
		this._negotiations.set(id, negotiation);
	}

	/**
	 * Clear all stored negotiations.
	 */
	public clearNegotiations(): void {
		this._negotiations.clear();
		this._negotiationCounter = 0;
	}

	// Other methods required by IPolicyNegotiationPointComponent
	// Using vi.fn() for callback methods to allow spying in tests

	public requestFromConsumer = vi.fn(async () => {
		throw new Error("Not implemented in mock");
	}) as unknown as (
		message: IDataspaceProtocolContractRequestMessage,
		trustPayload: unknown
	) => Promise<IDataspaceProtocolContractNegotiation | IDataspaceProtocolContractNegotiationError>;

	public offerFromProvider = vi.fn(async () => ({
		"@context": [DataspaceProtocolContexts.JsonLdContext],
		"@type": DataspaceProtocolContractNegotiationTypes.ContractNegotiation,
		providerPid: "mock-provider",
		consumerPid: "mock-consumer",
		state: DataspaceProtocolContractNegotiationStateType.OFFERED
	})) as unknown as (
		message: IDataspaceProtocolContractOfferMessage,
		trustPayload: unknown
	) => Promise<IDataspaceProtocolContractNegotiation | IDataspaceProtocolContractNegotiationError>;

	public agreementFromProvider = vi.fn(async () => undefined) as unknown as (
		message: IDataspaceProtocolContractAgreementMessage,
		trustPayload: unknown
	) => Promise<IDataspaceProtocolContractNegotiationError | undefined>;

	public agreementVerificationFromConsumer = vi.fn(async () => undefined) as unknown as (
		message: IDataspaceProtocolContractAgreementVerificationMessage,
		trustPayload: unknown
	) => Promise<IDataspaceProtocolContractNegotiationError | undefined>;

	public event = vi.fn(async () => undefined) as unknown as (
		message: IDataspaceProtocolContractNegotiationEventMessage,
		destination: "provider" | "consumer",
		trustPayload: unknown
	) => Promise<IDataspaceProtocolContractNegotiationError | undefined>;

	public terminate = vi.fn(async () => undefined) as unknown as (
		message: IDataspaceProtocolContractNegotiationTerminationMessage,
		destination: "provider" | "consumer",
		trustPayload: unknown
	) => Promise<IDataspaceProtocolContractNegotiationError | undefined>;

	public sendTerminateToConsumer = vi.fn(async () => undefined) as unknown as (
		callbackAddress: string,
		providerPid: string,
		consumerPid: string
	) => Promise<void>;
}
