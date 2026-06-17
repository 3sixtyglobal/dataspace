# Class: DataspaceControlPlaneRestClient

Client for performing dataspace control plane operations through REST endpoints.
Implements Eclipse Dataspace Protocol (DSP) Transfer Process Protocol.

## Extends

- `BaseRestClient`

## Implements

- `IDataspaceControlPlaneComponent`

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

`IDataspaceControlPlaneComponent.className`

***

### registerNegotiationCallback() {#registernegotiationcallback}

> **registerNegotiationCallback**(`key`, `callback`): `void`

Not supported on REST client — negotiation callbacks are in-process only.

#### Parameters

##### key

`string`

Unused.

##### callback

`INegotiationCallback`

Unused.

#### Returns

`void`

#### Throws

NotSupportedError as this method is not supported on the REST client.

#### Implementation of

`IDataspaceControlPlaneComponent.registerNegotiationCallback`

***

### unregisterNegotiationCallback() {#unregisternegotiationcallback}

> **unregisterNegotiationCallback**(`key`): `void`

Not supported on REST client — negotiation callbacks are in-process only.

#### Parameters

##### key

`string`

Unused.

#### Returns

`void`

#### Throws

NotSupportedError as this method is not supported on the REST client.

#### Implementation of

`IDataspaceControlPlaneComponent.unregisterNegotiationCallback`

***

### negotiateAgreement() {#negotiateagreement}

> **negotiateAgreement**(`datasetId`, `offerId`, `providerEndpoint`, `publicOrigin`, `trustPayload`): `Promise`\<\{ `negotiationId`: `string`; \}\>

Not supported on REST client — contract negotiation is in-process only.

#### Parameters

##### datasetId

`string`

Unused.

##### offerId

`string`

Unused.

##### providerEndpoint

`string`

Unused.

##### publicOrigin

`string`

Unused.

##### trustPayload

`unknown`

Unused.

#### Returns

`Promise`\<\{ `negotiationId`: `string`; \}\>

The negotiation ID for tracking.

#### Implementation of

`IDataspaceControlPlaneComponent.negotiateAgreement`

***

### getNegotiation() {#getnegotiation}

> **getNegotiation**(`negotiationId`, `trustPayload`): `Promise`\<`IDataspaceProtocolContractNegotiation` \| `IDataspaceProtocolContractNegotiationError`\>

Not supported on REST client — contract negotiation is in-process only.

#### Parameters

##### negotiationId

`string`

Unused.

##### trustPayload

`unknown`

Unused.

#### Returns

`Promise`\<`IDataspaceProtocolContractNegotiation` \| `IDataspaceProtocolContractNegotiationError`\>

DSP ContractNegotiation with current state, or error.

#### Implementation of

`IDataspaceControlPlaneComponent.getNegotiation`

***

### getNegotiationHistory() {#getnegotiationhistory}

> **getNegotiationHistory**(`state`, `cursor`, `trustPayload`): `Promise`\<\{ `negotiations`: `object`[]; `cursor?`: `string`; `count`: `number`; \}\>

Not supported on REST client — contract negotiation is in-process only.

#### Parameters

##### state

`string` \| `undefined`

Unused.

##### cursor

`string` \| `undefined`

Unused.

##### trustPayload

`unknown`

Unused.

#### Returns

`Promise`\<\{ `negotiations`: `object`[]; `cursor?`: `string`; `count`: `number`; \}\>

List of negotiation history entries with pagination cursor.

#### Implementation of

`IDataspaceControlPlaneComponent.getNegotiationHistory`

***

### registerTransferCallback() {#registertransfercallback}

> **registerTransferCallback**(`key`, `callback`): `void`

Not supported on REST client — transfer callbacks are in-process only.

#### Parameters

##### key

`string`

Unused.

##### callback

`ITransferCallback`

Unused.

#### Returns

`void`

#### Throws

NotSupportedError as this method is not supported on the REST client.

#### Implementation of

`IDataspaceControlPlaneComponent.registerTransferCallback`

***

### unregisterTransferCallback() {#unregistertransfercallback}

> **unregisterTransferCallback**(`key`): `void`

Not supported on REST client — transfer callbacks are in-process only.

#### Parameters

##### key

`string`

Unused.

#### Returns

`void`

#### Throws

NotSupportedError as this method is not supported on the REST client.

#### Implementation of

`IDataspaceControlPlaneComponent.unregisterTransferCallback`

***

### startDataTransfer() {#startdatatransfer}

> **startDataTransfer**(`agreementId`, `providerEndpoint`, `publicOrigin`, `format`, `trustPayload`): `Promise`\<\{ `consumerPid`: `string`; \}\>

Not supported on REST client — consumer-initiated transfers are in-process only.

#### Parameters

##### agreementId

`string`

Unused.

##### providerEndpoint

`string`

Unused.

##### publicOrigin

`string`

Unused.

##### format

`string`

Unused.

##### trustPayload

`unknown`

Unused.

#### Returns

`Promise`\<\{ `consumerPid`: `string`; \}\>

The consumerPid of the newly created TransferProcess.

#### Implementation of

`IDataspaceControlPlaneComponent.startDataTransfer`

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

`IDataspaceControlPlaneComponent.requestTransfer`

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

`IDataspaceControlPlaneComponent.startTransfer`

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

`IDataspaceControlPlaneComponent.completeTransfer`

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

`IDataspaceControlPlaneComponent.suspendTransfer`

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

`IDataspaceControlPlaneComponent.terminateTransfer`

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

`IDataspaceControlPlaneComponent.getTransferProcess`

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

`IDataspaceControlPlaneComponent.createAppDataset`

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

`IDataspaceControlPlaneComponent.getAppDataset`

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

`IDataspaceControlPlaneComponent.listAppDatasets`

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

A promise that resolves when the dataset has been updated.

#### Implementation of

`IDataspaceControlPlaneComponent.updateAppDataset`

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

A promise that resolves when the dataset has been deleted.

#### Implementation of

`IDataspaceControlPlaneComponent.deleteAppDataset`
