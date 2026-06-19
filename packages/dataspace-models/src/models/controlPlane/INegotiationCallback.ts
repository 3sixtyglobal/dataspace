// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	DataspaceProtocolContractNegotiationStateType,
	IDataspaceProtocolAgreement,
	IDataspaceProtocolOffer
} from "@twin.org/standards-dataspace-protocol";

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
		data?: { offer?: IDataspaceProtocolOffer; agreement?: IDataspaceProtocolAgreement }
	): Promise<void>;

	/**
	 * Called when the negotiation finalizes.
	 * @param negotiationId The negotiation ID, or undefined for implicit-trust agreements.
	 * @param agreementId The agreement ID (from agreement.uid).
	 * @returns Nothing.
	 */
	onFinalized(negotiationId: string | undefined, agreementId: string): Promise<void>;

	/**
	 * Called when the negotiation fails (terminated or stalled).
	 * @param negotiationId The negotiation ID.
	 * @param reason The failure reason.
	 * @returns Nothing.
	 */
	onFailed(negotiationId: string, reason: string): Promise<void>;
}
