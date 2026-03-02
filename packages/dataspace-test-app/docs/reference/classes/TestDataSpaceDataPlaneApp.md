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

### APP\_ID

> `readonly` `static` **APP\_ID**: `"https://twin.example.org/app1"` = `"https://twin.example.org/app1"`

App Name.

***

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

`IDataspaceApp.className`

***

### datasetsHandled()

> **datasetsHandled**(): `Promise`\<`IDataspaceProtocolDataset`[]\>

Datasets handled by the App.

#### Returns

`Promise`\<`IDataspaceProtocolDataset`[]\>

Dataspace Protocol compliant datasets

#### Implementation of

`IDataspaceApp.datasetsHandled`

***

### supportedQueryTypes()

> **supportedQueryTypes**(): `string`[]

Supported query types.

#### Returns

`string`[]

Types.

#### Implementation of

`IDataspaceApp.supportedQueryTypes`

***

### start()

> **start**(`nodeLoggingComponentType?`): `Promise`\<`void`\>

Start method.

#### Parameters

##### nodeLoggingComponentType?

`string`

the logging component type of such a node.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceApp.start`

***

### activitiesHandled()

> **activitiesHandled**(): `IActivityQuery`[]

The activities handled by the App.

#### Returns

`IActivityQuery`[]

The activities handled by the App.

#### Implementation of

`IDataspaceApp.activitiesHandled`

***

### handleActivity()

> **handleActivity**\<`T`\>(`activity`): `Promise`\<`T`\>

Handle Activity.

#### Type Parameters

##### T

`T`

#### Parameters

##### activity

`IActivityStreamsActivity`

Activity

#### Returns

`Promise`\<`T`\>

Activity processing result

#### Implementation of

`IDataspaceApp.handleActivity`

***

### handleDataRequest()

> **handleDataRequest**(`dataRequest`, `cursor?`, `limit?`): `Promise`\<\{ `data`: `IJsonLdDocument`; `cursor?`: `string`; \}\>

Handles the Data Request.

#### Parameters

##### dataRequest

`IDataRequest`

The data request

##### cursor?

`string`

Cursor that points to the next item in the result set.

##### limit?

`number`

Maximum number of entries retrieved or to be retrieved.

#### Returns

`Promise`\<\{ `data`: `IJsonLdDocument`; `cursor?`: `string`; \}\>

the Data.

#### Implementation of

`IDataspaceApp.handleDataRequest`
