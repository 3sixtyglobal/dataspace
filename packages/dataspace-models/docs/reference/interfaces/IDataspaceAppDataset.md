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

### dateCreated {#datecreated}

> **dateCreated**: `string`

Creation timestamp (ISO string).

***

### dateModified {#datemodified}

> **dateModified**: `string`

Last-modified timestamp (ISO string).
