# Function: appRunnerStart()

> **appRunnerStart**(`engineCloneData`, `excludeComponents?`): `Promise`\<`void`\>

Dataspace Task Startup Method.

## Parameters

### engineCloneData

`unknown`

Engine clone data used to initialise a worker-thread engine instance.

### excludeComponents?

`string`[]

Verified regular expression patterns for component types to exclude from the clone.

## Returns

`Promise`\<`void`\>

A promise that resolves when the engine has started and is ready to process tasks.
