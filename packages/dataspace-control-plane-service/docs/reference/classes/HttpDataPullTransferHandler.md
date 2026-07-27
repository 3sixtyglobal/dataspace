# Class: HttpDataPullTransferHandler

Transfer handler for HttpData-PULL format.
Consumer queries the provider's data endpoint using a bearer token supplied in the
TransferStartMessage dataAddress. No data-plane push subscription is involved.

## Implements

- [`ITransferHandler`](../interfaces/ITransferHandler.md)

## Constructors

### Constructor

> **new HttpDataPullTransferHandler**(): `HttpDataPullTransferHandler`

#### Returns

`HttpDataPullTransferHandler`

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

PULL consumers do not supply a dataAddress — the provider generates one on start.

#### Parameters

##### ctx

[`ITransferHandlerPrepareContext`](../interfaces/ITransferHandlerPrepareContext.md)

Prepare context (unused for PULL).

#### Returns

`IDataspaceProtocolDataAddress` \| `undefined`

undefined.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`buildConsumerDataAddress`](../interfaces/ITransferHandler.md#buildconsumerdataaddress)

***

### buildProviderStartDataAddress() {#buildproviderstartdataaddress}

> **buildProviderStartDataAddress**(`ctx`): `Promise`\<`IDataspaceProtocolDataAddress` \| `undefined`\>

Build the provider's data endpoint and bearer token for the TransferStartMessage.

#### Parameters

##### ctx

[`ITransferHandlerStartContext`](../interfaces/ITransferHandlerStartContext.md)

Start context containing entity, trust component, and path configuration.

#### Returns

`Promise`\<`IDataspaceProtocolDataAddress` \| `undefined`\>

The dataAddress carrying the query endpoint and bearer token.

#### Throws

GeneralError When dataPlanePath is not configured or providerIdentity is missing.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`buildProviderStartDataAddress`](../interfaces/ITransferHandler.md#buildproviderstartdataaddress)

***

### onProviderStart() {#onproviderstart}

> **onProviderStart**(`dataPlaneComponent`, `consumerPid`, `previousState`): `Promise`\<`void`\>

No-op: PULL transfers require no push subscription.

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

No-op: PULL transfers have no push subscription to tear down.

#### Parameters

##### dataPlaneComponent

`IDataspaceDataPlaneComponent`

The data plane component instance.

##### consumerPid

`string`

The consumer process ID.

#### Returns

`Promise`\<`void`\>

A promise that resolves immediately.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`onComplete`](../interfaces/ITransferHandler.md#oncomplete)

***

### onSuspend() {#onsuspend}

> **onSuspend**(`dataPlaneComponent`, `consumerPid`): `Promise`\<`void`\>

No-op: PULL transfers have no push subscription to suspend.

#### Parameters

##### dataPlaneComponent

`IDataspaceDataPlaneComponent`

The data plane component instance.

##### consumerPid

`string`

The consumer process ID.

#### Returns

`Promise`\<`void`\>

A promise that resolves immediately.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`onSuspend`](../interfaces/ITransferHandler.md#onsuspend)

***

### onTerminate() {#onterminate}

> **onTerminate**(`dataPlaneComponent`, `consumerPid`): `Promise`\<`void`\>

No-op: PULL transfers have no push subscription to tear down.

#### Parameters

##### dataPlaneComponent

`IDataspaceDataPlaneComponent`

The data plane component instance.

##### consumerPid

`string`

The consumer process ID.

#### Returns

`Promise`\<`void`\>

A promise that resolves immediately.

#### Implementation of

[`ITransferHandler`](../interfaces/ITransferHandler.md).[`onTerminate`](../interfaces/ITransferHandler.md#onterminate)
