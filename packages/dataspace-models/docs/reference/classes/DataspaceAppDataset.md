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

### organizationIdentity {#organizationidentity}

> **organizationIdentity**: `string`

The identity of the organization that owns this entity.

***

### tenantId? {#tenantid}

> `optional` **tenantId?**: `string`

The tenant that owns this dataset, captured from the request context at
write time. Optional — single-tenant nodes (no `TWIN_TENANT_ENABLED`)
register datasets without a tenant context.

***

### appId {#appid}

> **appId**: `string`

The dataspace app that this dataset belongs to. Matches the app's
registered name in `DataspaceAppFactory` (typically the app's URI).

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
