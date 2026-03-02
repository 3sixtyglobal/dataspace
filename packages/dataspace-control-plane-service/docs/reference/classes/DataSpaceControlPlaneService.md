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

`IDataspaceControlPlaneComponent.className`

***

### registerNegotiationCallback()

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

### unregisterNegotiationCallback()

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

### start()

> **start**(`nodeLoggingComponentType?`): `Promise`\<`void`\>

The service needs to be started when the application is initialized.
Populates the Federated Catalogue with datasets from registered apps
and starts the stalled negotiation cleanup task.

#### Parameters

##### nodeLoggingComponentType?

`string`

The node logging component type.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceControlPlaneComponent.start`

***

### stop()

> **stop**(`nodeLoggingComponentType?`): `Promise`\<`void`\>

Stop the service.
Removes the stalled negotiation cleanup task.

#### Parameters

##### nodeLoggingComponentType?

`string`

The node logging component type.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataspaceControlPlaneComponent.stop`

***

### requestTransfer()

> **requestTransfer**(`request`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferProcess`\>

Request a Transfer Process.
Creates a new Transfer Process in REQUESTED state.

#### Parameters

##### request

`IDataspaceProtocolTransferRequestMessage`

Transfer request message (DSP compliant).

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

### startTransfer()

> **startTransfer**(`message`, `publicOrigin`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferStartMessage`\>

Start a Transfer Process.
Transitions Transfer Process from REQUESTED to STARTED state or resumes from SUSPENDED state.

#### Parameters

##### message

`IDataspaceProtocolTransferStartMessage`

Transfer start message (DSP compliant).

##### publicOrigin

`string`

The public origin URL of this service.

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

### completeTransfer()

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

### suspendTransfer()

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

### terminateTransfer()

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

### getTransferProcess()

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

### negotiateAgreement()

> **negotiateAgreement**(`offerId`, `providerEndpoint`, `publicOrigin`, `trustPayload`): `Promise`\<\{ `negotiationId`: `string`; \}\>

Negotiate a contract agreement with a provider.
Returns immediately with a negotiationId. The caller is notified
via the registered INegotiationCallback when the negotiation completes.

#### Parameters

##### offerId

`string`

The offer ID from the provider's catalog.

##### providerEndpoint

`string`

The provider's contract negotiation endpoint URL.

##### publicOrigin

`string`

The public origin URL of this control plane (for callbacks).

##### trustPayload

`unknown`

The trust payload for authentication.

#### Returns

`Promise`\<\{ `negotiationId`: `string`; \}\>

The negotiation ID. Use the registered callback for completion notification.

#### Implementation of

`IDataspaceControlPlaneComponent.negotiateAgreement`

***

### getNegotiation()

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

### getNegotiationHistory()

> **getNegotiationHistory**(`state`, `cursor`, `trustPayload`): `Promise`\<\{ `negotiations`: `object`[]; `cursor?`: `string`; `count`: `number`; \}\>

Get negotiation history.

#### Parameters

##### state

Optional filter by negotiation state.

`string` | `undefined`

##### cursor

Optional pagination cursor.

`string` | `undefined`

##### trustPayload

`unknown`

Trust payload for authentication.

#### Returns

`Promise`\<\{ `negotiations`: `object`[]; `cursor?`: `string`; `count`: `number`; \}\>

List of negotiation history entries with pagination.

#### Implementation of

`IDataspaceControlPlaneComponent.getNegotiationHistory`

***

### resolveConsumerPid()

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

### resolveProviderPid()

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
