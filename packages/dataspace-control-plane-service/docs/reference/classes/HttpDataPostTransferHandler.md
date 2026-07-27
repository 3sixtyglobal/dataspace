# Class: HttpDataPostTransferHandler

Transfer handler for HttpData-POST format (provider-initiated push).
The consumer does not supply a dataAddress. The provider returns its own /inbox URL
along with a signed JWT so the consumer can authenticate when posting activities there.

## Implements

- [`ITransferHandler`](../interfaces/ITransferHandler.md)

## Constructors

### Constructor

> **new HttpDataPostTransferHandler**(): `HttpDataPostTransferHandler`

#### Returns

`HttpDataPostTransferHandler`

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

POST consumers do not supply a dataAddress — provider returns its own /inbox on start.

#### Parameters

##### ctx

[`ITransferHandlerPrepareContext`](../interfaces/ITransferHandlerPrepareContext.md)

Prepare context (unused for POST).

#### Returns

`IDataspaceProtocolDataAddress` \| `undefined`

undefined.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`buildConsumerDataAddress`](../interfaces/ITransferHandler.md#buildconsumerdataaddress)

***

### buildProviderStartDataAddress() {#buildproviderstartdataaddress}

> **buildProviderStartDataAddress**(`ctx`): `Promise`\<`IDataspaceProtocolDataAddress` \| `undefined`\>

Build the provider's /inbox dataAddress and signed JWT for the TransferStartMessage.

#### Parameters

##### ctx

[`ITransferHandlerStartContext`](../interfaces/ITransferHandlerStartContext.md)

Start context containing entity, trust component, and path configuration.

#### Returns

`Promise`\<`IDataspaceProtocolDataAddress` \| `undefined`\>

The provider's ActivityStream inbox dataAddress with bearer token.

#### Throws

GeneralError When dataPlanePath is not configured or providerIdentity is missing.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`buildProviderStartDataAddress`](../interfaces/ITransferHandler.md#buildproviderstartdataaddress)

***

### onProviderStart() {#onproviderstart}

> **onProviderStart**(`dataPlaneComponent`, `consumerPid`, `previousState`): `Promise`\<`void`\>

No-op: POST transfers do not involve a provider-managed push subscription on start.

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

A promise that resolves immediately.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`onProviderStart`](../interfaces/ITransferHandler.md#onproviderstart)

***

### onComplete() {#oncomplete}

> **onComplete**(`dataPlaneComponent`, `consumerPid`): `Promise`\<`void`\>

Tear down the data plane subscription when the transfer completes.

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

Suspend the data plane subscription when the transfer is suspended.

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

Tear down the data plane subscription when the transfer terminates.

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
