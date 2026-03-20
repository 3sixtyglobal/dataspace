# Interface: IDataAssetGetEntitiesRequest

Get Request Data Asset Entities

## Properties

### headers? {#headers}

> `optional` **headers?**: `object`

The headers which can be used to determine the response data type.

#### authorization?

> `optional` **authorization?**: `string`

***

### query {#query}

> **query**: `object`

The parameters from the query.

#### id?

> `optional` **id?**: `string`

The ID of the entity(ies) to get. (comma separated list)

#### type

> **type**: `string`

The type of the entity to get.

#### consumerPid

> **consumerPid**: `string`

The consumer Process ID from the DSP Transfer Process.
Mandatory - used to determine the Dataset, Distribution, and Agreement.
The datasetId is resolved from the Transfer Process using this ID.

#### dataServiceId?

> `optional` **dataServiceId?**: `string`

The Id of the data service that offers the data asset

#### limit?

> `optional` **limit?**: `string`

The maximum number of entities to retrieve.

#### cursor?

> `optional` **cursor?**: `string`

Cursor to control pagination.
