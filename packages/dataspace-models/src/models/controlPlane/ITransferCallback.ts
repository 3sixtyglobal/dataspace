// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	DataspaceProtocolTransferProcessStateType,
	IDataspaceProtocolTransferStartMessage
} from "@3sixty/standards-dataspace-protocol";

/**
 * Callback interface for transfer process state change notifications.
 * Upstream modules register an implementation via
 * IDataspaceControlPlaneComponent.registerTransferCallback() to be
 * notified when a consumer-initiated transfer changes state.
 */
export interface ITransferCallback {
	/**
	 * Called on every DSP-level state transition for the transfer process.
	 * @param consumerPid The consumer-side process ID.
	 * @param state The new DSP state.
	 * @returns Nothing.
	 */
	onStateChanged(
		consumerPid: string,
		state: DataspaceProtocolTransferProcessStateType
	): Promise<void>;

	/**
	 * Called when the provider sends a TransferStartMessage to the consumer.
	 * The transfer is now STARTED and data can be accessed.
	 * @param consumerPid The consumer-side process ID.
	 * @param message The full DSP TransferStartMessage (contains dataAddress for PULL transfers).
	 * @returns Nothing.
	 */
	onStarted(consumerPid: string, message: IDataspaceProtocolTransferStartMessage): Promise<void>;

	/**
	 * Called when the transfer reaches COMPLETED state.
	 * @param consumerPid The consumer-side process ID.
	 * @returns Nothing.
	 */
	onCompleted(consumerPid: string): Promise<void>;

	/**
	 * Called when the transfer is SUSPENDED.
	 * @param consumerPid The consumer-side process ID.
	 * @param reason Optional suspension reason from the DSP message.
	 * @returns Nothing.
	 */
	onSuspended(consumerPid: string, reason?: string): Promise<void>;

	/**
	 * Called when the transfer is TERMINATED.
	 * @param consumerPid The consumer-side process ID.
	 * @param reason Optional termination reason from the DSP message.
	 * @returns Nothing.
	 */
	onTerminated(consumerPid: string, reason?: string): Promise<void>;

	/**
	 * Called when the transfer fails. Optional, for parity with INegotiationCallback.
	 * @param consumerPid The consumer-side process ID.
	 * @param reason The failure reason.
	 * @returns Nothing.
	 */
	onFailed?(consumerPid: string, reason: string): Promise<void>;

	/**
	 * Called when the transfer times out: a consumer-side REQUESTED transfer the provider never
	 * progressed, or a provider-side STARTED transfer idle beyond the configured window. Optional:
	 * otherwise the control plane falls back to `onFailed` with the timeout reason.
	 * @param consumerPid The consumer-side process ID.
	 * @returns Nothing.
	 */
	onTimeout?(consumerPid: string): Promise<void>;
}
