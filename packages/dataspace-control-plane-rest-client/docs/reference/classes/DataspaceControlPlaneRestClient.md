# Class: DataspaceControlPlaneRestClient

Client for performing dataspace control plane operations through REST endpoints.
Implements Eclipse Dataspace Protocol (DSP) Transfer Process Protocol.

## Extends

- `BaseRestClient`

## Implements

- `Omit`\<`IDataspaceControlPlaneComponent`, `"registerNegotiationCallback"` \| `"unregisterNegotiationCallback"` \| `"negotiateAgreement"` \| `"getNegotiation"` \| `"getNegotiationHistory"`\>

## Constructors

### Constructor

> **new DataspaceControlPlaneRestClient**(`config`): `DataspaceControlPlaneRestClient`

Create a new instance of DataspaceControlPlaneRestClient.

#### Parameters

##### config

`IBaseRestClientConfig`

The configuration for the client.

#### Returns

`DataspaceControlPlaneRestClient`

#### Overrides

`BaseRestClient.constructor`

## Properties

### CLASS\_NAME

> `readonly` `static` **CLASS\_NAME**: `string`

Runtime name for the class.

## Methods

### className()

> **className**(): `string`

Returns the class name of the component.

#### Returns

`string`

The class name of the component.

#### Implementation of

`Omit.className`

***

### requestTransfer()

> **requestTransfer**(`request`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Request a Transfer Process.

#### Parameters

##### request

`IDataspaceProtocolTransferRequestMessage`

Transfer request message (DSP compliant).

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Transfer Process (DSP compliant) with state REQUESTED, or TransferError if the operation fails.

#### Implementation of

`Omit.requestTransfer`

***

### startTransfer()

> **startTransfer**(`message`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferStartMessage`\>

Start a Transfer Process (Provider Side).

#### Parameters

##### message

`IDataspaceProtocolTransferStartMessage`

Transfer start message (DSP compliant).

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferStartMessage`\>

Transfer Start Message (DSP compliant) with dataAddress for PULL transfers, or TransferError if the operation fails.

#### Implementation of

`Omit.startTransfer`

***

### completeTransfer()

> **completeTransfer**(`message`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Complete a Transfer Process.

#### Parameters

##### message

`IDataspaceProtocolTransferCompletionMessage`

Transfer completion message (DSP compliant).

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Transfer Process (DSP compliant) with state COMPLETED, or TransferError if the operation fails.

#### Implementation of

`Omit.completeTransfer`

***

### suspendTransfer()

> **suspendTransfer**(`message`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Suspend a Transfer Process.

#### Parameters

##### message

`IDataspaceProtocolTransferSuspensionMessage`

Transfer suspension message (DSP compliant).

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Transfer Process (DSP compliant) with state SUSPENDED, or TransferError if the operation fails.

#### Implementation of

`Omit.suspendTransfer`

***

### terminateTransfer()

> **terminateTransfer**(`message`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Terminate a Transfer Process.

#### Parameters

##### message

`IDataspaceProtocolTransferTerminationMessage`

Transfer termination message (DSP compliant).

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Transfer Process (DSP compliant) with state TERMINATED, or TransferError if the operation fails.

#### Implementation of

`Omit.terminateTransfer`

***

### getTransferProcess()

> **getTransferProcess**(`pid`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Get Transfer Process state (DSP compliant).

#### Parameters

##### pid

`string`

Process ID (consumerPid or providerPid).

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Transfer Process (DSP compliant) with current state, or TransferError if the operation fails.

#### Implementation of

`Omit.getTransferProcess`
