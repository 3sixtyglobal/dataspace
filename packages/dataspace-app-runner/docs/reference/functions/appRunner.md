# Function: appRunner()

> **appRunner**(`engineCloneData`, `payload`): `Promise`\<`unknown`\>

Dataspace Task.

## Parameters

### engineCloneData

`IEngineCoreClone`

Engine clone data used to initialise a worker-thread engine instance.

### payload

`IExecutionPayload`

The execution payload describing the activity and target app.

## Returns

`Promise`\<`unknown`\>

The result produced by the app's handleActivity method.
