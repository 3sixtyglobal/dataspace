# Function: pushDeliveryRunner()

> **pushDeliveryRunner**(`engineCloneData`, `payload`): `Promise`\<`unknown`\>

Push Delivery Task - POSTs an Activity Streams object to a consumer's /inbox.

## Parameters

### engineCloneData

`undefined`

Engine clone data used to initialise a worker-thread engine instance.

### payload

`IPushDeliveryPayload`

The push delivery payload describing the consumer endpoint, auth, and data.

## Returns

`Promise`\<`unknown`\>

The delivery result containing a success flag on successful POST.
