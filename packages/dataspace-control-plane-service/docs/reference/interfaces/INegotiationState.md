# Interface: INegotiationState

Negotiation state tracked internally for callback routing.

## Properties

### negotiationId

> **negotiationId**: `string`

The negotiation ID (self-reference for lookup).

***

### state

> **state**: `DataspaceProtocolContractNegotiationStateType`

Current negotiation state.

***

### agreement?

> `optional` **agreement**: `IOdrlAgreement`

Agreement received from provider (stored until finalized).

***

### startedAt

> **startedAt**: `number`

Timestamp when negotiation started.

***

### updatedAt

> **updatedAt**: `number`

Timestamp when negotiation state was last updated.
