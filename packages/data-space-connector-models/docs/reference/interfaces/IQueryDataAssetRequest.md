# Interface: IQueryDataAssetRequest

Data Request type for representing data requests received by DS Connector Apps.

## Properties

### type

> **type**: `"QueryDataAsset"`

Data Asset Entities type.

***

### dataAsset

> **dataAsset**: `IDataspaceProtocolDataset`

The data asset we are referring to.

***

### query

> **query**: [`IFilteringQuery`](IFilteringQuery.md)

Query to perform filtering.
