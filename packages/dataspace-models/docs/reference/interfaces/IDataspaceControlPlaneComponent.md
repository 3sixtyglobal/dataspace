# Interface: IDataspaceControlPlaneComponent

Dataspace Control Plane Component interface.
Implements Eclipse Dataspace Protocol (DSP) specifications:
- Contract Negotiation Protocol
- Transfer Process Protocol

This component acts as the Control Plane for contract negotiation and
data transfers between nodes in a dataspace.

DSP 2025-1 Specification: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/

## Extends

- `IComponent`

## Methods

### registerNegotiationCallback() {#registernegotiationcallback}

> **registerNegotiationCallback**(`key`, `callback`): `void`

Register a callback to receive negotiation state change notifications.
Upstream modules (e.g. supply-chain) register their callback here
to be notified when negotiations complete, fail, or change state.

#### Parameters

##### key

`string`

A unique key identifying this callback registration.

##### callback

[`INegotiationCallback`](INegotiationCallback.md)

The callback interface to register.

#### Returns

`void`

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

***

### negotiateAgreement() {#negotiateagreement}

> **negotiateAgreement**(`datasetId`, `offerId`, `providerEndpoint`, `publicOrigin`, `trustPayload`): `Promise`\<\{ `negotiationId`: `string`; \}\>

Negotiate a contract agreement with a provider.
Implements DSP Contract Negotiation Protocol.

Returns immediately with a negotiationId. The caller is notified
via the registered INegotiationCallback when the negotiation completes.
The negotiation follows DSP state machine: REQUESTED → OFFERED → AGREED → VERIFIED → FINALIZED.

This method has NO REST client implementation — it is only accessible via ComponentFactory.get().

DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/#negotiation-protocol

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

##### publicOrigin

`string`

The public origin URL of this control plane (for callbacks).

##### trustPayload

`unknown`

Trust payload for authentication (JWT or Verifiable Credential).

#### Returns

`Promise`\<\{ `negotiationId`: `string`; \}\>

The negotiation ID for tracking. Use registered callback for completion.

***

### getNegotiation() {#getnegotiation}

> **getNegotiation**(`negotiationId`, `trustPayload`): `Promise`\<`IDataspaceProtocolContractNegotiation` \| `IDataspaceProtocolContractNegotiationError`\>

Get the current state of a contract negotiation.
Implements DSP Contract Negotiation Protocol.

Queries the current state of an ongoing or completed negotiation.
Use this to monitor negotiation progress.
Returns the DSP-compliant negotiation state or error.

DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/#negotiation-protocol

#### Parameters

##### negotiationId

`string`

The unique identifier of the negotiation.

##### trustPayload

`unknown`

Trust payload for authentication.

#### Returns

`Promise`\<`IDataspaceProtocolContractNegotiation` \| `IDataspaceProtocolContractNegotiationError`\>

DSP ContractNegotiation with current state, or error.

***

### getNegotiationHistory() {#getnegotiationhistory}

> **getNegotiationHistory**(`state`, `cursor`, `trustPayload`): `Promise`\<\{ `negotiations`: `object`[]; `cursor?`: `string`; `count`: `number`; \}\>

Get negotiation history.
Queries past contract negotiations for audit trails and debugging.

Returns a list of past negotiations with their states and metadata.
Supports optional filtering by state and pagination via cursor.

#### Parameters

##### state

Optional filter by negotiation state (e.g., "FINALIZED", "TERMINATED").

`string` | `undefined`

##### cursor

Optional pagination cursor for fetching next page.

`string` | `undefined`

##### trustPayload

`unknown`

Trust payload for authentication.

#### Returns

`Promise`\<\{ `negotiations`: `object`[]; `cursor?`: `string`; `count`: `number`; \}\>

List of negotiation history entries with pagination cursor.

***

### requestTransfer() {#requesttransfer}

> **requestTransfer**(`request`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Request a Transfer Process.
Creates a new Transfer Process in REQUESTED state.

Role Performed: Provider
Called by: Consumer when it wants to request a new Transfer Process

DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#transfer-request-message

#### Parameters

##### request

`IDataspaceProtocolTransferRequestMessage`

Transfer request message (DSP compliant) containing agreementId,
consumerPid, callbackAddress, and format.

##### trustPayload

`unknown`

Trust payload containing authorization information (JWT, VC, etc.).
The consumer must prove their identity by providing a valid trust payload.

#### Returns

`Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Transfer Process (DSP compliant) with state REQUESTED, including
both consumerPid and providerPid, or TransferError if the operation fails.

***

### startTransfer() {#starttransfer}

> **startTransfer**(`message`, `publicOrigin`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferStartMessage`\>

Start a Transfer Process.
Transitions Transfer Process from REQUESTED to STARTED state, or resumes from SUSPENDED state.

Role Performed: Provider / Consumer
Called by: Provider when a Transfer Process starts, or Consumer to attempt to start a Transfer Process after it has been suspended

DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#transfer-start-message

#### Parameters

##### message

`IDataspaceProtocolTransferStartMessage`

Transfer start message (DSP compliant).

##### publicOrigin

`string`

The public origin URL of this service (used to construct data plane endpoint for PULL transfers).

##### trustPayload

`unknown`

Trust payload containing authorization information (JWT, VC, etc.).

#### Returns

`Promise`\<`IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferStartMessage`\>

Transfer Start Message (DSP compliant) with dataAddress for PULL transfers, or TransferError if the operation fails.

***

### completeTransfer() {#completetransfer}

> **completeTransfer**(`message`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Complete a Transfer Process.
Transitions Transfer Process to COMPLETED state.

Role Performed: Consumer / Provider
Called by: Provider or Consumer when a Transfer process is completed on their side

DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#transfer-completion-message

#### Parameters

##### message

`IDataspaceProtocolTransferCompletionMessage`

Transfer completion message (DSP compliant).

##### trustPayload

`unknown`

Trust payload containing authorization information (JWT, VC, etc.).

#### Returns

`Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Transfer Process (DSP compliant) with state COMPLETED, or TransferError if the operation fails.

***

### suspendTransfer() {#suspendtransfer}

> **suspendTransfer**(`message`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Suspend a Transfer Process.
Transitions Transfer Process to SUSPENDED state.

Role Performed: Consumer / Provider
Called by: Provider or Consumer when a Transfer process needs to be temporarily suspended on their side

DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#transfer-suspension-message

#### Parameters

##### message

`IDataspaceProtocolTransferSuspensionMessage`

Transfer suspension message (DSP compliant) with optional reason.

##### trustPayload

`unknown`

Trust payload containing authorization information (JWT, VC, etc.).

#### Returns

`Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Transfer Process (DSP compliant) with state SUSPENDED, or TransferError if the operation fails.

***

### terminateTransfer() {#terminatetransfer}

> **terminateTransfer**(`message`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Terminate a Transfer Process.
Transitions Transfer Process to TERMINATED state.

Role Performed: Consumer / Provider
Called by: Provider or Consumer when a Transfer process needs to be terminated on their side (e.g., due to error)

DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#transfer-termination-message

#### Parameters

##### message

`IDataspaceProtocolTransferTerminationMessage`

Transfer termination message (DSP compliant) with optional reason.

##### trustPayload

`unknown`

Trust payload containing authorization information (JWT, VC, etc.).

#### Returns

`Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Transfer Process (DSP compliant) with state TERMINATED, or TransferError if the operation fails.

***

### getTransferProcess() {#gettransferprocess}

> **getTransferProcess**(`pid`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Get Transfer Process State.
Query the current state of a Transfer Process.

Role Performed: Consumer / Provider
Called by: Provider or Consumer when they need to check the status of a Transfer process on their side

Supports role-agnostic lookup using either consumerPid or providerPid.
The service will automatically detect which role the caller is acting as
(Consumer or Provider) based on the PID provided.

DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#ack-transfer-process

#### Parameters

##### pid

`string`

The Process ID (consumerPid or providerPid) used to identify the transfer.

##### trustPayload

`unknown`

Trust payload containing authorization information (JWT, VC, etc.).

#### Returns

`Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

Transfer Process (DSP compliant) with current state, or TransferError if the operation fails.
