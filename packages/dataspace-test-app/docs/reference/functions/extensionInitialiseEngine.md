# Function: extensionInitialiseEngine()

> **extensionInitialiseEngine**(`engineCore`): `Promise`\<`void`\>

Initialise the engine for the extension.

## Parameters

### engineCore

The engine core instance.

#### addTypeInitialiser

(`type`, `module`, `name`) => `void`

Registers a named type initialiser module and export with the engine.

## Returns

`Promise`\<`void`\>

A promise that resolves when the type initialiser has been registered with the engine.
