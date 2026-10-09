// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property, SortDirection } from "@3sixty/entity";

/**
 * Tenant-supplied Dataset shape persisted by the Control Plane.
 */
@entity({ version: 1 })
export class DataspaceAppDataset {
	/**
	 * The unique identifier for the dataset.
	 */
	@property({ type: "string", isPrimary: true, maxLength: 255 })
	public id!: string;

	/**
	 * The identity of the organization that owns this entity.
	 */
	@property({ type: "string", maxLength: 255, isSecondary: true })
	public organizationIdentity!: string;

	/**
	 * The tenant that owns this dataset, captured from the request context at
	 * write time. Optional - single-tenant nodes (no `TWIN_TENANT_ENABLED`)
	 * register datasets without a tenant context.
	 */
	@property({ type: "string", maxLength: 32, optional: true })
	public tenantId?: string;

	/**
	 * The dataspace app that this dataset belongs to. Matches the app's
	 * registered name in `DataspaceAppFactory` (typically the app's URI).
	 */
	@property({ type: "string", maxLength: 255 })
	public appId!: string;

	/**
	 * The user-controlled JSON-LD dataset payload. Stored as an
	 * opaque object and validated/populated at publish time.
	 */
	@property({ type: "object", format: "json" })
	public dataset!: { [key: string]: unknown };

	/**
	 * Idle window (ms) for this dataset's PULL transfers, overriding the node-level
	 * providerTransferIdleTimeoutMs; 0 disables the idle policy for this dataset.
	 */
	@property({ type: "number", optional: true })
	public transferIdleTimeoutMs?: number;

	/**
	 * Creation timestamp (ISO string format).
	 */
	@property({ type: "string", format: "date-time", sortDirection: SortDirection.Descending })
	public dateCreated!: string;

	/**
	 * Last update timestamp (ISO string format).
	 */
	@property({ type: "string", format: "date-time" })
	public dateModified!: string;
}
