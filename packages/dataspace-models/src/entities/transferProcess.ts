// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property, SortDirection } from "@twin.org/entity";
import type { IRightsManagementPolicy } from "@twin.org/rights-management-models";
import type {
	DataspaceProtocolTransferProcessStateType,
	IDataspaceProtocolDataAddress
} from "@twin.org/standards-dataspace-protocol";
import type { TransferProcessRole } from "../models/controlPlane/transferProcessRole.js";

/**
 * Transfer Process for shared storage between Control Plane and Data Plane.
 * This entity is the persistent representation of ITransferProcess.
 */
@entity()
export class TransferProcess {
	/**
	 * The consumer PID is the primary key.
	 * Used for direct lookup by consumerPid.
	 */
	@property({ type: "string", isPrimary: true })
	public consumerPid!: string;

	/**
	 * Internal UUID for storage (secondary key for providerPid lookup).
	 */
	@property({ type: "string" })
	public id!: string;

	/**
	 * Provider Process ID from the DSP protocol.
	 * Indexed for lookup by providerPid.
	 */
	@property({ type: "string", isSecondary: true })
	public providerPid!: string;

	/**
	 * Agreement ID linking to the rights-management Agreement.
	 */
	@property({ type: "string" })
	public agreementId!: string;

	/**
	 * Transfer Process state from the DSP protocol.
	 * One of: REQUESTED, STARTED, COMPLETED, SUSPENDED, TERMINATED.
	 */
	@property({ type: "string" })
	public state!: DataspaceProtocolTransferProcessStateType;

	/**
	 * Dataset ID for DSC resolution.
	 */
	@property({ type: "string" })
	public datasetId!: string;

	/**
	 * Offer ID from the original Catalog offer.
	 */
	@property({ type: "string" })
	public offerId!: string;

	/**
	 * Consumer identity (DID or URI).
	 */
	@property({ type: "string", optional: true })
	public consumerIdentity?: string;

	/**
	 * Provider identity (DID or URI).
	 */
	@property({ type: "string", optional: true })
	public providerIdentity?: string;

	/**
	 * This node's role in the transfer, captured at write time so state transitions and async delivery
	 * can tell which party we are without inferring it from the matched PID (consumerPid is the primary
	 * key on both nodes). Optional for back-compat with records written before this field existed.
	 */
	@property({ type: "string", optional: true })
	public localRole?: TransferProcessRole;

	/**
	 * Data format from the Dataset Distribution.
	 */
	@property({ type: "string", optional: true })
	public format?: string;

	/**
	 * Callback address for Consumer notifications.
	 */
	@property({ type: "string", optional: true })
	public callbackAddress?: string;

	/**
	 * The organization that owns this transfer process, captured from the request context at write time.
	 */
	@property({ type: "string" })
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
	 * Policies from the Agreement (stored as JSON).
	 */
	@property({ type: "array", format: "json", optional: true })
	public policies?: IRightsManagementPolicy[];

	/**
	 * Data address for the transfer (stored as JSON): the consumer's inbox for PUSH, or the
	 * provider-built address persisted at start for PULL/POST; may expire while STARTED.
	 */
	@property({ type: "object", format: "json", optional: true })
	public dataAddress?: IDataspaceProtocolDataAddress;
}
