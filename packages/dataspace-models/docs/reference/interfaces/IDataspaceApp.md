# Interface: IDataspaceApp

Interface describes a Dataspace App.

## Extends

- `IComponent`

## Methods

### processingGroups()? {#processinggroups}

> `optional` **processingGroups**(): `object`

The settings for the processing groups for tasks.

#### Returns

`object`

The options for each process group.

***

### activitiesHandled() {#activitieshandled}

> **activitiesHandled**(): [`IActivityQuery`](IActivityQuery.md)[]

The activities handled by the App.

#### Returns

[`IActivityQuery`](IActivityQuery.md)[]

A query that describes the set of activities handled by the App.

***

### datasetsHandled()? {#datasetshandled}

> `optional` **datasetsHandled**(`payload`, `tenantId`): `Promise`\<`IDataspaceProtocolDataset`[]\>

Optional override called by the Control Plane when publishing a stored dataset for this app.
The Control Plane always calls `populateDefaults` (e.g. `dcterms:publisher`)
on every dataset returned here, so apps don't need to populate publisher themselves.

#### Parameters

##### payload

`IDataspaceProtocolDataset`

The user-stored dataset payload.

##### tenantId

`string`

The owning tenant for this dataset. Empty string on
single-tenant nodes (no `TWIN_TENANT_ENABLED`).

#### Returns

`Promise`\<`IDataspaceProtocolDataset`[]\>

One or more datasets to publish to the catalogue. System-stamped
fields like `dcterms:publisher` may be omitted — the Control Plane fills them in.

***

### supportedQueryTypes() {#supportedquerytypes}

> **supportedQueryTypes**(): `string`[]

The types of queries supported.

#### Returns

`string`[]

The types of queries supported by the Dataspace App to retrieve data.

***

### handleActivity()? {#handleactivity}

> `optional` **handleActivity**\<`T`\>(`activity`): `Promise`\<`T`\>

Handles an Activity and report about results through the Dataspace Data Plane Callback

#### Type Parameters

##### T

`T`

#### Parameters

##### activity

[`IDataspaceActivity`](IDataspaceActivity.md)

The Activity to be handled

#### Returns

`Promise`\<`T`\>

The result of executing the Activity.

***

### handleDataRequest()? {#handledatarequest}

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
