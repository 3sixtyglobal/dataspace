# Class: DataSpaceConnectorService

Data Space Connector Service.

## Implements

- `IDataSpaceConnector`

## Constructors

### Constructor

> **new DataSpaceConnectorService**(`options`): `DataSpaceConnectorService`

Create a new instance of DataSpaceConnector.

#### Parameters

##### options

[`IDataSpaceConnectorServiceConstructorOptions`](../interfaces/IDataSpaceConnectorServiceConstructorOptions.md)

The options for the connector.

#### Returns

`DataSpaceConnectorService`

## Properties

### CLASS\_NAME

> `readonly` `static` **CLASS\_NAME**: `string`

Runtime name for the class.

## Methods

### start()

> **start**(`nodeIdentity?`, `nodeLoggingComponentType?`): `Promise`\<`void`\>

Start step. It just registers the Data Space Connector Apps initial descriptors.

#### Parameters

##### nodeIdentity?

`string`

Node Identity

##### nodeLoggingComponentType?

`string`

Node Logging Component type.

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

`IActivity`

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

> **getDataAssetEntities**(`dataAsset`, `entitySet`, `dataConsumerIdentity`, `cursor?`, `limit?`): `Promise`\<`IDataAssetItemList`\>

Get Data Asset entities. Allows to retrieve entities by their type or id.

#### Parameters

##### dataAsset

`IDataAssetDescription`

The data asset being referred. It can be left empty and let the system to locate a proper one.

##### entitySet

`IEntitySet` & `object`

The set of entities to be retrieved.

##### dataConsumerIdentity

`string`

The identity of the Data Consumer.

##### cursor?

`string`

Pagination details - cursor.

##### limit?

`number`

Pagination details - max number of entities.

#### Returns

`Promise`\<`IDataAssetItemList`\>

The entities requested as a JSON-LD Document.

#### Implementation of

`IDataSpaceConnector.getDataAssetEntities`

***

### queryDataAsset()

> **queryDataAsset**(`dataAsset`, `query`, `dataConsumerIdentity`, `cursor?`, `limit?`): `Promise`\<`IDataAssetItemList`\>

Queries a data asset controlled by this DS Connector App.

#### Parameters

##### dataAsset

`IDataAssetDescription`

The data asset being referred.

##### query

`IFilteringQuery`

The filtering query.

##### dataConsumerIdentity

`string`

The identity of the data consumer.

##### cursor?

`string`

Pagination details - cursor.

##### limit?

`number`

Pagination details - max number of entities.

#### Returns

`Promise`\<`IDataAssetItemList`\>

The entities requested as a JSON-LD Document.

#### Implementation of

`IDataSpaceConnector.queryDataAsset`

***

### registerApp()

> **registerApp**(`appId`, `app`): `Promise`\<`void`\>

Registers a Data Space Connector App.

#### Parameters

##### appId

`string`

The Id of the App to be registered.

##### app

`IDataSpaceConnectorApp`

The App to be registered.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataSpaceConnector.registerApp`

***

### unregisterApp()

> **unregisterApp**(`appId`): `Promise`\<`void`\>

Un-registers a Data Space Connector App.

#### Parameters

##### appId

`string`

The Id of the App to be registered.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

`IDataSpaceConnector.unregisterApp`
