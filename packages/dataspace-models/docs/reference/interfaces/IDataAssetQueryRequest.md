# Interface: IDataAssetQueryRequest

Request to query data asset entities.

## Properties

### headers? {#headers}

> `optional` **headers?**: `object`

The headers which can be used to determine the response data type.

#### authorization?

> `optional` **authorization?**: `string`

***

### body {#body}

> **body**: `object`

Request body containing the data asset and query criteria.

#### consumerPid

> **consumerPid**: `string`

The consumer Process ID from the DSP Transfer Process.
Mandatory - used to determine the Dataset, Distribution, and Agreement.
The datasetId is resolved from the Transfer Process using this ID.

#### query

> **query**: [`IFilteringQuery`](IFilteringQuery.md)

The filtering query.

***

### query? {#query}

> `optional` **query?**: `object`

Optional query parameters for pagination.
Used when following Link header URLs.

#### cursor?

> `optional` **cursor?**: `string`

Opaque cursor token for pagination.

#### limit?

> `optional` **limit?**: `string`

Maximum number of items to return.
