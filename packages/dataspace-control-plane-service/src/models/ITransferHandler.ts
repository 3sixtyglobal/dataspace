// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@3sixty/core";
import type { IDataspaceDataPlaneComponent } from "@3sixty/dataspace-models";
import type {
	DataspaceProtocolTransferProcessStateType,
	IDataspaceProtocolDataAddress
} from "@3sixty/standards-dataspace-protocol";
import type { ITransferHandlerPrepareContext } from "./ITransferHandlerPrepareContext.js";
import type { ITransferHandlerStartContext } from "./ITransferHandlerStartContext.js";

/**
 * Format-specific handler for transfer process operations.
 * One implementation exists per DataspaceTransferFormat value; the TransferHandlerFactory
 * returns the correct instance keyed on the format string.
 */
export interface ITransferHandler extends IComponent {
	/**
	 * Optionally build a consumer dataAddress for the TransferRequestMessage.
	 * Called during prepareTransfer. Returns undefined for formats that do not
	 * require a consumer-supplied dataAddress (PULL and POST).
	 * @param ctx The prepare context.
	 * @returns The consumer dataAddress, or undefined if not required for this format.
	 */
	buildConsumerDataAddress(
		ctx: ITransferHandlerPrepareContext
	): IDataspaceProtocolDataAddress | undefined;

	/**
	 * Build the provider dataAddress for the TransferStartMessage.
	 * Called during startTransfer (provider role). Throws a GeneralError when
	 * required configuration (e.g. dataPlanePath) is absent.
	 * @param ctx The start context.
	 * @returns The provider dataAddress, or undefined if not applicable.
	 */
	buildProviderStartDataAddress(
		ctx: ITransferHandlerStartContext
	): Promise<IDataspaceProtocolDataAddress | undefined>;

	/**
	 * Post-start hook for the provider role. Called after state has been persisted
	 * to STARTED. PUSH transfers set up (or resume) the data-plane push subscription
	 * here; all other formats are no-ops.
	 * @param dataPlaneComponent The data plane component instance.
	 * @param consumerPid The consumer process ID.
	 * @param previousState The state before the STARTED transition.
	 * @returns A promise that resolves when the hook completes.
	 */
	onProviderStart(
		dataPlaneComponent: IDataspaceDataPlaneComponent,
		consumerPid: string,
		previousState: DataspaceProtocolTransferProcessStateType
	): Promise<void>;

	/**
	 * Called after a transfer transitions to COMPLETED.
	 * PUSH and POST tear down the push subscription; PULL is a no-op.
	 * @param dataPlaneComponent The data plane component instance.
	 * @param consumerPid The consumer process ID.
	 * @returns A promise that resolves when the hook completes.
	 */
	onComplete(dataPlaneComponent: IDataspaceDataPlaneComponent, consumerPid: string): Promise<void>;

	/**
	 * Called after a transfer transitions to SUSPENDED.
	 * PUSH and POST suspend the push subscription; PULL is a no-op.
	 * @param dataPlaneComponent The data plane component instance.
	 * @param consumerPid The consumer process ID.
	 * @returns A promise that resolves when the hook completes.
	 */
	onSuspend(dataPlaneComponent: IDataspaceDataPlaneComponent, consumerPid: string): Promise<void>;

	/**
	 * Called after a transfer transitions to TERMINATED.
	 * PUSH and POST tear down the push subscription; PULL is a no-op.
	 * @param dataPlaneComponent The data plane component instance.
	 * @param consumerPid The consumer process ID.
	 * @returns A promise that resolves when the hook completes.
	 */
	onTerminate(dataPlaneComponent: IDataspaceDataPlaneComponent, consumerPid: string): Promise<void>;
}
