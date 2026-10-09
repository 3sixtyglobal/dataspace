// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property, SortDirection } from "@3sixty/entity";
import type {
	DataspaceProtocolTransferProcessStateType,
	IDataspaceProtocolDataAddress
} from "@3sixty/standards-dataspace-protocol";
import type { TransferProcessRole } from "../models/controlPlane/transferProcessRole.js";

/**
 * Transfer Process for shared storage between Control Plane and Data Plane.
 * This entity is the persistent representation of ITransferProcess.
 */
@entity({ version: 1 })
export class TransferProcess {
	/**
	 * Internal id, the primary key. Both role records of a self transfer share consumerPid and
	 * providerPid, so only the internal id is collision-free within one partition.
	 */
	@property({ type: "string", isPrimary: true, maxLength: 255 })
	public id!: string;

	/**
	 * Consumer Process ID from the DSP protocol.
	 * Indexed for lookup by consumerPid.
	 */
	@property({ type: "string", maxLength: 255, isSecondary: true })
	public consumerPid!: string;

	/**
	 * Provider Process ID from the DSP protocol.
	 * Indexed for lookup by providerPid.
	 */
	@property({ type: "string", maxLength: 255, isSecondary: true })
	public providerPid!: string;

	/**
	 * Agreement ID linking to the rights-management Agreement.
	 */
	@property({ type: "string", maxLength: 255 })
	public agreementId!: string;

	/**
	 * Transfer Process state from the DSP protocol.
	 * One of: REQUESTED, STARTED, COMPLETED, SUSPENDED, TERMINATED.
	 */
	@property({ type: "string", maxLength: 16 })
	public state!: DataspaceProtocolTransferProcessStateType;

	/**
	 * Dataset ID for DSC resolution.
	 */
	@property({ type: "string", maxLength: 255 })
	public datasetId!: string;

	/**
	 * Offer ID from the original Catalog offer.
	 */
	@property({ type: "string", maxLength: 255 })
	public offerId!: string;

	/**
	 * Consumer identity (DID or URI).
	 */
	@property({ type: "string", maxLength: 255, optional: true })
	public consumerIdentity?: string;

	/**
	 * Provider identity (DID or URI).
	 */
	@property({ type: "string", maxLength: 255, optional: true })
	public providerIdentity?: string;

	/**
	 * This node's role in the transfer, captured at write time so state transitions and async delivery
	 * can tell which party we are without inferring it from the matched PID (a self transfer stores two
	 * records sharing both pids). Optional for back-compat with records written before this field existed.
	 */
	@property({ type: "string", maxLength: 128, optional: true })
	public localRole?: TransferProcessRole;

	/**
	 * Data format from the Dataset Distribution.
	 */
	@property({ type: "string", maxLength: 128, optional: true })
	public format?: string;

	/**
	 * Callback address for Consumer notifications.
	 */
	@property({ type: "string", format: "uri", optional: true })
	public callbackAddress?: string;

	/**
	 * The organization that owns this transfer process, captured from the request context at write time.
	 */
	@property({ type: "string", maxLength: 255 })
	public organizationIdentity!: string;

	/**
	 * Creation timestamp (ISO string format).
	 */
	@property({ type: "string", format: "date-time", sortDirection: SortDirection.Descending })
	public dateCreated!: string;

	/**
	 * Last update timestamp (ISO string format).
	 */
	@property({ type: "string", format: "date-time" })
	public dateModified!: string;

	/**
	 * Data address for the transfer (stored as JSON): the consumer's inbox for PUSH, or the
	 * provider-built address persisted at start for PULL/POST; may expire while STARTED.
	 */
	@property({ type: "object", format: "json", optional: true })
	public dataAddress?: IDataspaceProtocolDataAddress;
}
