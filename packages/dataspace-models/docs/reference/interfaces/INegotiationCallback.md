# Interface: INegotiationCallback

Callback interface for negotiation state change notifications.
Upstream modules register an implementation of this interface
via IDataspaceControlPlaneComponent.registerNegotiationCallback()
to be notified when PNP callbacks fire.

## Methods

### onStateChanged() {#onstatechanged}

> **onStateChanged**(`negotiationId`, `state`, `data?`): `Promise`\<`void`\>

Called when the negotiation state changes (offer received, agreement received).

#### Parameters

##### negotiationId

`string`

The negotiation ID.

##### state

`DataspaceProtocolContractNegotiationStateType`

The new state.

##### data?

Optional data associated with the state change.

###### offer?

`IDataspaceProtocolOffer`

The offer received from the provider.

###### agreement?

`IDataspaceProtocolAgreement`

The agreement received from the provider.

#### Returns

`Promise`\<`void`\>

Nothing.

***

### onFinalized() {#onfinalized}

> **onFinalized**(`negotiationId`, `agreementId`): `Promise`\<`void`\>

Called when the negotiation finalizes.

#### Parameters

##### negotiationId

`string` \| `undefined`

The negotiation ID, or undefined for implicit-trust agreements.

##### agreementId

`string`

The agreement ID (from agreement.uid).

#### Returns

`Promise`\<`void`\>

Nothing.

***

### onFailed() {#onfailed}

> **onFailed**(`negotiationId`, `reason`): `Promise`\<`void`\>

Called when the negotiation fails (terminated or stalled).

#### Parameters

##### negotiationId

`string`

The negotiation ID.

##### reason

`string`

The failure reason.

#### Returns

`Promise`\<`void`\>

Nothing.
