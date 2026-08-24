# Function: extensionInitialise()

> **extensionInitialise**(`envVars`, `nodeEngineConfig`): `Promise`\<`void`\>

Initialise the extension.

## Parameters

### envVars

The environment variables for the node.

### nodeEngineConfig

The node engine config.

#### types

\{\[`key`: `string`\]: `unknown`[]; \}

The component type configurations keyed by type name.

## Returns

`Promise`\<`void`\>

A promise that resolves when the test app component type has been registered in the engine config.
