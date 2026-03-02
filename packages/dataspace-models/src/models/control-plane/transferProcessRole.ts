// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The role of a participant in a Transfer Process.
 * Determines whether the party is acting as Consumer or Provider.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TransferProcessRole = {
	/**
	 * Consumer role - the party requesting data.
	 */
	Consumer: "consumer",

	/**
	 * Provider role - the party providing data.
	 */
	Provider: "provider"
} as const;

/**
 * Type for TransferProcessRole values.
 */
export type TransferProcessRole = (typeof TransferProcessRole)[keyof typeof TransferProcessRole];
