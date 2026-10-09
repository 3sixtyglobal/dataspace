// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property, SortDirection } from "@3sixty/entity";

/**
 * Persists a push subscription. One row per active push transfer.
 * Primary key = consumerPid (same as TransferProcess).
 */
@entity()
export class PushSubscription {
	/**
	 * Consumer process ID identifying the transfer. Also the primary key for this entity.
	 */
	@property({ type: "string", isPrimary: true, maxLength: 255 })
	public consumerPid!: string;

	/**
	 * Provider process ID from the DSP Transfer Process.
	 */
	@property({ type: "string", maxLength: 255 })
	public providerPid!: string;

	/**
	 * ID of the Follow activity that created this subscription.
	 * Used by Undo to reference it on teardown.
	 */
	@property({ type: "string", maxLength: 255 })
	public followActivityId!: string;

	/**
	 * Dataset ID identifying which dataset is being delivered.
	 */
	@property({ type: "string", maxLength: 255 })
	public datasetId!: string;

	/**
	 * The tenant that owns this subscription, captured from the request context at
	 * write time. Optional - single-tenant nodes (no `TWIN_TENANT_ENABLED`) register
	 * subscriptions without a tenant context. The encrypted tenant token is also baked
	 * into `consumerEndpoint` so cross-node push deliveries route to the right tenant.
	 */
	@property({ type: "string", maxLength: 32, optional: true })
	public tenantId?: string;

	/**
	 * The consumer's /inbox endpoint URL where activities are POSTed.
	 */
	@property({ type: "string", format: "uri" })
	public consumerEndpoint!: string;

	/**
	 * Pre-packaged bearer token for authenticating pushes to the consumer endpoint.
	 * When absent a fresh JWT is generated at delivery time.
	 */
	@property({ type: "string", optional: true })
	public consumerAuthToken?: string;

	/**
	 * When true deliveries are skipped (transfer SUSPENDED).
	 * When false deliveries are flowing normally.
	 */
	@property({ type: "boolean" })
	public paused!: boolean;

	/**
	 * Creation timestamp (ISO string format).
	 */
	@property({ type: "string", format: "date-time", sortDirection: SortDirection.Descending })
	public dateCreated!: string;

	/**
	 * Last-modified timestamp. Updated on suspend/resume (when `paused` flips) and on
	 * any subscription mutation. Matches the codebase convention of pairing `dateCreated`
	 * with `dateModified` on entities whose state mutates.
	 */
	@property({ type: "string", format: "date-time" })
	public dateModified!: string;
}
