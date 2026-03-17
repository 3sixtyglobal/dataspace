# Function: getDataAssetEntities()

> **getDataAssetEntities**(`httpRequestContext`, `factoryServiceName`, `request`): `Promise`\<`IDataAssetEntitiesResponse`\>

Handles a request to obtain the entities of a data asset.

## Parameters

### httpRequestContext

`IHttpRequestContext`

The request Context.

### factoryServiceName

`string`

The factory service name

### request

`IDataAssetGetEntitiesRequest`

The request.

## Returns

`Promise`\<`IDataAssetEntitiesResponse`\>

Either the entities as JSON-LD or the corresponding error response.
