// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type {
	DataspaceProtocolTransferProcessStateType,
	IDataspaceProtocolContractNegotiation,
	IDataspaceProtocolContractNegotiationError,
	IDataspaceProtocolDataset,
	IDataspaceProtocolTransferCompletionMessage,
	IDataspaceProtocolTransferError,
	IDataspaceProtocolTransferProcess,
	IDataspaceProtocolTransferRequestMessage,
	IDataspaceProtocolTransferStartMessage,
	IDataspaceProtocolTransferSuspensionMessage,
	IDataspaceProtocolTransferTerminationMessage,
	IDataspaceProtocolVersionResponse
} from "@twin.org/standards-dataspace-protocol";
import type { IDataspaceAppDataset } from "./IDataspaceAppDataset.js";
import type { INegotiationCallback } from "./INegotiationCallback.js";
import type { ITransferCallback } from "./ITransferCallback.js";
import type { ITransferQueryResult } from "./ITransferQueryResult.js";

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
	 * When the caller's identity matches the local organization ID (implicit trust), an
	 * agreement with full access is created and stored immediately, registered callbacks
	 * are fired synchronously, and only `agreementId` is returned (no `negotiationId`).
	 *
	 * Otherwise the method returns immediately with a `negotiationId`. The caller is
	 * notified via the registered INegotiationCallback when the negotiation completes.
	 * The negotiation follows DSP state machine: REQUESTED → OFFERED → AGREED → VERIFIED → FINALIZED.
	 *
	 * The REST client does not support this method and throws a not supported error -
	 * use ComponentFactory.get() for the in-process service.
	 *
	 * DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/#negotiation-protocol
	 *
	 * @param datasetId The dataset ID from the provider's catalog.
	 * @param offerId The offer ID from the provider's catalog.
	 * @param providerEndpoint The provider's contract negotiation endpoint URL.
	 * @param trustPayload Trust payload for authentication (JWT or Verifiable Credential).
	 * @returns For implicit trust: `{ agreementId }`. For external negotiation: `{ negotiationId }`.
	 */
	negotiateAgreement(
		datasetId: string,
		offerId: string,
		providerEndpoint: string,
		trustPayload: unknown
	): Promise<{ negotiationId?: string; agreementId?: string }>;

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
				IDataspaceProtocolContractNegotiation | IDataspaceProtocolContractNegotiationError;
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
	 * Register a callback to receive transfer process state change notifications.
	 * Upstream modules register their callback here to be notified when a
	 * consumer-initiated transfer changes state (STARTED, COMPLETED, SUSPENDED,
	 * TERMINATED).
	 *
	 * The REST client does not support this method and throws a not supported error -
	 * use ComponentFactory.get() for the in-process service.
	 * @param key A unique key identifying this callback registration.
	 * @param callback The callback interface to register.
	 */
	registerTransferCallback(key: string, callback: ITransferCallback): void;

	/**
	 * Unregister a previously registered transfer callback.
	 * @param key The key used when registering the callback.
	 */
	unregisterTransferCallback(key: string): void;

	/**
	 * Prepare a data transfer as a Consumer.
	 * High-level convenience wrapper around the DSP Transfer Request protocol.
	 *
	 * This method:
	 * 1. Generates a consumerPid.
	 * 2. POSTs a TransferRequestMessage to the provider's DSP endpoint.
	 * 3. Persists a local TransferProcess in REQUESTED state (only if provider accepts).
	 * 4. Returns the consumerPid immediately.
	 *
	 * The caller is notified of subsequent state changes (STARTED, COMPLETED, etc.)
	 * via the registered ITransferCallback. The transfer moves to STARTED when the
	 * provider POSTs a TransferStartMessage back to this node's callback address.
	 *
	 * The REST client does not support this method and throws a not supported error -
	 * use ComponentFactory.get() for the in-process service.
	 *
	 * @param agreementId The finalized agreement ID (from contract negotiation).
	 * @param providerEndpoint The provider's DSP control plane base URL.
	 * @param format The transfer format (e.g. "HttpData-PULL", "HttpData-PUSH").
	 * @param trustPayload Trust payload for authentication.
	 * @returns The consumerPid of the newly created TransferProcess.
	 */
	prepareTransfer(
		agreementId: string,
		providerEndpoint: string,
		format: string,
		trustPayload: unknown
	): Promise<{ consumerPid: string }>;

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
	 * @remarks Whether the transfer auto-starts is a provider-side decision (service config), not
	 * something the consumer can request.
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
	 * @param trustPayload Trust payload containing authorization information (JWT, VC, etc.).
	 * @returns Transfer Start Message (DSP compliant) with dataAddress for PULL transfers, or TransferError if the operation fails.
	 */
	startTransfer(
		message: IDataspaceProtocolTransferStartMessage,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferStartMessage | IDataspaceProtocolTransferError>;

	/**
	 * Start a Transfer Process as the Provider.
	 * Implements DSP Transfer Process Protocol.
	 *
	 * Builds a DSP TransferStartMessage for a transfer this node already accepted (created in
	 * REQUESTED state by requestTransfer, or in SUSPENDED state to resume), transitions it to
	 * STARTED, and POSTs the message to the consumer's callback address. Use this when the
	 * provider did not auto-start the transfer (the autoStartTransfers config is off) and now
	 * wants to start (or resume) it explicitly.
	 *
	 * DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#transfer-start-message
	 *
	 * @param pid The Process ID (consumerPid or providerPid) identifying the transfer to start.
	 * @param trustPayload Trust payload proving the caller is the provider (JWT, VC, etc.).
	 * @returns Transfer Start Message (DSP compliant) with dataAddress for PULL transfers, or TransferError if the operation fails.
	 */
	transferStarted(
		pid: string,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferStartMessage | IDataspaceProtocolTransferError>;

	// ============================================================================
	// SHARED STATE MANAGEMENT OPERATIONS
	// Methods that can be called by either Consumer or Provider, except
	// completeTransfer which is consumer-initiated only
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

	/**
	 * Query Transfer Processes by agreement id.
	 * Lets a caller check whether transfers already exist for an agreement
	 * (e.g. before initiating a new one) without knowing any process ids.
	 *
	 * Role Performed: Consumer / Provider
	 * Called by: Consumer orchestration before requesting a new transfer, or either
	 * party inspecting the transfers attached to an agreement on their side.
	 *
	 * Results are limited to transfers where the authenticated caller is a party
	 * (consumer or provider identity). A returned dataAddress is a point-in-time copy;
	 * if its token has expired the data plane rejects it and a new start is required.
	 * @param agreementId The agreement id to look up transfer processes for.
	 * @param state Optional filter to a single transfer process state.
	 * @param cursor Optional pagination cursor from a previous result page.
	 * @param trustPayload Trust payload containing authorization information (JWT, VC, etc.).
	 * @returns The matching transfer processes and a pagination cursor when more pages exist, empty when none match.
	 */
	queryDataTransfer(
		agreementId: string,
		state: DataspaceProtocolTransferProcessStateType | undefined,
		cursor: string | undefined,
		trustPayload: unknown
	): Promise<ITransferQueryResult>;

	// ============================================================================
	// DATASET MANAGEMENT
	// CRUD over the tenant-scoped dataset records the Control Plane reads at
	// start time to populate the federated catalogue.
	// ============================================================================

	/**
	 * Register an app dataset for a dataspace app, owned by the calling tenant.
	 * @param id Optional explicit id. If omitted, derived from `dataset["@id"]`
	 * or generated.
	 * @param appId The dataspace app this dataset belongs to (matches
	 * `DataspaceAppFactory` registration name).
	 * @param dataset The dataset payload (may omit system-stamped fields).
	 * @param options Optional dataset settings.
	 * @param options.transferIdleTimeoutMs Optional idle window (ms) overriding the node-level idle
	 * policy for this dataset's PULL transfers; 0 disables it for this dataset.
	 * @returns The resolved dataset id.
	 */
	createAppDataset(
		id: string | undefined,
		appId: string,
		dataset: IDataspaceProtocolDataset,
		options?: { transferIdleTimeoutMs?: number }
	): Promise<string>;

	/**
	 * Get an app dataset record owned by the calling tenant.
	 * @param id The stored app dataset id.
	 * @returns The stored app dataset record.
	 */
	getAppDataset(id: string): Promise<IDataspaceAppDataset>;

	/**
	 * List the app datasets owned by the calling tenant.
	 * @param cursor Optional pagination cursor.
	 * @param limit Optional maximum number of entries to return.
	 * @returns The stored app datasets and the next-page cursor if more exist.
	 */
	listAppDatasets(
		cursor?: string,
		limit?: number
	): Promise<{
		entities: IDataspaceAppDataset[];
		cursor?: string;
	}>;

	/**
	 * Update an app dataset record owned by the calling tenant.
	 * @param id The stored app dataset id.
	 * @param appId The dataspace app this dataset belongs to.
	 * @param dataset The dataset payload.
	 * @param options Optional dataset settings.
	 * @param options.transferIdleTimeoutMs Optional idle window (ms) overriding the node-level idle
	 * policy for this dataset's PULL transfers; 0 disables it for this dataset.
	 * @returns A promise that resolves when the dataset has been updated in storage and the catalogue.
	 */
	updateAppDataset(
		id: string,
		appId: string,
		dataset: IDataspaceProtocolDataset,
		options?: { transferIdleTimeoutMs?: number }
	): Promise<void>;

	/**
	 * Delete an app dataset record owned by the calling tenant.
	 * @param id The stored app dataset id.
	 * @returns A promise that resolves when the dataset has been removed from storage and the catalogue.
	 */
	deleteAppDataset(id: string): Promise<void>;

	// ============================================================================
	// DSP VERSION DISCOVERY
	// ============================================================================

	/**
	 * Return the Dataspace Protocol versions supported by this connector.
	 * Used by the GET /.well-known/dspace-version discovery endpoint.
	 * The path for each entry is derived from the connector's configured base route.
	 * @returns The protocol version response listing all supported DSP versions.
	 */
	getProtocolVersions(): Promise<IDataspaceProtocolVersionResponse>;
}
