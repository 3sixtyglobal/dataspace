# Interface: IDataspaceDataPlaneComponent

Dataspace Data Plane component interface.
Implements the Data Plane functionality for the Eclipse Dataspace Protocol.

## Extends

- `IComponent`

## Methods

### notifyActivity()

> **notifyActivity**(`activity`): `Promise`\<`string`\>

Notify an Activity to the Dataspace Data Plane Activity Stream.

#### Parameters

##### activity

`IActivityStreamsActivity`

The Activity notified.

#### Returns

`Promise`\<`string`\>

The Activity's identifier.

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

***

### getActivityLogEntry()

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

### getDataAssetEntities()

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

### queryDataAsset()

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
