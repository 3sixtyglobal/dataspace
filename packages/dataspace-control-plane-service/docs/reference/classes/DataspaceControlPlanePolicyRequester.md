# Class: DataspaceControlPlanePolicyRequester

Policy Requester for Dataspace Control Plane.

Handles contract negotiation callbacks from PNP and forwards state changes
to the control plane service via the INegotiationCallback interface.

Callback Flow:
1. Control Plane initiates negotiation via PNP.sendRequestToProvider()
2. PNP calls offer() → auto-accept, notify control plane
3. PNP calls agreement() → store agreement, notify control plane
4. PNP calls finalised() → notify control plane with agreementId
5. Control plane notifies upstream caller (e.g. supply-chain)

## Implements

- `IPolicyRequester`

## Constructors

### Constructor

> **new DataspaceControlPlanePolicyRequester**(`loggingComponentType?`, `callback?`): `DataspaceControlPlanePolicyRequester`

Create a new instance of DataspaceControlPlanePolicyRequester.

#### Parameters

##### loggingComponentType?

`string`

Optional logging component type.

##### callback?

`INegotiationCallback`

Optional callback interface for state change notifications.

#### Returns

`DataspaceControlPlanePolicyRequester`

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

`IPolicyRequester.className`

***

### trackNegotiation() {#tracknegotiation}

> **trackNegotiation**(`negotiationId`): `void`

Register a negotiation for tracking.
Called by the control plane service after initiating a negotiation via PNP.

#### Parameters

##### negotiationId

`string`

The negotiation ID returned by PNP.sendRequestToProvider().

#### Returns

`void`

***

### getActiveNegotiations() {#getactivenegotiations}

> **getActiveNegotiations**(): `Map`\<`string`, [`INegotiationState`](../interfaces/INegotiationState.md)\>

Get all active negotiations (for stalled cleanup).

#### Returns

`Map`\<`string`, [`INegotiationState`](../interfaces/INegotiationState.md)\>

Map of negotiationId to negotiation state.

***

### removeNegotiation() {#removenegotiation}

> **removeNegotiation**(`negotiationId`): `void`

Remove a negotiation from tracking (for cleanup).

#### Parameters

##### negotiationId

`string`

The negotiation ID to remove.

#### Returns

`void`

***

### offer() {#offer}

> **offer**(`negotiationId`, `offer`): `Promise`\<`boolean`\>

A policy has been offered by a provider.
Called by PNP when provider sends an OfferMessage.

#### Parameters

##### negotiationId

`string`

The id of the negotiation.

##### offer

`IDataspaceProtocolOffer`

The offer sent by the provider.

#### Returns

`Promise`\<`boolean`\>

True if the offer was accepted, false otherwise.

#### Implementation of

`IPolicyRequester.offer`

***

### agreement() {#agreement}

> **agreement**(`negotiationId`, `agreement`): `Promise`\<`boolean`\>

A policy agreement has been sent by a provider.
Called by PNP when provider sends an AgreementMessage.

#### Parameters

##### negotiationId

`string`

The id of the negotiation.

##### agreement

`IDataspaceProtocolAgreement`

The agreement sent by the provider.

#### Returns

`Promise`\<`boolean`\>

True if the agreement was accepted, false otherwise.

#### Implementation of

`IPolicyRequester.agreement`

***

### finalised() {#finalised}

> **finalised**(`negotiationId`): `Promise`\<`void`\>

A policy finalisation has been sent by a provider.
Called by PNP when provider sends a FinalizedEvent.

#### Parameters

##### negotiationId

`string`

The id of the negotiation.

#### Returns

`Promise`\<`void`\>

A promise that resolves when all finalisation callbacks have been notified.

#### Implementation of

`IPolicyRequester.finalised`

***

### terminated() {#terminated}

> **terminated**(`negotiationId`): `Promise`\<`void`\>

A policy termination has been sent by a provider.
Called by PNP when provider sends a TerminatedMessage or negotiation fails.

#### Parameters

##### negotiationId

`string`

The id of the negotiation.

#### Returns

`Promise`\<`void`\>

A promise that resolves when all termination callbacks have been notified.

#### Implementation of

`IPolicyRequester.terminated`
