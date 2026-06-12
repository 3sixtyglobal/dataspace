# Class: DataspaceDataPlaneService

Dataspace Data Plane Service.

## Implements

- `IDataspaceDataPlaneComponent`

## Constructors

### Constructor

> **new DataspaceDataPlaneService**(`options?`): `DataspaceDataPlaneService`

Create a new instance of DataspaceDataPlane.

#### Parameters

##### options?

[`IDataspaceDataPlaneServiceConstructorOptions`](../interfaces/IDataspaceDataPlaneServiceConstructorOptions.md)

The options for the data plane.

#### Returns

`DataspaceDataPlaneService`

## Properties

### CLASS\_NAME {#class_name}

> `readonly` `static` **CLASS\_NAME**: `string`

Runtime name for the class.

***

### PUSH\_DELIVERY\_TASK\_TYPE {#push_delivery_task_type}

> `readonly` `static` **PUSH\_DELIVERY\_TASK\_TYPE**: `"push-delivery"` = `"push-delivery"`

Background task type identifier for push delivery tasks.

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

### start() {#start}

> **start**(`nodeLoggingComponentType?`): `Promise`\<`void`\>

The service needs to be started when the application is initialized.

#### Parameters

##### nodeLoggingComponentType?

`string`

The node logging component type.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceDataPlaneComponent.start`

***

### notifyActivity() {#notifyactivity}

> **notifyActivity**(`activity`, `trustPayload?`): `Promise`\<`string` \| `IActivityLogEntry`\>

Notify an Activity.

#### Parameters

##### activity

`IActivityStreamsActivity`

The Activity notified.

##### trustPayload?

`unknown`

Trust payload to verify the requesters identity.

#### Returns

`Promise`\<`string` \| `IActivityLogEntry`\>

The activity's id or entry.

#### Implementation of

`IDataspaceDataPlaneComponent.notifyActivity`

***

### subscribeToActivityLog() {#subscribetoactivitylog}

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

`IDataspaceDataPlaneComponent.subscribeToActivityLog`

***

### unSubscribeToActivityLog() {#unsubscribetoactivitylog}

> **unSubscribeToActivityLog**(`subscriptionId`): `Promise`\<`void`\>

Subscribes to the activity log.

#### Parameters

##### subscriptionId

`string`

The Subscription Id.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceDataPlaneComponent.unSubscribeToActivityLog`

***

### getActivityLogEntry() {#getactivitylogentry}

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

`IDataspaceDataPlaneComponent.getActivityLogEntry`

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

The entities requested as a JSON-LD Document.

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

### validateTransfer() {#validatetransfer}

> **validateTransfer**(`consumerPid`, `trustPayload`): `Promise`\<`ITransferContext`\>

Validate transfer authorization for data requests.
Reads directly from shared TransferProcess entity storage.

#### Parameters

##### consumerPid

`string`

The consumer process ID from the transfer request.

##### trustPayload

`unknown`

The trust payload for verification (validates signature and expiry).

#### Returns

`Promise`\<`ITransferContext`\>

The transfer context containing datasetId, agreement, and other transfer details.

#### Throws

GeneralError if transfer process storage is not configured.

#### Throws

NotFoundError if transfer process is not found.

#### Throws

UnauthorizedError if trust verification fails.

#### Throws

GeneralError if transfer is not in STARTED state.

***

### setupPushSubscription() {#setuppushsubscription}

> **setupPushSubscription**(`consumerPid`): `Promise`\<`void`\>

Set up a push subscription after a transfer enters STARTED from REQUESTED.
Reads the TransferProcess, builds an IFollowActivity, calls the app's
subscribeToData, and persists a PushSubscription entity.

#### Parameters

##### consumerPid

`string`

The consumer process ID identifying the transfer.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceDataPlaneComponent.setupPushSubscription`

***

### suspendPushSubscription() {#suspendpushsubscription}

> **suspendPushSubscription**(`consumerPid`): `Promise`\<`void`\>

Pause deliveries for a push subscription. The subscription entity stays
alive with status=Paused. No app unsubscribe call.

#### Parameters

##### consumerPid

`string`

The consumer process ID identifying the transfer.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceDataPlaneComponent.suspendPushSubscription`

***

### resumePushSubscription() {#resumepushsubscription}

> **resumePushSubscription**(`consumerPid`): `Promise`\<`void`\>

Resume deliveries after a SUSPENDED → STARTED transition. Flips status
back to Active. No app subscribeToData call.

#### Parameters

##### consumerPid

`string`

The consumer process ID identifying the transfer.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceDataPlaneComponent.resumePushSubscription`

***

### teardownPushSubscription() {#teardownpushsubscription}

> **teardownPushSubscription**(`consumerPid`): `Promise`\<`void`\>

Tear down a push subscription. Builds an IUndoActivity, calls the app's
unsubscribeToData, and deletes the PushSubscription entity.

#### Parameters

##### consumerPid

`string`

The consumer process ID identifying the transfer.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceDataPlaneComponent.teardownPushSubscription`

***

### processOutboxActivity() {#processoutboxactivity}

> **processOutboxActivity**(`activity`): `Promise`\<`void`\>

Schedule a push delivery when the app has new outbound data.

#### Parameters

##### activity

`IActivityStreamsActivity`

The outbound activity carrying the data payload.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceDataPlaneComponent.processOutboxActivity`
