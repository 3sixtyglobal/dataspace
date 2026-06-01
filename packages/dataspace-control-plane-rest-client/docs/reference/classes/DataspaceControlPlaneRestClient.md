# Class: DataspaceControlPlaneRestClient

Client for performing dataspace control plane operations through REST endpoints.
Implements Eclipse Dataspace Protocol (DSP) Transfer Process Protocol.

## Extends

- `BaseRestClient`

## Implements

- `Omit`\<`IDataspaceControlPlaneComponent`, `"registerNegotiationCallback"` \| `"unregisterNegotiationCallback"` \| `"negotiateAgreement"` \| `"getNegotiation"` \| `"getNegotiationHistory"` \| `"registerTransferCallback"` \| `"unregisterTransferCallback"` \| `"startDataTransfer"`\>

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

`Omit.className`

***

### requestTransfer() {#requesttransfer}

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

### startTransfer() {#starttransfer}

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

### completeTransfer() {#completetransfer}

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

### suspendTransfer() {#suspendtransfer}

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

### terminateTransfer() {#terminatetransfer}

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

### getTransferProcess() {#gettransferprocess}

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

***

### createAppDataset() {#createappdataset}

> **createAppDataset**(`id`, `appId`, `dataset`): `Promise`\<`string`\>

Register an app dataset for the calling tenant.

#### Parameters

##### id

`string` \| `undefined`

Optional explicit id. If omitted, derived from `dataset["@id"]`
or generated by the server.

##### appId

`string`

The dataspace app this dataset belongs to.

##### dataset

`IDataspaceProtocolDataset`

The dataset payload.

#### Returns

`Promise`\<`string`\>

The resolved dataset id (from the response Location header).

#### Implementation of

`Omit.createAppDataset`

***

### getAppDataset() {#getappdataset}

> **getAppDataset**(`id`): `Promise`\<`IDataspaceAppDataset`\>

Get an app dataset record owned by the calling tenant.

#### Parameters

##### id

`string`

The stored dataset id.

#### Returns

`Promise`\<`IDataspaceAppDataset`\>

The stored dataset record.

#### Implementation of

`Omit.getAppDataset`

***

### listAppDatasets() {#listappdatasets}

> **listAppDatasets**(`cursor?`, `limit?`): `Promise`\<\{ `entities`: `IDataspaceAppDataset`[]; `cursor?`: `string`; \}\>

List the datasets owned by the calling tenant.

#### Parameters

##### cursor?

`string`

Optional pagination cursor.

##### limit?

`number`

Optional maximum number of entries to return.

#### Returns

`Promise`\<\{ `entities`: `IDataspaceAppDataset`[]; `cursor?`: `string`; \}\>

The stored datasets and the next-page cursor if more exist.

#### Implementation of

`Omit.listAppDatasets`

***

### updateAppDataset() {#updateappdataset}

> **updateAppDataset**(`id`, `appId`, `dataset`): `Promise`\<`void`\>

Update an app dataset record owned by the calling tenant.

#### Parameters

##### id

`string`

The stored dataset id.

##### appId

`string`

The dataspace app this dataset belongs to.

##### dataset

`IDataspaceProtocolDataset`

The dataset payload.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`Omit.updateAppDataset`

***

### deleteAppDataset() {#deleteappdataset}

> **deleteAppDataset**(`id`): `Promise`\<`void`\>

Delete an app dataset record owned by the calling tenant.

#### Parameters

##### id

`string`

The stored app dataset id.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`Omit.deleteAppDataset`
