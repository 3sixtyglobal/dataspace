# Interface: INegotiationState

Negotiation state tracked internally for callback routing.

## Properties

### negotiationId {#negotiationid}

> **negotiationId**: `string`

The negotiation ID (self-reference for lookup).

***

### state {#state}

> **state**: `DataspaceProtocolContractNegotiationStateType`

Current negotiation state.

***

### agreement? {#agreement}

> `optional` **agreement?**: `IDataspaceProtocolAgreement`

Agreement received from provider (stored until finalized).

***

### startedAt {#startedat}

> **startedAt**: `number`

Timestamp when negotiation started.

***

### updatedAt {#updatedat}

> **updatedAt**: `number`

Timestamp when negotiation state was last updated.
