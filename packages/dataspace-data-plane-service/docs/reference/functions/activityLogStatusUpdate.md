# Function: activityLogStatusUpdate()

> **activityLogStatusUpdate**(`socketRequestContext`, `componentName`, `request`, `emitter`): `Promise`\<`void`\>

Handles an activity log subscribe or unsubscribe operation over a WebSocket.

## Parameters

### socketRequestContext

`ISocketRequestContext`

The request context for the API.

### componentName

`string`

The name of the component to use in the routes.

### request

`IActivityLogStatusRequest`

The request.

### emitter

(`topic`, `response`) => `Promise`\<`void`\>

The emitter to send message back.

## Returns

`Promise`\<`void`\>

A promise that resolves when the subscribe or unsubscribe operation is complete.
