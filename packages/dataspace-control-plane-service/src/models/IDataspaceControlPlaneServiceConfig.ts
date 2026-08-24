// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Dataspace Control Plane service configuration.
 */
export interface IDataspaceControlPlaneServiceConfig {
	/**
	 * Override the default trust generator type for token generation.
	 */
	overrideTrustGeneratorType?: string;

	/**
	 * Base route path for the data plane service (path only, e.g. "dataspace"), combined with the
	 * public origin to form the endpoints sent to transfer counterparties. Must be the mount-point
	 * prefix of the data plane routes, never a sub-path such as `/entities` or `/inbox`. Unset
	 * disables PULL and PUSH transfers.
	 */
	dataPlanePath?: string;

	/**
	 * Control plane callback mount path (path only, e.g. "dataspace"), combined with this node's
	 * public origin to form the consumer callbackAddress providers post DSP messages back to.
	 * Defaults to "dataspace-control-plane".
	 */
	callbackPath?: string;

	/**
	 * Whether the provider immediately starts a requested transfer; a provider-side decision the
	 * consumer cannot influence. When false (the default) transfers stay in REQUESTED until
	 * transferStarted is called.
	 */
	autoStartTransfers?: boolean;

	/**
	 * How long (ms) a negotiation may sit without progress before the periodic cleanup removes it
	 * and notifies the registered callbacks. Defaults to 1800000 (30 minutes).
	 */
	stalledNegotiationTimeoutMs?: number;

	/**
	 * How long (ms) a consumer-initiated transfer may sit in REQUESTED before the periodic cleanup
	 * removes it and notifies the registered callbacks. Defaults to 1800000 (30 minutes).
	 */
	stalledTransferTimeoutMs?: number;

	/**
	 * Idle window (ms) after which a Provider-side STARTED PULL transfer with no data-plane
	 * activity is terminated. Overridable per app dataset via its transferIdleTimeoutMs (0 disables
	 * for that dataset); unset (the default) disables the policy node-wide.
	 */
	providerTransferIdleTimeoutMs?: number;

	/**
	 * Interval (ms) for the provider transfer policy sweep, rounded to whole minutes (minimum one).
	 * Defaults to 300000 (5 minutes).
	 */
	providerTransferPolicySweepIntervalMs?: number;

	/**
	 * The window (ms) after which an agreement with no live transfer and no recent activity is
	 * removed from the PAP. Unset (the default) or non-positive disables the sweep.
	 */
	agreementUnusedThresholdMs?: number;

	/**
	 * Interval (ms) for the agreement sweep; non-positive falls back to the default of 3600000
	 * (1 hour).
	 */
	agreementSweepIntervalMs?: number;
}
