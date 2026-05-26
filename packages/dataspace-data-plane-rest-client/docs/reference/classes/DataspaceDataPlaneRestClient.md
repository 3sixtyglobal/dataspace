# Class: DataspaceDataPlaneRestClient

The client to connect to the dataspace data plane service.

## Extends

- `BaseRestClient`

## Implements

- `IDataspaceDataPlaneComponent`

## Constructors

### Constructor

> **new DataspaceDataPlaneRestClient**(`config`): `DataspaceDataPlaneRestClient`

Create a new instance of DataspaceDataPlaneRestClient.

#### Parameters

##### config

`IBaseRestClientConfig`

The configuration for the client.

#### Returns

`DataspaceDataPlaneRestClient`

#### Overrides

`BaseRestClient.constructor`

## Properties

### CLASS\_NAME {#class_name}

> `readonly` `static` **CLASS\_NAME**: `string`

Runtime name for the class.

## Methods

### className() {#classname}

> **className**(): `string`

Returns the class name of the component.

#### Returns

`string`

The class name of the component.

#### Implementation of

`IDataspaceDataPlaneComponent.className`

***

### getDataAssetEntities() {#getdataassetentities}

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

### queryDataAsset() {#querydataasset}

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

### notifyActivity() {#notifyactivity}

> **notifyActivity**(`activity`, `trustPayload?`): `Promise`\<`string` \| `IActivityLogEntry`\>

Notify an Activity to the Dataspace Activity Stream.

#### Parameters

##### activity

`IActivityStreamsActivity`

The Activity notified.

##### trustPayload?

`unknown`

Optional trust payload to verify the requesters identity.

#### Returns

`Promise`\<`string` \| `IActivityLogEntry`\>

The activity's id or entry.

#### Implementation of

`IDataspaceDataPlaneComponent.notifyActivity`

***

### subscribeToActivityLog() {#subscribetoactivitylog}

> **subscribeToActivityLog**(`callback`, `subscriptionId?`): `Promise`\<`string`\>

Subscribes to the activity log - implemented in Socket Client.

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

### unSubscribeToActivityLog() {#unsubscribetoactivitylog}

> **unSubscribeToActivityLog**(`subscriptionId`): `Promise`\<`void`\>

Unsubscribes to the activity log - implemented in Socket Client.

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

### setupPushSubscription() {#setuppushsubscription}

> **setupPushSubscription**(`consumerPid`): `Promise`\<`void`\>

Not supported on REST client — push subscriptions are server-side only.

#### Parameters

##### consumerPid

`string`

Unused.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceDataPlaneComponent.setupPushSubscription`

***

### suspendPushSubscription() {#suspendpushsubscription}

> **suspendPushSubscription**(`consumerPid`): `Promise`\<`void`\>

Not supported on REST client — push subscriptions are server-side only.

#### Parameters

##### consumerPid

`string`

Unused.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceDataPlaneComponent.suspendPushSubscription`

***

### resumePushSubscription() {#resumepushsubscription}

> **resumePushSubscription**(`consumerPid`): `Promise`\<`void`\>

Not supported on REST client — push subscriptions are server-side only.

#### Parameters

##### consumerPid

`string`

Unused.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceDataPlaneComponent.resumePushSubscription`

***

### teardownPushSubscription() {#teardownpushsubscription}

> **teardownPushSubscription**(`consumerPid`): `Promise`\<`void`\>

Not supported on REST client — push subscriptions are server-side only.

#### Parameters

##### consumerPid

`string`

Unused.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceDataPlaneComponent.teardownPushSubscription`

***

### processOutboxActivity() {#processoutboxactivity}

> **processOutboxActivity**(`activity`): `Promise`\<`void`\>

Not supported on REST client — processOutboxActivity is server-side only.

#### Parameters

##### activity

`IActivityStreamsActivity`

Unused.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceDataPlaneComponent.processOutboxActivity`

***

### getActivityLogEntry() {#getactivitylogentry}

> **getActivityLogEntry**(`logEntryId`): `Promise`\<`IActivityLogEntry`\>

Returns Activity Log Entry which contains the Activity processing details.

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
