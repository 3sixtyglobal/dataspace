// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRightsManagementAgreement } from "@3sixty/rights-management-models";
import type { DataspaceProtocolContractNegotiationStateType } from "@3sixty/standards-dataspace-protocol";

/**
 * Negotiation state tracked internally for callback routing.
 */
export interface INegotiationState {
	/**
	 * The negotiation ID (self-reference for lookup).
	 */
	negotiationId: string;

	/**
	 * Current negotiation state.
	 */
	state: DataspaceProtocolContractNegotiationStateType;

	/**
	 * Agreement received from provider (stored until finalized).
	 */
	agreement?: IRightsManagementAgreement;

	/**
	 * Timestamp when negotiation started.
	 */
	startedAt: number;

	/**
	 * Timestamp when negotiation state was last updated.
	 */
	updatedAt: number;
}
