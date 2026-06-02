// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * TWIN transfer format identifiers used in TransferRequestMessage.format.
 * Follows the Eclipse EDC canonical pattern: DestinationType-FlowType.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataspaceTransferFormat = {
	/**
	 * PULL mode: consumer queries data via a bearer-token-protected endpoint.
	 * Data flows: Consumer GET provider endpoint (with token).
	 */
	HttpDataPull: "HttpData-PULL",

	/**
	 * Consumer-initiated PUSH mode: consumer supplies their /inbox endpoint in the
	 * TransferRequestMessage. Provider pushes ActivityStreams objects to that endpoint.
	 * Data flows: Provider POST to consumer's /inbox.
	 */
	HttpDataPush: "HttpData-PUSH",

	/**
	 * Provider-initiated PUSH mode (inverted flow): consumer supplies no dataAddress.
	 * Provider returns its own /inbox URL + signed JWT. Consumer then posts data there.
	 * Data flows: Consumer POST to provider's /inbox.
	 */
	HttpDataPost: "HttpData-POST"
} as const;

/**
 * Type for the DataspaceTransferFormat const values.
 */
export type DataspaceTransferFormat =
	(typeof DataspaceTransferFormat)[keyof typeof DataspaceTransferFormat];
