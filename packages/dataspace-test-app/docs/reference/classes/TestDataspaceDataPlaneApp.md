# Class: TestDataspaceDataPlaneApp

Test App Activity Handler.

## Implements

- `IDataspaceApp`

## Constructors

### Constructor

> **new TestDataspaceDataPlaneApp**(`options?`): `TestDataspaceDataPlaneApp`

Create a new instance of TestDataspaceDataPlaneApp.

#### Parameters

##### options?

[`ITestAppConstructorOptions`](../interfaces/ITestAppConstructorOptions.md)

The constructor options.

#### Returns

`TestDataspaceDataPlaneApp`

## Properties

### APP\_ID {#app_id}

> `readonly` `static` **APP\_ID**: `"https://twin.example.org/app1"` = `"https://twin.example.org/app1"`

App Name.

***

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

`IDataspaceApp.className`

***

### processingGroups() {#processinggroups}

> **processingGroups**(): `object`

The settings for the processing groups for tasks.

#### Returns

`object`

The options for each process group.

#### Implementation of

`IDataspaceApp.processingGroups`

***

### supportedQueryTypes() {#supportedquerytypes}

> **supportedQueryTypes**(): `string`[]

Supported query types.

#### Returns

`string`[]

The query type identifiers supported by this app.

#### Implementation of

`IDataspaceApp.supportedQueryTypes`

***

### start() {#start}

> **start**(`nodeLoggingComponentType?`): `Promise`\<`void`\>

Start method.

#### Parameters

##### nodeLoggingComponentType?

`string`

The logging component type of such a node.

#### Returns

`Promise`\<`void`\>

A promise that resolves when data type handlers are registered and the node identity is captured.

#### Implementation of

`IDataspaceApp.start`

***

### activitiesHandled() {#activitieshandled}

> **activitiesHandled**(): `IActivityQuery`[]

The activities handled by the App.

#### Returns

`IActivityQuery`[]

The activities handled by the App.

#### Implementation of

`IDataspaceApp.activitiesHandled`

***

### handleActivity() {#handleactivity}

> **handleActivity**\<`T`\>(`activity`): `Promise`\<`T`\>

Handle Activity.

#### Type Parameters

##### T

`T`

#### Parameters

##### activity

`IDataspaceActivity`

The activity to handle.

#### Returns

`Promise`\<`T`\>

The activity processing result produced by this app.

#### Implementation of

`IDataspaceApp.handleActivity`

***

### handleDataRequest() {#handledatarequest}

> **handleDataRequest**(`dataRequest`, `cursor?`, `limit?`): `Promise`\<\{ `data`: `IJsonLdDocument`; `cursor?`: `string`; \}\>

Handles the Data Request.

#### Parameters

##### dataRequest

`IDataRequest`

The data request.

##### cursor?

`string`

Cursor that points to the next item in the result set.

##### limit?

`number`

Maximum number of entries retrieved or to be retrieved.

#### Returns

`Promise`\<\{ `data`: `IJsonLdDocument`; `cursor?`: `string`; \}\>

The matching JSON-LD data and an optional next-page cursor.

#### Implementation of

`IDataspaceApp.handleDataRequest`
