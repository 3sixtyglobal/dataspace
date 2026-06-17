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

The REST client does not support this method and throws a not supported error —
use ComponentFactory.get() for the in-process service.

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

`string` \| `undefined`

Optional filter by negotiation state (e.g., "FINALIZED", "TERMINATED").

##### cursor

`string` \| `undefined`

Optional pagination cursor for fetching next page.

##### trustPayload

`unknown`

Trust payload for authentication.

#### Returns

`Promise`\<\{ `negotiations`: `object`[]; `cursor?`: `string`; `count`: `number`; \}\>

List of negotiation history entries with pagination cursor.

***

### registerTransferCallback() {#registertransfercallback}

> **registerTransferCallback**(`key`, `callback`): `void`

Register a callback to receive transfer process state change notifications.
Upstream modules register their callback here to be notified when a
consumer-initiated transfer changes state (STARTED, COMPLETED, SUSPENDED,
TERMINATED).

The REST client does not support this method and throws a not supported error —
use ComponentFactory.get() for the in-process service.

#### Parameters

##### key

`string`

A unique key identifying this callback registration.

##### callback

[`ITransferCallback`](ITransferCallback.md)

The callback interface to register.

#### Returns

`void`

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

***

### prepareTransfer() {#preparetransfer}

> **prepareTransfer**(`agreementId`, `providerEndpoint`, `publicOrigin`, `format`, `trustPayload`): `Promise`\<\{ `consumerPid`: `string`; \}\>

Prepare a data transfer as a Consumer.
High-level convenience wrapper around the DSP Transfer Request protocol.

This method:
1. Generates a consumerPid.
2. POSTs a TransferRequestMessage to the provider's DSP endpoint.
3. Persists a local TransferProcess in REQUESTED state (only if provider accepts).
4. Returns the consumerPid immediately.

The caller is notified of subsequent state changes (STARTED, COMPLETED, etc.)
via the registered ITransferCallback. The transfer moves to STARTED when the
provider POSTs a TransferStartMessage back to this node's callback address.

The REST client does not support this method and throws a not supported error —
use ComponentFactory.get() for the in-process service.

#### Parameters

##### agreementId

`string`

The finalized agreement ID (from contract negotiation).

##### providerEndpoint

`string`

The provider's DSP control plane base URL.

##### publicOrigin

`string`

The public origin URL of this control plane (used as callbackAddress).

##### format

`string`

The transfer format (e.g. "HttpData-PULL", "HttpData-PUSH").

##### trustPayload

`unknown`

Trust payload for authentication.

#### Returns

`Promise`\<\{ `consumerPid`: `string`; \}\>

The consumerPid of the newly created TransferProcess.

***

### requestTransfer() {#requesttransfer}

> **requestTransfer**(`request`, `publicOrigin`, `options`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`\>

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

##### publicOrigin

`string`

The public origin of this provider node (resolved server-side by the REST route
from the hosting component); used to build the data-plane endpoint when auto-starting.

##### options

\{ `autoStart?`: `boolean`; \} \| `undefined`

Request options.

###### Type Literal

\{ `autoStart?`: `boolean`; \}

Request options.

###### autoStart?

`boolean`

When true, the provider immediately starts the requested transfer; when
omitted/false the provider start must be triggered explicitly.

***

`undefined`

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

> **startTransfer**(`message`, `publicOrigin`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferStartMessage` \| `IDataspaceProtocolTransferError`\>

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

`Promise`\<`IDataspaceProtocolTransferStartMessage` \| `IDataspaceProtocolTransferError`\>

Transfer Start Message (DSP compliant) with dataAddress for PULL transfers, or TransferError if the operation fails.

***

### transferStarted() {#transferstarted}

> **transferStarted**(`pid`, `publicOrigin`, `trustPayload`): `Promise`\<`IDataspaceProtocolTransferStartMessage` \| `IDataspaceProtocolTransferError`\>

Start a Transfer Process as the Provider.
Implements DSP Transfer Process Protocol.

Builds a DSP TransferStartMessage for a transfer this node already accepted (created in
REQUESTED state by requestTransfer, or in SUSPENDED state to resume), transitions it to
STARTED, and POSTs the message to the consumer's callback address. Use this when the
transfer was requested with autoStart=false and the provider now wants to start (or
resume) it explicitly.

DSP Spec: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/#transfer-start-message

#### Parameters

##### pid

`string`

The Process ID (consumerPid or providerPid) identifying the transfer to start.

##### publicOrigin

`string`

The public origin URL of this provider node (used to construct the data plane endpoint for PULL transfers).

##### trustPayload

`unknown`

Trust payload proving the caller is the provider (JWT, VC, etc.).

#### Returns

`Promise`\<`IDataspaceProtocolTransferStartMessage` \| `IDataspaceProtocolTransferError`\>

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

***

### createAppDataset() {#createappdataset}

> **createAppDataset**(`id`, `appId`, `dataset`): `Promise`\<`string`\>

Register an app dataset for a dataspace app, owned by the calling tenant.

#### Parameters

##### id

`string` \| `undefined`

Optional explicit id. If omitted, derived from `dataset["@id"]`
or generated.

##### appId

`string`

The dataspace app this dataset belongs to (matches
`DataspaceAppFactory` registration name).

##### dataset

`IDataspaceProtocolDataset`

The dataset payload (may omit system-stamped fields).

#### Returns

`Promise`\<`string`\>

The resolved dataset id.

***

### getAppDataset() {#getappdataset}

> **getAppDataset**(`id`): `Promise`\<[`IDataspaceAppDataset`](IDataspaceAppDataset.md)\>

Get an app dataset record owned by the calling tenant.

#### Parameters

##### id

`string`

The stored app dataset id.

#### Returns

`Promise`\<[`IDataspaceAppDataset`](IDataspaceAppDataset.md)\>

The stored app dataset record.

***

### listAppDatasets() {#listappdatasets}

> **listAppDatasets**(`cursor?`, `limit?`): `Promise`\<\{ `entities`: [`IDataspaceAppDataset`](IDataspaceAppDataset.md)[]; `cursor?`: `string`; \}\>

List the app datasets owned by the calling tenant.

#### Parameters

##### cursor?

`string`

Optional pagination cursor.

##### limit?

`number`

Optional maximum number of entries to return.

#### Returns

`Promise`\<\{ `entities`: [`IDataspaceAppDataset`](IDataspaceAppDataset.md)[]; `cursor?`: `string`; \}\>

The stored app datasets and the next-page cursor if more exist.

***

### updateAppDataset() {#updateappdataset}

> **updateAppDataset**(`id`, `appId`, `dataset`): `Promise`\<`void`\>

Update an app dataset record owned by the calling tenant.

#### Parameters

##### id

`string`

The stored app dataset id.

##### appId

`string`

The dataspace app this dataset belongs to.

##### dataset

`IDataspaceProtocolDataset`

The dataset payload.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the dataset has been updated in storage and the catalogue.

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

A promise that resolves when the dataset has been removed from storage and the catalogue.
