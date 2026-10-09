// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ITransferProcess } from "@3sixty/dataspace-models";
import type { ITrustComponent } from "@3sixty/trust-models";

/**
 * Context supplied to buildProviderStartDataAddress during startTransfer (provider role).
 */
export interface ITransferHandlerStartContext {
	/**
	 * The transfer process entity.
	 */
	entity: ITransferProcess;

	/**
	 * The provider's public origin URL.
	 */
	publicOrigin: string;

	/**
	 * The data plane path segment, if configured.
	 */
	dataPlanePath: string | undefined;

	/**
	 * The organization identity resolved from the current context.
	 */
	organizationIdentity: string;

	/**
	 * The trust component for generating access tokens.
	 */
	trustComponent: ITrustComponent;

	/**
	 * The override trust generator type, if configured.
	 */
	overrideTrustGeneratorType: string | undefined;
}
