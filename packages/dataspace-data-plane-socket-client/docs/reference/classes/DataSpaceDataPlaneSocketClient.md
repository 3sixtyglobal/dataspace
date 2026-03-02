# Class: DataspaceDataPlaneSocketClient

Dataspace data plane client which publishes using REST API and websockets.

## Extends

- `BaseSocketClient`

## Implements

- `IDataspaceDataPlaneComponent`

## Constructors

### Constructor

> **new DataspaceDataPlaneSocketClient**(`options`): `DataspaceDataPlaneSocketClient`

Create a new instance of DataspaceDataPlaneSocketClient.

#### Parameters

##### options

[`IDataspaceDataPlaneSocketClientConstructorOptions`](../interfaces/IDataspaceDataPlaneSocketClientConstructorOptions.md)

Options for the client.

#### Returns

`DataspaceDataPlaneSocketClient`

#### Overrides

`BaseSocketClient.constructor`

## Properties

### CLASS\_NAME

> `readonly` `static` **CLASS\_NAME**: `string`

Runtime name for the class.

## Methods

### className()

> **className**(): `string`

Returns the class name of the component.

#### Returns

`string`

The class name of the component.

#### Implementation of

`IDataspaceDataPlaneComponent.className`

***

### notifyActivity()

> **notifyActivity**(`activity`): `Promise`\<`string`\>

Notify an Activity to the Dataspace Activity Stream - implemented in REST Client.

#### Parameters

##### activity

`IActivityStreamsActivity`

The Activity notified.

#### Returns

`Promise`\<`string`\>

The Activity's identifier.

#### Implementation of

`IDataspaceDataPlaneComponent.notifyActivity`

***

### subscribeToActivityLog()

> **subscribeToActivityLog**(`callback`, `subscriptionId?`): `Promise`\<`string`\>

Subscribes to the activity log.

#### Parameters

##### callback

(`notification`) => `Promise`\<`void`\>

The callback to be called when Activity Log is called.

##### subscriptionId?

`string`

The subscription Id.

#### Returns

`Promise`\<`string`\>

The subscription Id.

#### Implementation of

`IDataspaceDataPlaneComponent.subscribeToActivityLog`

***

### unSubscribeToActivityLog()

> **unSubscribeToActivityLog**(`subscriptionId`): `Promise`\<`void`\>

Unsubscribes to the activity log.

#### Parameters

##### subscriptionId

`string`

The subscription Id.

#### Returns

`Promise`\<`void`\>

The subscription Id.

#### Implementation of

`IDataspaceDataPlaneComponent.unSubscribeToActivityLog`

***

### getActivityLogEntry()

> **getActivityLogEntry**(`logEntryId`): `Promise`\<`IActivityLogEntry`\>

Returns Activity Log Entry which contains the Activity processing details - implemented in REST Client.

#### Parameters

##### logEntryId

`string`

The Id of the Activity Log Entry (a URI).

#### Returns

`Promise`\<`IActivityLogEntry`\>

the Activity Log Entry with the processing details.

#### Throws

NotFoundError if activity log entry is not known.

#### Implementation of

`IDataspaceDataPlaneComponent.getActivityLogEntry`

***

### getDataAssetEntities()

> **getDataAssetEntities**(`entitySet`, `consumerPid`, `cursor?`, `limit?`, `trustPayload?`): `Promise`\<`IDataAssetItemListResult`\>

Get Data Asset entities. Allows to retrieve entities by their type or id.

#### Parameters

##### entitySet

`IEntitySet` & `object`

The set of entities to be retrieved.

##### consumerPid

`string`

The consumer Process ID from the DSP Transfer Process.
Used to resolve datasetId from the Transfer Process.

##### cursor?

`string`

Pagination details - cursor.

##### limit?

`number`

Pagination details - max number of entities.

##### trustPayload?

`unknown`

Trust payload to verify the requesters identity.

#### Returns

`Promise`\<`IDataAssetItemListResult`\>

The item list and optional cursor for pagination via Link headers.

#### Implementation of

`IDataspaceDataPlaneComponent.getDataAssetEntities`

***

### queryDataAsset()

> **queryDataAsset**(`consumerPid`, `query`, `cursor?`, `limit?`, `trustPayload?`): `Promise`\<`IDataAssetItemListResult`\>

Queries a data asset controlled by this Dataspace App.

#### Parameters

##### consumerPid

`string`

The consumer Process ID from the DSP Transfer Process.
Used to resolve datasetId from the Transfer Process.

##### query

`IFilteringQuery`

The filtering query.

##### cursor?

`string`

Pagination details - cursor.

##### limit?

`number`

Pagination details - max number of entities.

##### trustPayload?

`unknown`

Trust payload to verify the requesters identity.

#### Returns

`Promise`\<`IDataAssetItemListResult`\>

The item list and optional cursor for pagination via Link headers.

#### Implementation of

`IDataspaceDataPlaneComponent.queryDataAsset`

***

### handleConnected()

> `protected` **handleConnected**(): `Promise`\<`void`\>

Handle the socket connection.

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseSocketClient.handleConnected`

***

### handleError()

> `protected` **handleError**(`err`): `Promise`\<`void`\>

Handle an error.

#### Parameters

##### err

`IError`

The error to handle.

#### Returns

`Promise`\<`void`\>

#### Overrides

`BaseSocketClient.handleError`
