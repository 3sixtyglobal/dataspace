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

Consumer process ID identifying the transfer. Also the primary key for this entity.

***

### providerPid {#providerpid}

> **providerPid**: `string`

Provider process ID from the DSP Transfer Process.

***

### followActivityId {#followactivityid}

> **followActivityId**: `string`

ID of the Follow activity that created this subscription.
Used by Undo to reference it on teardown.

***

### datasetId {#datasetid}

> **datasetId**: `string`

Dataset ID identifying which dataset is being delivered.

***

### tenantId? {#tenantid}

> `optional` **tenantId?**: `string`

The tenant that owns this subscription, captured from the request context at
write time. Optional - single-tenant nodes (no `TWIN_TENANT_ENABLED`) register
subscriptions without a tenant context. The encrypted tenant token is also baked
into `consumerEndpoint` so cross-node push deliveries route to the right tenant.

***

### consumerEndpoint {#consumerendpoint}

> **consumerEndpoint**: `string`

The consumer's /inbox endpoint URL where activities are POSTed.

***

### consumerAuthToken? {#consumerauthtoken}

> `optional` **consumerAuthToken?**: `string`

Pre-packaged bearer token for authenticating pushes to the consumer endpoint.
When absent a fresh JWT is generated at delivery time.

***

### paused {#paused}

> **paused**: `boolean`

When true deliveries are skipped (transfer SUSPENDED).
When false deliveries are flowing normally.

***

### dateCreated {#datecreated}

> **dateCreated**: `string`

Creation timestamp (ISO string format).

***

### dateModified {#datemodified}

> **dateModified**: `string`

Last-modified timestamp. Updated on suspend/resume (when `paused` flips) and on
any subscription mutation. Matches the codebase convention of pairing `dateCreated`
with `dateModified` on entities whose state mutates.
