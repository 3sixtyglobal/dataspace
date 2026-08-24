# Interface: IDataspaceAppDataset

Stored dataset record returned by the Control Plane's dataset CRUD surface.

## Properties

### id {#id}

> **id**: `string`

The stored dataset id (matches the dataset's JSON-LD `@id`).

***

### appId {#appid}

> **appId**: `string`

The dataspace app this dataset belongs to.

***

### dataset {#dataset}

> **dataset**: `IDataspaceProtocolDataset`

The dataset payload.

***

### transferIdleTimeoutMs? {#transferidletimeoutms}

> `optional` **transferIdleTimeoutMs?**: `number`

Idle window (ms) for this dataset's PULL transfers, overriding the node-level
providerTransferIdleTimeoutMs; 0 disables the idle policy for this dataset.

***

### dateCreated {#datecreated}

> **dateCreated**: `string`

Creation timestamp (ISO string).

***

### dateModified {#datemodified}

> **dateModified**: `string`

Last-modified timestamp (ISO string).
