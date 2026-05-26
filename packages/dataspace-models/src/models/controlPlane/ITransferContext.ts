// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	DataspaceProtocolTransferProcessStateType,
	IDataspaceProtocolAgreement,
	IDataspaceProtocolDataAddress
} from "@twin.org/standards-dataspace-protocol";

/**
 * Transfer Context data structure.
 * Contains all information needed by DSC to execute queries.
 * This is NOT part of the DSP protocol - it's a TWIN internal API
 * used by dataspace-control-plane to resolve consumerPid to datasetId and policies.
 */
export interface ITransferContext {
	/**
	 * Consumer Process ID.
	 */
	consumerPid: string;

	/**
	 * Provider Process ID.
	 */
	providerPid: string;

	/**
	 * Agreement associated with this Transfer Process.
	 * Contains permissions, obligations, and prohibitions that DSC uses for runtime policy enforcement.
	 */
	agreement: IDataspaceProtocolAgreement;

	/**
	 * Dataset ID - what the DSC needs to execute the query.
	 * Convenience field extracted from agreement.target for quick access.
	 */
	datasetId: string;

	/**
	 * Offer ID.
	 */
	offerId: string;

	/**
	 * Current Transfer Process state.
	 * DSC should only allow queries if state is STARTED.
	 */
	state: DataspaceProtocolTransferProcessStateType;

	/**
	 * Consumer identity (for auditing).
	 */
	consumerIdentity?: string;

	/**
	 * Provider identity (for auditing).
	 * Extracted from Agreement's assigner field.
	 */
	providerIdentity?: string;

	/**
	 * Data address for consumer-initiated push transfers (HttpProxy-PUSH).
	 * Contains the consumer's /inbox endpoint as supplied in the TransferRequestMessage.
	 * Absent for PULL (HttpProxy-PULL) and provider-initiated push (HttpProxy-POST),
	 * where the consumer deliberately omits a dataAddress.
	 */
	dataAddress?: IDataspaceProtocolDataAddress;
}
