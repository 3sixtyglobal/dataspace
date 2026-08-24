# Interface: IAppDatasetUpdateRequest

API request to update an existing app dataset record.

## Properties

### pathParams {#pathparams}

> **pathParams**: `object`

Path parameters containing the stored app dataset id.

#### id

> **id**: `string`

The stored app dataset id.

***

### body {#body}

> **body**: `object`

The body of the request.

#### appId

> **appId**: `string`

The dataspace app this dataset belongs to. May change appId on
update if the tenant wants to retarget the dataset.

#### dataset

> **dataset**: `IDataspaceProtocolDataset`

The dataset payload.

#### transferIdleTimeoutMs?

> `optional` **transferIdleTimeoutMs?**: `number`

Optional idle window (ms) overriding the node-level idle policy for this
dataset's PULL transfers; 0 disables it for this dataset.
