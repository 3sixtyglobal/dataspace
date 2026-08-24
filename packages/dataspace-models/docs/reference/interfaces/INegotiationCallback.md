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

> **onFinalized**(`negotiationId`, `agreementId`, `offerId?`): `Promise`\<`void`\>

Called when the negotiation finalizes.

#### Parameters

##### negotiationId

`string` \| `undefined`

The negotiation ID, or undefined for implicit-trust or agreement-reuse paths.

##### agreementId

`string`

The agreement ID (from agreement.uid).

##### offerId?

`string`

The offer ID that triggered the negotiation; present when negotiationId is undefined so
callers with concurrent negotiations can discriminate which finalization belongs to them.

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

***

### onTimeout()? {#ontimeout}

> `optional` **onTimeout**(`negotiationId`): `Promise`\<`void`\>

Called when the negotiation times out, i.e. the provider did not progress it within the configured
window. Optional: implement it to be notified specifically of a non-response (otherwise the
control plane falls back to `onFailed(negotiationId, "negotiationStalled")`).

#### Parameters

##### negotiationId

`string`

The negotiation ID.

#### Returns

`Promise`\<`void`\>

Nothing.
