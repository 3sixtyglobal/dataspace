# Class: DataSpaceConnectorService

Data Space Connector Service.

## Implements

- `IDataSpaceConnector`

## Constructors

### Constructor

> **new DataSpaceConnectorService**(`options?`): `DataSpaceConnectorService`

Create a new instance of DataSpaceConnector.

#### Parameters

##### options?

[`IDataSpaceConnectorServiceConstructorOptions`](../interfaces/IDataSpaceConnectorServiceConstructorOptions.md)

The options for the connector.

#### Returns

`DataSpaceConnectorService`

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

`IDataSpaceConnector.className`

***

### start()

> **start**(`nodeLoggingComponentType?`): `Promise`\<`void`\>

The service needs to be started when the application is initialized.

#### Parameters

##### nodeLoggingComponentType?

`string`

The node logging component type.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataSpaceConnector.start`

***

### notifyActivity()

> **notifyActivity**(`activity`): `Promise`\<`string`\>

Notify an Activity.

#### Parameters

##### activity

`IActivityStreamsActivity`

The Activity notified.

#### Returns

`Promise`\<`string`\>

The Activity's Log Entry identifier.

#### Implementation of

`IDataSpaceConnector.notifyActivity`

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

The Subscription Id.

#### Returns

`Promise`\<`string`\>

The subscription Id.

#### Implementation of

`IDataSpaceConnector.subscribeToActivityLog`

***

### unSubscribeToActivityLog()

> **unSubscribeToActivityLog**(`subscriptionId`): `Promise`\<`void`\>

Subscribes to the activity log.

#### Parameters

##### subscriptionId

`string`

The Subscription Id.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataSpaceConnector.unSubscribeToActivityLog`

***

### getActivityLogEntry()

> **getActivityLogEntry**(`logEntryId`): `Promise`\<`IActivityLogEntry`\>

Returns the activity processing details of an activity.

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

`IDataSpaceConnector.getActivityLogEntry`

***

### getDataAssetEntities()

> **getDataAssetEntities**(`dataAsset`, `entitySet`, `cursor?`, `limit?`, `trustPayload?`): `Promise`\<`IDataAssetItemListResult`\>

Get Data Asset entities. Allows to retrieve entities by their type or id.

#### Parameters

##### dataAsset

`IDataAssetDescription`

The data asset being referred. It can be left empty and let the system to locate a proper one.

##### entitySet

`IEntitySet` & `object`

The set of entities to be retrieved.

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

The entities requested as a JSON-LD Document.

#### Implementation of

`IDataSpaceConnector.getDataAssetEntities`

***

### queryDataAsset()

> **queryDataAsset**(`dataAsset`, `query`, `cursor?`, `limit?`, `trustPayload?`): `Promise`\<`IDataAssetItemListResult`\>

Queries a data asset controlled by this DS Connector App.

#### Parameters

##### dataAsset

`IDataAssetDescription`

The data asset being referred.

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

`IDataSpaceConnector.queryDataAsset`
