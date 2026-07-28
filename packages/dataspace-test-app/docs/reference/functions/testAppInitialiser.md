# Function: testAppInitialiser()

> **testAppInitialiser**(`engineCore`, `context`, `instanceConfig`): `object`

Test Dataspace Data Plane App initializer.

## Parameters

### engineCore

The engine core.

#### getRegisteredInstanceType

(`type`) => `string`

Returns the registered instance type name for a given component type.

### context

`unknown`

The engine core context (unused by this extension).

### instanceConfig

The instance config.

#### type

`"service"`

The instance type.

#### options

[`ITestAppConstructorOptions`](../interfaces/ITestAppConstructorOptions.md)

The instance config options.

## Returns

`object`

The instance created and the factory for it.

### instanceTypeName?

> `optional` **instanceTypeName?**: `string`

### factory

> **factory**: `Factory`\<`IDataspaceApp`\>

### createComponent?

> `optional` **createComponent?**: (`createConfig`) => [`TestDataspaceDataPlaneApp`](../classes/TestDataspaceDataPlaneApp.md)

#### Parameters

##### createConfig

###### type

`"service"`

###### options

[`ITestAppConstructorOptions`](../interfaces/ITestAppConstructorOptions.md)

#### Returns

[`TestDataspaceDataPlaneApp`](../classes/TestDataspaceDataPlaneApp.md)
