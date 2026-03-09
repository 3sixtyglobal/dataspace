// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type {
	IDataspaceProtocolContractNegotiation,
	IDataspaceProtocolContractNegotiationError,
	IDataspaceProtocolTransferCompletionMessage,
	IDataspaceProtocolTransferError,
	IDataspaceProtocolTransferProcess,
	IDataspaceProtocolTransferRequestMessage,
	IDataspaceProtocolTransferStartMessage,
	IDataspaceProtocolTransferSuspensionMessage,
	IDataspaceProtocolTransferTerminationMessage
} from "@twin.org/standards-dataspace-protocol";
import type { INegotiationCallback } from "./INegotiationCallback.js";

/**
 * Dataspace Control Plane Component interface.
 * Implements Eclipse Dataspace Protocol (DSP) specifications:
 * - Contract Negotiation Protocol
 * - Transfer Process Protocol
 *
 * This component acts as the Control Plane for contract negotiation and
 * data transfers between nodes in a dataspace.
 *
 * DSP 2025-1 Specification: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/
 */
export interface IDataspaceControlPlaneComponent extends IComponent {
	// ============================================================================
	// CONTRACT NEGOTIATION PROTOCOL (DSP)
	// Methods for negotiating agreements before transfers
	// ============================================================================

	/**
	 * Register a callback to receive negotiation state change notifications.
	 * Upstream modules (e.g. supply-chain) register their callback here
	 * to be notified when negotiations complete, fail, or change state.
	 * @param key A unique key identifying this callback registration.
	 * @param callback The callback interface to register.
	 */
	registerNegotiationCallback(key: string, callback: INegotiationCallback): void;

	/**
	 * Unregister a previously registered negotiation callback.
	 * @param key The key used when registering the callback.
	 */
	unregisterNegotiationCallback(key: string): void;

	/**
	 * Negotiate a contract agreement with a provider.
	 * Implements DSP Contract Negotiation Protocol.
	 *
	 * Returns immediately with a negotiationId. The caller is notified
	 * via the registered INegotiationCallback when the negotiation completes.
	 * The negotiation follows DSP state machine: REQUESTED → OFFERED → AGREED → VERIFIED → FINALIZED.
	 *
	 * This method has NO REST client implementation — it is only accessible via ComponentFactory.get().
	 *
	 * DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/#negotiation-protocol
	 *
	 * @param datasetId The dataset ID from the provider's catalog.
	 * @param offerId The offer ID from the provider's catalog.
	 * @param providerEndpoint The provider's contract negotiation endpoint URL.
	 * @param publicOrigin The public origin URL of this control plane (for callbacks).
	 * @param trustPayload Trust payload for authentication (JWT or Verifiable Credential).
	 * @returns The negotiation ID for tracking. Use registered callback for completion.
	 */
	negotiateAgreement(
		datasetId: string,
		offerId: string,
		providerEndpoint: string,
		publicOrigin: string,
		trustPayload: unknown
	): Promise<{ negotiationId: string }>;

	/**
	 * Get the current state of a contract negotiation.
	 * Implements DSP Contract Negotiation Protocol.
	 *
	 * Queries the current state of an ongoing or completed negotiation.
	 * Use this to monitor negotiation progress.
	 * Returns the DSP-compliant negotiation state or error.
	 *
	 * DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/#negotiation-protocol
	 *
	 * @param negotiationId The unique identifier of the negotiation.
	 * @param trustPayload Trust payload for authentication.
	 * @returns DSP ContractNegotiation with current state, or error.
	 */
	getNegotiation(
		negotiationId: string,
		trustPayload: unknown
	): Promise<IDataspaceProtocolContractNegotiation | IDataspaceProtocolContractNegotiationError>;

	/**
	 * Get negotiation history.
	 * Queries past contract negotiations for audit trails and debugging.
	 *
	 * Returns a list of past negotiations with their states and metadata.
	 * Supports optional filtering by state and pagination via cursor.
	 *
	 * @param state Optional filter by negotiation state (e.g., "FINALIZED", "TERMINATED").
	 * @param cursor Optional pagination cursor for fetching next page.
	 * @param trustPayload Trust payload for authentication.
	 * @returns List of negotiation history entries with pagination cursor.
	 */
	getNegotiationHistory(
		state: string | undefined,
		cursor: string | undefined,
		trustPayload: unknown
	): Promise<{
		negotiations: {
			negotiation:
				| IDataspaceProtocolContractNegotiation
				| IDataspaceProtocolContractNegotiationError;
			createdAt: string;
			offerId?: string;
			agreementId?: string;
		}[];
		cursor?: string;
		count: number;
	}>;

	// ============================================================================
	// TRANSFER PROCESS PROTOCOL (DSP)
	// Methods for managing data transfers after agreements are established
	// ============================================================================

	// ----------------------------------------------------------------------------
	// CONSUMER SIDE OPERATIONS
	// Methods called by the Data Consumer to initiate transfers
	// ----------------------------------------------------------------------------

	/**
	 * Request a Transfer Process.
	 * Creates a new Transfer Process in REQUESTED state.
	 *
	 * Role Performed: Provider
	 * Called by: Consumer when it wants to request a new Transfer Process
	 *
	 * DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#transfer-request-message
	 *
	 * @param request Transfer request message (DSP compliant) containing agreementId,
	 * consumerPid, callbackAddress, and format.
	 * @param trustPayload Trust payload containing authorization information (JWT, VC, etc.).
	 * The consumer must prove their identity by providing a valid trust payload.
	 * @returns Transfer Process (DSP compliant) with state REQUESTED, including
	 * both consumerPid and providerPid, or TransferError if the operation fails.
	 */
	requestTransfer(
		request: IDataspaceProtocolTransferRequestMessage,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError>;

	// ============================================================================
	// PROVIDER SIDE OPERATIONS
	// Methods called by the Data Provider to respond to transfer requests
	// ============================================================================

	/**
	 * Start a Transfer Process.
	 * Transitions Transfer Process from REQUESTED to STARTED state, or resumes from SUSPENDED state.
	 *
	 * Role Performed: Provider / Consumer
	 * Called by: Provider when a Transfer Process starts, or Consumer to attempt to start a Transfer Process after it has been suspended
	 *
	 * DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#transfer-start-message
	 *
	 * @param message Transfer start message (DSP compliant).
	 * @param publicOrigin The public origin URL of this service (used to construct data plane endpoint for PULL transfers).
	 * @param trustPayload Trust payload containing authorization information (JWT, VC, etc.).
	 * @returns Transfer Start Message (DSP compliant) with dataAddress for PULL transfers, or TransferError if the operation fails.
	 */
	startTransfer(
		message: IDataspaceProtocolTransferStartMessage,
		publicOrigin: string,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferStartMessage | IDataspaceProtocolTransferError>;

	// ============================================================================
	// SHARED STATE MANAGEMENT OPERATIONS
	// Methods that can be called by either Consumer or Provider
	// ============================================================================

	/**
	 * Complete a Transfer Process.
	 * Transitions Transfer Process to COMPLETED state.
	 *
	 * Role Performed: Consumer / Provider
	 * Called by: Provider or Consumer when a Transfer process is completed on their side
	 *
	 * DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#transfer-completion-message
	 *
	 * @param message Transfer completion message (DSP compliant).
	 * @param trustPayload Trust payload containing authorization information (JWT, VC, etc.).
	 * @returns Transfer Process (DSP compliant) with state COMPLETED, or TransferError if the operation fails.
	 */
	completeTransfer(
		message: IDataspaceProtocolTransferCompletionMessage,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError>;

	/**
	 * Suspend a Transfer Process.
	 * Transitions Transfer Process to SUSPENDED state.
	 *
	 * Role Performed: Consumer / Provider
	 * Called by: Provider or Consumer when a Transfer process needs to be temporarily suspended on their side
	 *
	 * DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#transfer-suspension-message
	 *
	 * @param message Transfer suspension message (DSP compliant) with optional reason.
	 * @param trustPayload Trust payload containing authorization information (JWT, VC, etc.).
	 * @returns Transfer Process (DSP compliant) with state SUSPENDED, or TransferError if the operation fails.
	 */
	suspendTransfer(
		message: IDataspaceProtocolTransferSuspensionMessage,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError>;

	/**
	 * Terminate a Transfer Process.
	 * Transitions Transfer Process to TERMINATED state.
	 *
	 * Role Performed: Consumer / Provider
	 * Called by: Provider or Consumer when a Transfer process needs to be terminated on their side (e.g., due to error)
	 *
	 * DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#transfer-termination-message
	 *
	 * @param message Transfer termination message (DSP compliant) with optional reason.
	 * @param trustPayload Trust payload containing authorization information (JWT, VC, etc.).
	 * @returns Transfer Process (DSP compliant) with state TERMINATED, or TransferError if the operation fails.
	 */
	terminateTransfer(
		message: IDataspaceProtocolTransferTerminationMessage,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError>;

	/**
	 * Get Transfer Process State.
	 * Query the current state of a Transfer Process.
	 *
	 * Role Performed: Consumer / Provider
	 * Called by: Provider or Consumer when they need to check the status of a Transfer process on their side
	 *
	 * Supports role-agnostic lookup using either consumerPid or providerPid.
	 * The service will automatically detect which role the caller is acting as
	 * (Consumer or Provider) based on the PID provided.
	 *
	 * DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#ack-transfer-process
	 *
	 * @param pid The Process ID (consumerPid or providerPid) used to identify the transfer.
	 * @param trustPayload Trust payload containing authorization information (JWT, VC, etc.).
	 * @returns Transfer Process (DSP compliant) with current state, or TransferError if the operation fails.
	 */
	getTransferProcess(
		pid: string,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError>;
}
