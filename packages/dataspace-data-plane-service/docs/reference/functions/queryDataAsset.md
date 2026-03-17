# Function: queryDataAsset()

> **queryDataAsset**(`httpRequestContext`, `factoryServiceName`, `request`): `Promise`\<`IDataAssetEntitiesResponse`\>

Handles a request to query a data asset.

## Parameters

### httpRequestContext

`IHttpRequestContext`

The request Context.

### factoryServiceName

`string`

The factory service name

### request

`IDataAssetQueryRequest`

The request.

## Returns

`Promise`\<`IDataAssetEntitiesResponse`\>

Either the entities as JSON-LD or the corresponding error response.
