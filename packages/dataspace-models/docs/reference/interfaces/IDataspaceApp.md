# Interface: IDataspaceApp

Interface describes a Dataspace App.

## Extends

- `IComponent`

## Methods

### activitiesHandled()

> **activitiesHandled**(): [`IActivityQuery`](IActivityQuery.md)[]

The activities handled by the App.

#### Returns

[`IActivityQuery`](IActivityQuery.md)[]

A query that describes the set of activities handled by the App.

***

### datasetsHandled()

> **datasetsHandled**(): `Promise`\<`IDataspaceProtocolDataset`[]\>

The datasets handled by the App.

#### Returns

`Promise`\<`IDataspaceProtocolDataset`[]\>

The Dataspace Protocol compliant datasets handled by the App.

***

### supportedQueryTypes()

> **supportedQueryTypes**(): `string`[]

The types of queries supported.

#### Returns

`string`[]

The types of queries supported by the Dataspace App to retrieve data.

***

### handleActivity()?

> `optional` **handleActivity**\<`T`\>(`activity`): `Promise`\<`T`\>

Handles an Activity and report about results through the Dataspace Data Plane Callback

#### Type Parameters

##### T

`T`

#### Parameters

##### activity

`IActivityStreamsActivity`

The Activity to be handled

#### Returns

`Promise`\<`T`\>

The result of executing the Activity.

***

### handleDataRequest()?

> `optional` **handleDataRequest**(`dataRequest`, `cursor?`, `limit?`): `Promise`\<\{ `data`: `IJsonLdDocument`; `cursor?`: `string`; \}\>

Handles a Data Request.

#### Parameters

##### dataRequest

[`IDataRequest`](../type-aliases/IDataRequest.md)

The data request.

##### cursor?

`string`

Cursor that points to the next item in the result set.

##### limit?

`number`

Maximum number of entries retrieved or to be retrieved.

#### Returns

`Promise`\<\{ `data`: `IJsonLdDocument`; `cursor?`: `string`; \}\>

Data as JSON-Ld.
