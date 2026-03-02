// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	DataspaceProtocolTransferProcessStateType,
	IDataspaceProtocolDataAddress
} from "@twin.org/standards-dataspace-protocol";
import type { IOdrlPolicy } from "@twin.org/standards-w3c-odrl";

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
	policies?: IOdrlPolicy[];

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
	 * Callback address for Consumer notifications.
	 * URI where messages to the Consumer should be sent.
	 */
	callbackAddress?: string;

	/**
	 * Data format from the Dataset Distribution.
	 * Specified by a Distribution for the Dataset associated with the Agreement.
	 */
	format?: string;

	/**
	 * Data address for push mode transfers.
	 * Contains endpoint information where data should be pushed (for Activity Stream push mode).
	 * Only present when format is Http-Push-Activity-Stream-Format or Http-Post-Activity-Stream-Format.
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
