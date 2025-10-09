# Interface: IDataSpaceConnector

Data Space Connector service interface.

## Extends

- `IComponent`

## Indexable

\[`key`: `string`\]: `any`

All methods are optional, so we introduce an index signature to allow
any additional properties or methods, which removes the TypeScript error where
the class has no properties in common with the type.

## Methods

### notifyActivity()

> **notifyActivity**(`activity`): `Promise`\<`string`\>

Notify an Activity to the DS Connector Activity Stream.

#### Parameters

##### activity

`IActivity`

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

### registerApp()

> **registerApp**(`appId`, `app`): `Promise`\<`void`\>

Registers a Data Space Connector App.

#### Parameters

##### appId

`string`

The Id of the App to be registered.

##### app

[`IDataSpaceConnectorApp`](IDataSpaceConnectorApp.md)

The app to be registered.

#### Returns

`Promise`\<`void`\>

Nothing.

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
