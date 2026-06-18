# Class: DataspaceControlPlaneService

Dataspace Control Plane Service implementation.

Handles contract negotiation (via PNP callbacks) and transfer process management.
Negotiation is fully callback-driven: negotiateAgreement() returns immediately with
a negotiationId, and the caller is notified via INegotiationCallback when complete.

## Implements

- `IDataspaceControlPlaneComponent`
- `IDataspaceControlPlaneResolverComponent`

## Constructors

### Constructor

> **new DataspaceControlPlaneService**(`options?`): `DataspaceControlPlaneService`

Create a new instance of DataspaceControlPlaneService.

#### Parameters

##### options?

[`IDataspaceControlPlaneServiceConstructorOptions`](../interfaces/IDataspaceControlPlaneServiceConstructorOptions.md)

The options for the service.

#### Returns

`DataspaceControlPlaneService`

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

Register a callback to receive negotiation state change notifications.
Upstream modules (e.g. supply-chain) register their callback here.

#### Parameters

##### key

`string`

A unique key identifying this callback registration.

##### callback

`INegotiationCallback`

The callback interface to register.

#### Returns

`void`

#### Implementation of

`IDataspaceControlPlaneComponent.registerNegotiationCallback`

***

### unregisterNegotiationCallback() {#unregisternegotiationcallback}

> **unregisterNegotiationCallback**(`key`): `void`

Unregister a previously registered negotiation callback.

#### Parameters

##### key

`string`

The key used when registering the callback.

#### Returns

`void`

#### Implementation of

`IDataspaceControlPlaneComponent.unregisterNegotiationCallback`

***

### registerTransferCallback() {#registertransfercallback}

> **registerTransferCallback**(`key`, `callback`): `void`

Register a callback to receive transfer process state change notifications.

#### Parameters

##### key

`string`

A unique key identifying this callback registration.

##### callback

`ITransferCallback`

The callback interface to register.

#### Returns

`void`

#### Implementation of

`IDataspaceControlPlaneComponent.registerTransferCallback`

***

### unregisterTransferCallback() {#unregistertransfercallback}

> **unregisterTransferCallback**(`key`): `void`

Unregister a previously registered transfer callback.

#### Parameters

##### key

`string`

The key used when registering the callback.

#### Returns

`void`

#### Implementation of

`IDataspaceControlPlaneComponent.unregisterTransferCallback`

***

### start() {#start}

> **start**(`nodeLoggingComponentType?`): `Promise`\<`void`\>

The service needs to be started when the application is initialized.

#### Parameters

##### nodeLoggingComponentType?

`string`

The node logging component type.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the federated catalogue is populated and the cleanup task is scheduled.

#### Implementation of

`IDataspaceControlPlaneComponent.start`

***

### stop() {#stop}

> **stop**(`nodeLoggingComponentType?`): `Promise`\<`void`\>

Stop the service.
Removes the stalled negotiation cleanup task.

#### Parameters

##### nodeLoggingComponentType?

`string`

The node logging component type.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the cleanup task has been removed.

#### Implementation of

`IDataspaceControlPlaneComponent.stop`

***

### requestTransfer() {#requesttransfer}

> **requestTransfer**(`request`, `options`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferProcess`\>

Request a Transfer Process.
Creates a new Transfer Process in REQUESTED state.

#### Parameters

##### request

`IDataspaceProtocolTransferRequestMessage`

Transfer request message (DSP compliant).

##### options

\{ `autoStart?`: `boolean`; \} \| `undefined`

Request options.

###### Type Literal

\{ `autoStart?`: `boolean`; \}

Request options.

###### autoStart?

`boolean`

When true, the provider immediately starts the requested transfer (scheduled
on the next tick); when omitted/false the provider start must be triggered explicitly.

***

`undefined`

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferProcess`\>

Transfer Process (DSP compliant) with state REQUESTED, or TransferError if the operation fails.

Role Performed: Provider
Called by: Consumer when it wants to request a new Transfer Process

#### Implementation of

`IDataspaceControlPlaneComponent.requestTransfer`

***

### prepareTransfer() {#preparetransfer}

> **prepareTransfer**(`agreementId`, `providerEndpoint`, `format`, `trustPayload`): `Promise`\<\{ `consumerPid`: `string`; \}\>

Prepare a data transfer as a Consumer.
Generates a consumerPid, POSTs a TransferRequestMessage to the provider's DSP endpoint,
and (only if the provider accepts) persists a local TransferProcess in REQUESTED state.

#### Parameters

##### agreementId

`string`

The finalized agreement ID from contract negotiation.

##### providerEndpoint

`string`

The provider's DSP control plane base URL.

##### format

`string`

The transfer format (e.g. "HttpData-PULL", "HttpData-PUSH").

##### trustPayload

`unknown`

Trust payload for authenticating this call.

#### Returns

`Promise`\<\{ `consumerPid`: `string`; \}\>

The consumerPid of the newly created TransferProcess.

**Engine configuration requirement:** The outbound call to the provider uses
`ComponentFactory.create(remoteControlPlaneComponentType, { endpoint, pathPrefix })`.
For the runtime `providerEndpoint` to be forwarded correctly, the engine **must** register
the component type (default: `dataspace-control-plane-rest-client`) as a
**multi-instance** component (`isMultiInstance: true` in engine config). A singleton
registration ignores the runtime `endpoint` arg and silently POSTs to its
static endpoint instead.

#### Implementation of

`IDataspaceControlPlaneComponent.prepareTransfer`

***

### startTransfer() {#starttransfer}

> **startTransfer**(`message`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferStartMessage`\>

Start a Transfer Process.
Transitions Transfer Process from REQUESTED to STARTED state or resumes from SUSPENDED state.

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

Role Performed: Provider / Consumer

#### Implementation of

`IDataspaceControlPlaneComponent.startTransfer`

***

### transferStarted() {#transferstarted}

> **transferStarted**(`pid`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferStartMessage`\>

Start a Transfer Process as the Provider.
Builds a TransferStartMessage for a transfer already accepted by this node (REQUESTED, or
SUSPENDED to resume), transitions it to STARTED, and POSTs the message to the consumer callback.
consumerPid/providerPid/callbackAddress are resolved from the stored record; the call is then
forwarded to startTransfer, the single owner of the start state machine (it verifies the caller is
the provider, builds the dataAddress for PULL, persists STARTED, and delivers to the consumer).
This is the provider-side mirror of prepareTransfer.

#### Parameters

##### pid

`string`

The Process ID (consumerPid or providerPid) identifying the transfer to start.

##### trustPayload

`unknown`

Trust payload proving the caller is the provider.

#### Returns

`Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferStartMessage`\>

Transfer Start Message (DSP compliant) with dataAddress for PULL transfers, or TransferError if the operation fails.

#### Implementation of

`IDataspaceControlPlaneComponent.transferStarted`

***

### completeTransfer() {#completetransfer}

> **completeTransfer**(`message`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferProcess`\>

Complete a Transfer Process.

#### Parameters

##### message

`IDataspaceProtocolTransferCompletionMessage`

Transfer completion message (DSP compliant).

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferProcess`\>

Transfer Process (DSP compliant) with state COMPLETED, or TransferError if the operation fails.

#### Implementation of

`IDataspaceControlPlaneComponent.completeTransfer`

***

### suspendTransfer() {#suspendtransfer}

> **suspendTransfer**(`message`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferProcess`\>

Suspend a Transfer Process.

#### Parameters

##### message

`IDataspaceProtocolTransferSuspensionMessage`

Transfer suspension message (DSP compliant).

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferProcess`\>

Transfer Process (DSP compliant) with state SUSPENDED, or TransferError if the operation fails.

#### Implementation of

`IDataspaceControlPlaneComponent.suspendTransfer`

***

### terminateTransfer() {#terminatetransfer}

> **terminateTransfer**(`message`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferProcess`\>

Terminate a Transfer Process.

#### Parameters

##### message

`IDataspaceProtocolTransferTerminationMessage`

Transfer termination message (DSP compliant).

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferProcess`\>

Transfer Process (DSP compliant) with state TERMINATED, or TransferError if the operation fails.

#### Implementation of

`IDataspaceControlPlaneComponent.terminateTransfer`

***

### getTransferProcess() {#gettransferprocess}

> **getTransferProcess**(`pid`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferProcess`\>

Get Transfer Process state.

#### Parameters

##### pid

`string`

Process ID (consumerPid or providerPid).

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferProcess`\>

Transfer Process (DSP compliant) with current state, or TransferError if the operation fails.

#### Implementation of

`IDataspaceControlPlaneComponent.getTransferProcess`

***

### negotiateAgreement() {#negotiateagreement}

> **negotiateAgreement**(`datasetId`, `offerId`, `providerEndpoint`, `trustPayload`): `Promise`\<\{ `negotiationId`: `string`; \}\>

Negotiate a contract agreement with a provider.
Returns immediately with a negotiationId. The caller is notified
via the registered INegotiationCallback when the negotiation completes.

#### Parameters

##### datasetId

`string`

The dataset ID from the provider's catalog.

##### offerId

`string`

The offer ID from the provider's catalog.

##### providerEndpoint

`string`

The provider's contract negotiation endpoint URL.

##### trustPayload

`unknown`

The trust payload for authentication.

#### Returns

`Promise`\<\{ `negotiationId`: `string`; \}\>

The negotiation ID. Use the registered callback for completion notification.

#### Implementation of

`IDataspaceControlPlaneComponent.negotiateAgreement`

***

### getNegotiation() {#getnegotiation}

> **getNegotiation**(`negotiationId`, `trustPayload`): `Promise`\<`IDataspaceProtocolContractNegotiation` \| `IDataspaceProtocolContractNegotiationError`\>

Get the current state of a contract negotiation.

#### Parameters

##### negotiationId

`string`

The unique identifier of the negotiation.

##### trustPayload

`unknown`

The trust payload for authentication.

#### Returns

`Promise`\<`IDataspaceProtocolContractNegotiation` \| `IDataspaceProtocolContractNegotiationError`\>

Current state of the negotiation.

#### Implementation of

`IDataspaceControlPlaneComponent.getNegotiation`

***

### getNegotiationHistory() {#getnegotiationhistory}

> **getNegotiationHistory**(`state`, `cursor`, `trustPayload`): `Promise`\<\{ `negotiations`: `object`[]; `cursor?`: `string`; `count`: `number`; \}\>

Get negotiation history.

#### Parameters

##### state

`string` \| `undefined`

Optional filter by negotiation state.

##### cursor

`string` \| `undefined`

Optional pagination cursor.

##### trustPayload

`unknown`

Trust payload for authentication.

#### Returns

`Promise`\<\{ `negotiations`: `object`[]; `cursor?`: `string`; `count`: `number`; \}\>

List of negotiation history entries with pagination.

#### Implementation of

`IDataspaceControlPlaneComponent.getNegotiationHistory`

***

### resolveConsumerPid() {#resolveconsumerpid}

> **resolveConsumerPid**(`consumerPid`, `trustPayload`): `Promise`\<`ITransferContext`\>

Resolve consumerPid to Transfer Context.

#### Parameters

##### consumerPid

`string`

Consumer Process ID.

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`ITransferContext`\>

Transfer Context with Agreement, datasetId, and Transfer Process metadata.

#### Implementation of

`IDataspaceControlPlaneResolverComponent.resolveConsumerPid`

***

### resolveProviderPid() {#resolveproviderpid}

> **resolveProviderPid**(`providerPid`, `trustPayload`): `Promise`\<`ITransferContext`\>

Resolve providerPid to Transfer Context.

#### Parameters

##### providerPid

`string`

Provider Process ID.

##### trustPayload

`unknown`

Trust payload containing authorization information (Base64-encoded token).

#### Returns

`Promise`\<`ITransferContext`\>

Transfer Context with Agreement, datasetId, and Transfer Process metadata.

#### Implementation of

`IDataspaceControlPlaneResolverComponent.resolveProviderPid`

***

### createAppDataset() {#createappdataset}

> **createAppDataset**(`id`, `appId`, `dataset`): `Promise`\<`string`\>

Register a dataset for a dataspace app, owned by the calling organization.

#### Parameters

##### id

`string` \| `undefined`

Optional explicit id. If omitted, derived from `dataset["@id"]`
or generated.

##### appId

`string`

The dataspace app this dataset belongs to.

##### dataset

`IDataspaceProtocolDataset`

The dataset payload.

#### Returns

`Promise`\<`string`\>

The resolved dataset id.

#### Implementation of

`IDataspaceControlPlaneComponent.createAppDataset`

***

### getAppDataset() {#getappdataset}

> **getAppDataset**(`id`): `Promise`\<`IDataspaceAppDataset`\>

Get a dataset record owned by the calling organization.

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

List the dataspace app datasets owned by the calling organization.

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

Update a dataset record owned by the calling organization.

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

A promise that resolves when the dataset has been updated in storage and the catalogue.

#### Implementation of

`IDataspaceControlPlaneComponent.updateAppDataset`

***

### deleteAppDataset() {#deleteappdataset}

> **deleteAppDataset**(`id`): `Promise`\<`void`\>

Delete a dataspace app dataset owned by the calling organization.

#### Parameters

##### id

`string`

The stored app dataset id.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the dataset has been removed from storage and the catalogue.

#### Implementation of

`IDataspaceControlPlaneComponent.deleteAppDataset`
