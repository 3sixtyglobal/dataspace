# Interface: IDataAssetQueryRequest

Request to query data asset entities.

## Properties

### body

> **body**: `object`

Request body containing the data asset and query criteria.

#### dataAsset

> **dataAsset**: [`IDataAssetDescription`](IDataAssetDescription.md)

The data asset being queried.

#### query

> **query**: [`IFilteringQuery`](IFilteringQuery.md)

The filtering query.

***

### query?

> `optional` **query**: `object`

Optional query parameters for pagination.
Used when following Link header URLs.

#### cursor?

> `optional` **cursor**: `string`

Opaque cursor token for pagination.

#### limit?

> `optional` **limit**: `string`

Maximum number of items to return.
