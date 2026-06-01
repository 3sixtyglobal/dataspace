# Interface: ITransferCallback

Callback interface for transfer process state change notifications.
Upstream modules register an implementation via
IDataspaceControlPlaneComponent.registerTransferCallback() to be
notified when a consumer-initiated transfer changes state.

## Methods

### onStateChanged() {#onstatechanged}

> **onStateChanged**(`consumerPid`, `state`): `Promise`\<`void`\>

Called on every DSP-level state transition for the transfer process.

#### Parameters

##### consumerPid

`string`

The consumer-side process ID.

##### state

`DataspaceProtocolTransferProcessStateType`

The new DSP state.

#### Returns

`Promise`\<`void`\>

Nothing.

***

### onStarted() {#onstarted}

> **onStarted**(`consumerPid`, `message`): `Promise`\<`void`\>

Called when the provider sends a TransferStartMessage to the consumer.
The transfer is now STARTED and data can be accessed.

#### Parameters

##### consumerPid

`string`

The consumer-side process ID.

##### message

`IDataspaceProtocolTransferStartMessage`

The full DSP TransferStartMessage (contains dataAddress for PULL transfers).

#### Returns

`Promise`\<`void`\>

Nothing.

***

### onCompleted() {#oncompleted}

> **onCompleted**(`consumerPid`): `Promise`\<`void`\>

Called when the transfer reaches COMPLETED state.

#### Parameters

##### consumerPid

`string`

The consumer-side process ID.

#### Returns

`Promise`\<`void`\>

Nothing.

***

### onSuspended() {#onsuspended}

> **onSuspended**(`consumerPid`, `reason?`): `Promise`\<`void`\>

Called when the transfer is SUSPENDED.

#### Parameters

##### consumerPid

`string`

The consumer-side process ID.

##### reason?

`string`

Optional suspension reason from the DSP message.

#### Returns

`Promise`\<`void`\>

Nothing.

***

### onTerminated() {#onterminated}

> **onTerminated**(`consumerPid`, `reason?`): `Promise`\<`void`\>

Called when the transfer is TERMINATED.

#### Parameters

##### consumerPid

`string`

The consumer-side process ID.

##### reason?

`string`

Optional termination reason from the DSP message.

#### Returns

`Promise`\<`void`\>

Nothing.
