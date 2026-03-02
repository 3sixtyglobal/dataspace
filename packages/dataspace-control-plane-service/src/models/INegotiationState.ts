// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { DataspaceProtocolContractNegotiationStateType } from "@twin.org/standards-dataspace-protocol";
import type { IOdrlAgreement } from "@twin.org/standards-w3c-odrl";

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
	agreement?: IOdrlAgreement;

	/**
	 * Timestamp when negotiation started.
	 */
	startedAt: number;

	/**
	 * Timestamp when negotiation state was last updated.
	 */
	updatedAt: number;
}
