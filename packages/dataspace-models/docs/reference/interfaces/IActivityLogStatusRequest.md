# Interface: IActivityLogStatusRequest

WebSocket request to subscribe or unsubscribe from the activity log stream.

## Properties

### body {#body}

> **body**: `object`

Request body containing the subscribe or unsubscribe operation.

#### operation

> **operation**: `"subscribe"` \| `"unsubscribe"`

The operation to perform.

#### subscriptionId

> **subscriptionId**: `string`

The subscription Id.
