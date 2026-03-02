# Function: testAppInitialiser()

> **testAppInitialiser**(`engineCore`, `context`, `instanceConfig`): `EngineTypeInitialiserReturn`\<\{ `type`: `"service"`; `options`: [`ITestAppConstructorOptions`](../interfaces/ITestAppConstructorOptions.md); \}, `Factory`\<`IDataspaceApp`\>\>

Test Dataspace Data Plane App initializer.

## Parameters

### engineCore

`IEngineCore`\<`IEngineConfig`\>

The engine core.

### context

`IEngineCoreContext`

The context for the engine.

### instanceConfig

The instance config.

#### type

`"service"`

The instance type.

#### options

[`ITestAppConstructorOptions`](../interfaces/ITestAppConstructorOptions.md)

The instance config options.

## Returns

`EngineTypeInitialiserReturn`\<\{ `type`: `"service"`; `options`: [`ITestAppConstructorOptions`](../interfaces/ITestAppConstructorOptions.md); \}, `Factory`\<`IDataspaceApp`\>\>

The instance created and the factory for it.
