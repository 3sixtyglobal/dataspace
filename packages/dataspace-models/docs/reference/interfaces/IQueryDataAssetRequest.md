# Interface: IQueryDataAssetRequest

Data Request type for representing data requests received by Dataspace Apps.

## Properties

### type {#type}

> **type**: `"QueryDataAsset"`

Data Asset Entities type.

***

### dataAsset {#dataasset}

> **dataAsset**: `IDataspaceProtocolDataset`

The data asset we are referring to.

***

### query {#query}

> **query**: [`IFilteringQuery`](IFilteringQuery.md)

Query to perform filtering.
