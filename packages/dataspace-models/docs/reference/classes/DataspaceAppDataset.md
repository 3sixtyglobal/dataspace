# Class: DataspaceAppDataset

Tenant-supplied Dataset shape persisted by the Control Plane.

## Constructors

### Constructor

> **new DataspaceAppDataset**(): `DataspaceAppDataset`

#### Returns

`DataspaceAppDataset`

## Properties

### id {#id}

> **id**: `string`

The unique identifier for the dataset.

***

### nodeIdentity {#nodeidentity}

> **nodeIdentity**: `string`

The identity of the node that owns this entity (required for sync).

***

### tenantId? {#tenantid}

> `optional` **tenantId?**: `string`

The tenant that owns this dataset, captured from the request context at
write time. Optional — single-tenant nodes (no `TWIN_TENANT_ENABLED`)
register datasets without a tenant context, in which case federated catalogue stores
the dataset with no `tenantId` and URL-baking is skipped.

***

### appId {#appid}

> **appId**: `string`

The dataspace app that this dataset belongs to. Matches the app's
registered name in `DataspaceAppFactory` (typically the app's URI).
Used as the join key when dispatching to an app's optional
`datasetsHandled` override.

***

### dataset {#dataset}

> **dataset**: `object`

The user-controlled JSON-LD dataset payload. Stored as an
opaque object and validated/populated at publish time.

#### Index Signature

\[`key`: `string`\]: `unknown`

***

### dateCreated {#datecreated}

> **dateCreated**: `string`

Creation timestamp (ISO string format).

***

### dateModified {#datemodified}

> **dateModified**: `string`

Last update timestamp (ISO string format).
