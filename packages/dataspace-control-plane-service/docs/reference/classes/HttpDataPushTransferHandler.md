# Class: HttpDataPushTransferHandler

Transfer handler for HttpData-PUSH format (consumer-initiated push).
The consumer supplies its /inbox endpoint in the TransferRequestMessage dataAddress.
The provider pushes ActivityStreams objects to that endpoint, and returns its own
/inbox in the TransferStartMessage so the consumer can route data notifications.

## Implements

- [`ITransferHandler`](../interfaces/ITransferHandler.md)

## Constructors

### Constructor

> **new HttpDataPushTransferHandler**(): `HttpDataPushTransferHandler`

#### Returns

`HttpDataPushTransferHandler`

## Properties

### CLASS\_NAME {#class_name}

> `readonly` `static` **CLASS\_NAME**: `string`

Runtime name for the class.

## Methods

### className() {#classname}

> **className**(): `string`

Returns the class name of the component.

#### Returns

`string`

The class name of the component.

#### Implementation of

`ITransferHandler.className`

***

### buildConsumerDataAddress() {#buildconsumerdataaddress}

> **buildConsumerDataAddress**(`ctx`): `IDataspaceProtocolDataAddress` \| `undefined`

Build the consumer's /inbox dataAddress for the TransferRequestMessage.

#### Parameters

##### ctx

[`ITransferHandlerPrepareContext`](../interfaces/ITransferHandlerPrepareContext.md)

Prepare context containing path and organization identity.

#### Returns

`IDataspaceProtocolDataAddress` \| `undefined`

The consumer's ActivityStream inbox dataAddress.

#### Throws

GeneralError When dataPlanePath is not configured.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`buildConsumerDataAddress`](../interfaces/ITransferHandler.md#buildconsumerdataaddress)

***

### buildProviderStartDataAddress() {#buildproviderstartdataaddress}

> **buildProviderStartDataAddress**(`ctx`): `Promise`\<`IDataspaceProtocolDataAddress` \| `undefined`\>

Validate the consumer's dataAddress and build the provider's /inbox endpoint
for the TransferStartMessage. No bearer token is included - the consumer authenticates
via the DSP protocol trust payload on the push POST.

#### Parameters

##### ctx

[`ITransferHandlerStartContext`](../interfaces/ITransferHandlerStartContext.md)

Start context containing entity and path configuration.

#### Returns

`Promise`\<`IDataspaceProtocolDataAddress` \| `undefined`\>

The provider's ActivityStream inbox dataAddress.

#### Throws

GeneralError When the consumer dataAddress is invalid or dataPlanePath is not configured.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`buildProviderStartDataAddress`](../interfaces/ITransferHandler.md#buildproviderstartdataaddress)

***

### onProviderStart() {#onproviderstart}

> **onProviderStart**(`dataPlaneComponent`, `consumerPid`, `previousState`): `Promise`\<`void`\>

Set up (or resume) the data-plane push subscription after state is persisted to STARTED.

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

A promise that resolves when the subscription is established.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`onProviderStart`](../interfaces/ITransferHandler.md#onproviderstart)

***

### onComplete() {#oncomplete}

> **onComplete**(`dataPlaneComponent`, `consumerPid`): `Promise`\<`void`\>

Tear down the push subscription when the transfer completes.

#### Parameters

##### dataPlaneComponent

`IDataspaceDataPlaneComponent`

The data plane component instance.

##### consumerPid

`string`

The consumer process ID.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the subscription is torn down.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`onComplete`](../interfaces/ITransferHandler.md#oncomplete)

***

### onSuspend() {#onsuspend}

> **onSuspend**(`dataPlaneComponent`, `consumerPid`): `Promise`\<`void`\>

Suspend the push subscription when the transfer is suspended.

#### Parameters

##### dataPlaneComponent

`IDataspaceDataPlaneComponent`

The data plane component instance.

##### consumerPid

`string`

The consumer process ID.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the subscription is suspended.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`onSuspend`](../interfaces/ITransferHandler.md#onsuspend)

***

### onTerminate() {#onterminate}

> **onTerminate**(`dataPlaneComponent`, `consumerPid`): `Promise`\<`void`\>

Tear down the push subscription when the transfer terminates.

#### Parameters

##### dataPlaneComponent

`IDataspaceDataPlaneComponent`

The data plane component instance.

##### consumerPid

`string`

The consumer process ID.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the subscription is torn down.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`onTerminate`](../interfaces/ITransferHandler.md#onterminate)
