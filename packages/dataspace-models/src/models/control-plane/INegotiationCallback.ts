// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { DataspaceProtocolContractNegotiationStateType } from "@twin.org/standards-dataspace-protocol";
import type { IOdrlAgreement, IOdrlOffer } from "@twin.org/standards-w3c-odrl";

/**
 * Callback interface for negotiation state change notifications.
 * Upstream modules register an implementation of this interface
 * via IDataspaceControlPlaneComponent.registerNegotiationCallback()
 * to be notified when PNP callbacks fire.
 */
export interface INegotiationCallback {
	/**
	 * Called when the negotiation state changes (offer received, agreement received).
	 * @param negotiationId The negotiation ID.
	 * @param state The new state.
	 * @param data Optional data associated with the state change.
	 * @param data.offer The offer received from the provider.
	 * @param data.agreement The agreement received from the provider.
	 * @returns Nothing.
	 */
	onStateChanged(
		negotiationId: string,
		state: DataspaceProtocolContractNegotiationStateType,
		data?: { offer?: IOdrlOffer; agreement?: IOdrlAgreement }
	): Promise<void>;

	/**
	 * Called when the negotiation completes successfully (finalized).
	 * @param negotiationId The negotiation ID.
	 * @param agreementId The agreement ID (from agreement.uid).
	 * @returns Nothing.
	 */
	onCompleted(negotiationId: string, agreementId: string): Promise<void>;

	/**
	 * Called when the negotiation fails (terminated or stalled).
	 * @param negotiationId The negotiation ID.
	 * @param reason The failure reason.
	 * @returns Nothing.
	 */
	onFailed(negotiationId: string, reason: string): Promise<void>;
}
