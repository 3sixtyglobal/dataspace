# Interface: ITransferHandler

Format-specific handler for transfer process operations.
One implementation exists per DataspaceTransferFormat value; the TransferHandlerFactory
returns the correct instance keyed on the format string.

## Extends

- `IComponent`

## Methods

### buildConsumerDataAddress() {#buildconsumerdataaddress}

> **buildConsumerDataAddress**(`ctx`): `IDataspaceProtocolDataAddress` \| `undefined`

Optionally build a consumer dataAddress for the TransferRequestMessage.
Called during prepareTransfer. Returns undefined for formats that do not
require a consumer-supplied dataAddress (PULL and POST).

#### Parameters

##### ctx

[`ITransferHandlerPrepareContext`](ITransferHandlerPrepareContext.md)

The prepare context.

#### Returns

`IDataspaceProtocolDataAddress` \| `undefined`

The consumer dataAddress, or undefined if not required for this format.

***

### buildProviderStartDataAddress() {#buildproviderstartdataaddress}

> **buildProviderStartDataAddress**(`ctx`): `Promise`\<`IDataspaceProtocolDataAddress` \| `undefined`\>

Build the provider dataAddress for the TransferStartMessage.
Called during startTransfer (provider role). Throws a GeneralError when
required configuration (e.g. dataPlanePath) is absent.

#### Parameters

##### ctx

[`ITransferHandlerStartContext`](ITransferHandlerStartContext.md)

The start context.

#### Returns

`Promise`\<`IDataspaceProtocolDataAddress` \| `undefined`\>

The provider dataAddress, or undefined if not applicable.

***

### onProviderStart() {#onproviderstart}

> **onProviderStart**(`dataPlaneComponent`, `consumerPid`, `previousState`): `Promise`\<`void`\>

Post-start hook for the provider role. Called after state has been persisted
to STARTED. PUSH transfers set up (or resume) the data-plane push subscription
here; all other formats are no-ops.

#### Parameters

##### dataPlaneComponent

`IDataspaceDataPlaneComponent`

The data plane component instance.

##### consumerPid

`string`

The consumer process ID.

##### previousState

`DataspaceProtocolTransferProcessStateType`

The state before the STARTED transition.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the hook completes.

***

### onComplete() {#oncomplete}

> **onComplete**(`dataPlaneComponent`, `consumerPid`): `Promise`\<`void`\>

Called after a transfer transitions to COMPLETED.
PUSH and POST tear down the push subscription; PULL is a no-op.

#### Parameters

##### dataPlaneComponent

`IDataspaceDataPlaneComponent`

The data plane component instance.

##### consumerPid

`string`

The consumer process ID.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the hook completes.

***

### onSuspend() {#onsuspend}

> **onSuspend**(`dataPlaneComponent`, `consumerPid`): `Promise`\<`void`\>

Called after a transfer transitions to SUSPENDED.
PUSH and POST suspend the push subscription; PULL is a no-op.

#### Parameters

##### dataPlaneComponent

`IDataspaceDataPlaneComponent`

The data plane component instance.

##### consumerPid

`string`

The consumer process ID.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the hook completes.

***

### onTerminate() {#onterminate}

> **onTerminate**(`dataPlaneComponent`, `consumerPid`): `Promise`\<`void`\>

Called after a transfer transitions to TERMINATED.
PUSH and POST tear down the push subscription; PULL is a no-op.

#### Parameters

##### dataPlaneComponent

`IDataspaceDataPlaneComponent`

The data plane component instance.

##### consumerPid

`string`

The consumer process ID.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the hook completes.
