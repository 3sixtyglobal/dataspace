# Interface: IDataspaceDataPlaneComponent

Dataspace Data Plane component interface.
Implements the Data Plane functionality for the Eclipse Dataspace Protocol.

## Extends

- `IComponent`

## Methods

### notifyActivity() {#notifyactivity}

> **notifyActivity**(`activity`, `trustPayload?`): `Promise`\<`string` \| [`IActivityLogEntry`](IActivityLogEntry.md)\>

Notify an Activity to the Dataspace Data Plane Activity Stream.

#### Parameters

##### activity

`IActivityStreamsActivity`

The Activity notified.

##### trustPayload?

`unknown`

Trust payload to verify the requesters identity.

#### Returns

`Promise`\<`string` \| [`IActivityLogEntry`](IActivityLogEntry.md)\>

The activity's entry.

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

The subscription Id.

#### Returns

`Promise`\<`string`\>

The subscription Id.

***

### unSubscribeToActivityLog() {#unsubscribetoactivitylog}

> **unSubscribeToActivityLog**(`subscriptionId`): `Promise`\<`void`\>

Unsubscribes to the activity log.

#### Parameters

##### subscriptionId

`string`

The subscription Id.

#### Returns

`Promise`\<`void`\>

The subscription Id.

***

### getActivityLogEntry() {#getactivitylogentry}

> **getActivityLogEntry**(`logEntryId`): `Promise`\<[`IActivityLogEntry`](IActivityLogEntry.md)\>

Returns Activity Log Entry which contains the Activity processing details.

#### Parameters

##### logEntryId

`string`

The Id of the Activity Log Entry (a URI).

#### Returns

`Promise`\<[`IActivityLogEntry`](IActivityLogEntry.md)\>

the Activity Log Entry with the processing details.

#### Throws

NotFoundError if activity log entry is not known.

***

### getDataAssetEntities() {#getdataassetentities}

> **getDataAssetEntities**(`entitySet`, `consumerPid`, `cursor?`, `limit?`, `trustPayload?`): `Promise`\<[`IDataAssetItemListResult`](IDataAssetItemListResult.md)\>

Get Data Asset entities. Allows to retrieve entities by their type or id.

#### Parameters

##### entitySet

[`IEntitySet`](IEntitySet.md) & `object`

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

`Promise`\<[`IDataAssetItemListResult`](IDataAssetItemListResult.md)\>

The item list and optional cursor for pagination via Link headers.

***

### queryDataAsset() {#querydataasset}

> **queryDataAsset**(`consumerPid`, `query`, `cursor?`, `limit?`, `trustPayload?`): `Promise`\<[`IDataAssetItemListResult`](IDataAssetItemListResult.md)\>

Queries a data asset controlled by this Dataspace App.

#### Parameters

##### consumerPid

`string`

The consumer Process ID from the DSP Transfer Process.
Used to resolve datasetId from the Transfer Process.

##### query

[`IFilteringQuery`](IFilteringQuery.md)

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

`Promise`\<[`IDataAssetItemListResult`](IDataAssetItemListResult.md)\>

The item list and optional cursor for pagination via Link headers.

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

Promise that resolves when the subscription is created.

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

Promise that resolves when the subscription is paused.

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

Promise that resolves when the subscription is resumed.

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

Promise that resolves when the subscription is torn down.

***

### processOutboxActivity() {#processoutboxactivity}

> **processOutboxActivity**(`activity`): `Promise`\<`void`\>

Called by the app when new data is available for a follower.
The activity's `to` attribute contains the consumerPid URN. This method
looks up the matching PushSubscription, validates transfer state, and
schedules a Background Task that POSTs the activity to the consumer.

#### Parameters

##### activity

`IActivityStreamsActivity`

The outbound activity carrying the data payload.

#### Returns

`Promise`\<`void`\>

Promise that resolves when the delivery task is scheduled.
