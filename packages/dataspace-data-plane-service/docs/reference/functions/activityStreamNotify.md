# Function: activityStreamNotify()

> **activityStreamNotify**(`baseRouteName`, `httpRequestContext`, `factoryServiceName`, `request`): `Promise`\<`IActivityStreamNotifyResponse`\>

Notify a new Activity to the Dataspace Data Plane Activity Stream.

## Parameters

### baseRouteName

`string`

The base route name.

### httpRequestContext

`IHttpRequestContext`

The request context for the API.

### factoryServiceName

`string`

The name of the service to use in the routes.

### request

`IActivityStreamNotifyRequest`

The request.

## Returns

`Promise`\<`IActivityStreamNotifyResponse`\>

The response object with additional http response properties.
