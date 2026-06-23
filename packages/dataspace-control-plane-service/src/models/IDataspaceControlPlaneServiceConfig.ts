// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Dataspace Control Plane service configuration.
 */
export interface IDataspaceControlPlaneServiceConfig {
	/**
	 * Override the default trust generator type for token generation.
	 * If not specified, the default trust generator configured in the trust component will be used.
	 */
	overrideTrustGeneratorType?: string;

	/**
	 * Data plane endpoint path for PULL transfers (path only, not full URL).
	 * Will be combined with the public origin.
	 *
	 * REQUIRED if PULL transfers are supported.
	 * If not specified, PULL transfers will not be available.
	 *
	 * Example: "data-plane/data" or "api/data-plane/data"
	 */
	dataPlanePath?: string;

	/**
	 * Control plane callback mount path (path only). Combined with this node's public origin to form the
	 * consumer callbackAddress a provider POSTs DSP transfer messages back to (e.g.
	 * `<origin>/<callbackPath>/transfers/:pid/start`), with `?organization=` appended for tenant routing.
	 *
	 * Example: "dataspace" or "api/dataspace".
	 */
	callbackPath?: string;

	/**
	 * Whether the provider immediately starts a transfer once it has been requested. This is a
	 * provider-side decision only; the consumer cannot request or influence auto-start. When false
	 * (the default) the transfer stays in REQUESTED until the provider explicitly calls transferStarted.
	 *
	 * Defaults to false.
	 */
	autoStartTransfers?: boolean;

	/**
	 * How long (ms) a negotiation may sit without progress before the periodic cleanup treats it as
	 * timed out, removes it, and notifies the registered callbacks (onTimeout, falling back to
	 * onFailed with reason "negotiationStalled"). Requires a task-scheduler component to be configured.
	 *
	 * Defaults to 1800000 (30 minutes).
	 */
	stalledNegotiationTimeoutMs?: number;

	/**
	 * How long (ms) a consumer-initiated transfer may sit in REQUESTED without the provider progressing
	 * it before the periodic cleanup treats it as timed out, removes it, and notifies the registered
	 * transfer callbacks (onTimeout, falling back to onFailed with reason "transferStalled"). Requires a
	 * task-scheduler component to be configured.
	 *
	 * Defaults to 1800000 (30 minutes).
	 */
	stalledTransferTimeoutMs?: number;
}
