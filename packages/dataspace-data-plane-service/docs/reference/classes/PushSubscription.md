# Class: PushSubscription

Persists a push subscription. One row per active push transfer.
Primary key = consumerPid (same as TransferProcess).

## Constructors

### Constructor

> **new PushSubscription**(): `PushSubscription`

#### Returns

`PushSubscription`

## Properties

### consumerPid {#consumerpid}

> **consumerPid**: `string`

***

### providerPid {#providerpid}

> **providerPid**: `string`

***

### followActivityId {#followactivityid}

> **followActivityId**: `string`

ID of the Follow activity that created this subscription.
Used by Undo to reference it on teardown.

***

### datasetId {#datasetid}

> **datasetId**: `string`

***

### tenantId? {#tenantid}

> `optional` **tenantId?**: `string`

The tenant that owns this subscription, captured from the request context at
write time. Optional — single-tenant nodes (no `TWIN_TENANT_ENABLED`) register
subscriptions without a tenant context. The encrypted tenant token is also baked
into `consumerEndpoint` so cross-node push deliveries route to the right tenant.

***

### consumerEndpoint {#consumerendpoint}

> **consumerEndpoint**: `string`

***

### consumerAuthToken? {#consumerauthtoken}

> `optional` **consumerAuthToken?**: `string`

***

### paused {#paused}

> **paused**: `boolean`

When true deliveries are skipped (transfer SUSPENDED).
When false deliveries are flowing normally.

***

### dateCreated {#datecreated}

> **dateCreated**: `string`

***

### dateModified {#datemodified}

> **dateModified**: `string`

Last-modified timestamp. Updated on suspend/resume (when `paused` flips) and on
any subscription mutation. Matches the codebase convention of pairing `dateCreated`
with `dateModified` on entities whose state mutates.
