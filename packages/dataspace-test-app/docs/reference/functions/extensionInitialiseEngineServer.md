# Function: extensionInitialiseEngineServer()

> **extensionInitialiseEngineServer**(`engineCore`, `engineServer`): `Promise`\<`void`\>

Initialise the engine server for the extension.

## Parameters

### engineCore

`unknown`

The engine core instance (unused by this extension).

### engineServer

The engine server instance.

#### addRestRouteGenerator

(`type`, `module`, `name`) => `void`

Registers a named REST route generator module and export with the engine server.

## Returns

`Promise`\<`void`\>

A promise that resolves when the REST route generator has been registered with the engine server.
