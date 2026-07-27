// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Machine-readable codes set on provider-initiated TransferTerminationMessages
 * by the control plane's transfer lifecycle policies.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TransferTerminationCode = {
	/**
	 * A Provider-side STARTED transfer had no data-plane activity within the configured idle window.
	 */
	IdleTimeout: "idleTimeout"
} as const;

/**
 * Type for TransferTerminationCode values.
 */
export type TransferTerminationCode =
	(typeof TransferTerminationCode)[keyof typeof TransferTerminationCode];
