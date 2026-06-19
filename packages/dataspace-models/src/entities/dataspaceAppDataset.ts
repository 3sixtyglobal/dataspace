// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property, SortDirection } from "@twin.org/entity";

/**
 * Tenant-supplied Dataset shape persisted by the Control Plane.
 */
@entity()
export class DataspaceAppDataset {
	/**
	 * The unique identifier for the dataset.
	 */
	@property({ type: "string", isPrimary: true })
	public id!: string;

	/**
	 * The identity of the organization that owns this entity.
	 */
	@property({ type: "string", isSecondary: true })
	public organizationIdentity!: string;

	/**
	 * The tenant that owns this dataset, captured from the request context at
	 * write time. Optional — single-tenant nodes (no `TWIN_TENANT_ENABLED`)
	 * register datasets without a tenant context.
	 */
	@property({ type: "string", optional: true })
	public tenantId?: string;

	/**
	 * The dataspace app that this dataset belongs to. Matches the app's
	 * registered name in `DataspaceAppFactory` (typically the app's URI).
	 */
	@property({ type: "string" })
	public appId!: string;

	/**
	 * The user-controlled JSON-LD dataset payload. Stored as an
	 * opaque object and validated/populated at publish time.
	 */
	@property({ type: "object", format: "json" })
	public dataset!: { [key: string]: unknown };

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
