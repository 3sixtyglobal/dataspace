# Interface: IAppDatasetCreateRequest

API request to register an app dataset.

The owning `tenantId` is captured automatically from the request's tenant
context — callers do not supply it.

## Properties

### body {#body}

> **body**: `object`

The body of the request.

#### id?

> `optional` **id?**: `string`

Optional explicit id for the stored dataset record. If omitted, the
Control Plane derives the id from `dataset["@id"]` if present, or
generates a UUID otherwise. The resolved id is returned via the
`Location` response header.

#### appId

> **appId**: `string`

The dataspace app this dataset belongs to. Matches the app's
registered name in `DataspaceAppFactory` (typically the app's URI).

#### dataset

> **dataset**: `IDataspaceProtocolDataset`

The dataset payload. System-stamped fields like `dcterms:publisher`
may be omitted — the Control Plane fills them in at publish time.
