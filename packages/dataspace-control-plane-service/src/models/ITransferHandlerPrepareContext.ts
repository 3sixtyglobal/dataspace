// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Context supplied to buildConsumerDataAddress during prepareTransfer.
 */
export interface ITransferHandlerPrepareContext {
	/**
	 * The consumer process ID.
	 */
	consumerPid: string;

	/**
	 * The consumer's base origin URL.
	 */
	origin: string;

	/**
	 * The data plane path segment, if configured.
	 */
	dataPlanePath: string | undefined;

	/**
	 * The organization identity resolved from the current context.
	 */
	organizationIdentity: string;
}
