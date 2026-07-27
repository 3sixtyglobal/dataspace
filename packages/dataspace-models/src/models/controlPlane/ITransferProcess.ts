// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRightsManagementPolicy } from "@twin.org/rights-management-models";
import type {
	DataspaceProtocolTransferProcessStateType,
	IDataspaceProtocolDataAddress
} from "@twin.org/standards-dataspace-protocol";
import type { TransferProcessRole } from "./transferProcessRole.js";

/**
 * Transfer Process for internal storage.
 * Combines DSP protocol fields with internal TWIN fields.
 * This is NOT the DSP wire format (use ITransferProcess from standards for that).
 */
export interface ITransferProcess {
	/**
	 * Internal UUID (primary key for entity storage).
	 */
	id: string;

	// === DSP Protocol fields (public) ===

	/**
	 * Consumer Process ID from the DSP protocol.
	 * Refers to the transfer identifier on the Consumer side.
	 */
	consumerPid: string;

	/**
	 * Provider Process ID from the DSP protocol.
	 * Refers to the transfer identifier on the Provider side.
	 */
	providerPid: string;

	/**
	 * Transfer Process state from the DSP protocol.
	 * One of: REQUESTED, STARTED, COMPLETED, SUSPENDED, TERMINATED.
	 */
	state: DataspaceProtocolTransferProcessStateType;

	// === Internal TWIN fields (NOT in DSP protocol) ===

	/**
	 * Agreement ID linking to the rights-management Agreement.
	 * Used to resolve policies and permissions.
	 */
	agreementId: string;

	/**
	 * Dataset ID for DSC resolution.
	 * Identifies the dataset being transferred.
	 */
	datasetId: string;

	/**
	 * Offer ID from the original Catalog offer.
	 */
	offerId: string;

	/**
	 * Policies from the Agreement.
	 * Used by DSC for runtime policy enforcement.
	 */
	policies?: IRightsManagementPolicy[];

	/**
	 * Consumer identity (DID or URI).
	 * Used for auditing and access control.
	 */
	consumerIdentity?: string;

	/**
	 * Provider identity (DID or URI).
	 * Used for auditing.
	 */
	providerIdentity?: string;

	/**
	 * This node's role in the transfer, captured at write time so state transitions and async delivery
	 * can tell which party we are without inferring it from the matched PID. Optional for back-compat.
	 */
	localRole?: TransferProcessRole;

	/**
	 * Callback address for Consumer notifications.
	 * URI where messages to the Consumer should be sent.
	 */
	callbackAddress?: string;

	/**
	 * The organization that owns this transfer process, captured at write time so async
	 * delivery tasks and delayed state transitions can re-enter the right organization context.
	 */
	organizationIdentity: string;

	/**
	 * Data format from the Dataset Distribution.
	 * Specified by a Distribution for the Dataset associated with the Agreement.
	 */
	format?: string;

	/**
	 * Data address for consumer-initiated push transfers (HttpData-PUSH).
	 * Contains the consumer's /inbox endpoint as supplied in the TransferRequestMessage.
	 * Absent for PULL (HttpData-PULL) and provider-initiated push (HttpData-POST),
	 * where the consumer deliberately omits a dataAddress.
	 */
	dataAddress?: IDataspaceProtocolDataAddress;

	/**
	 * Creation timestamp.
	 */
	dateCreated: Date;

	/**
	 * Last update timestamp.
	 */
	dateModified: Date;
}
