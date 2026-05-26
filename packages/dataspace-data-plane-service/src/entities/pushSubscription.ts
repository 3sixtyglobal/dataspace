// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property, SortDirection } from "@twin.org/entity";

/**
 * Persists a push subscription. One row per active push transfer.
 * Primary key = consumerPid (same as TransferProcess).
 */
@entity()
export class PushSubscription {
	@property({ type: "string", isPrimary: true })
	public consumerPid!: string;

	@property({ type: "string" })
	public providerPid!: string;

	/**
	 * ID of the Follow activity that created this subscription.
	 * Used by Undo to reference it on teardown.
	 */
	@property({ type: "string" })
	public followActivityId!: string;

	@property({ type: "string" })
	public datasetId!: string;

	/**
	 * The tenant that owns this subscription, captured from the request context at
	 * write time. Optional — single-tenant nodes (no `TWIN_TENANT_ENABLED`) register
	 * subscriptions without a tenant context. The encrypted tenant token is also baked
	 * into `consumerEndpoint` so cross-node push deliveries route to the right tenant.
	 */
	@property({ type: "string", optional: true })
	public tenantId?: string;

	@property({ type: "string" })
	public consumerEndpoint!: string;

	@property({ type: "string", optional: true })
	public consumerAuthToken?: string;

	/**
	 * When true deliveries are skipped (transfer SUSPENDED).
	 * When false deliveries are flowing normally.
	 */
	@property({ type: "boolean" })
	public paused!: boolean;

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
