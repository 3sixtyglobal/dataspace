# Interface: IPushDeliveryPayload

Payload handed to pushDeliveryRunner via a Background Task.
Contains everything the runner needs to POST one Activity Streams
object to a consumer's /inbox without touching entity storage.

## Properties

### consumerPid {#consumerpid}

> **consumerPid**: `string`

The consumer process ID identifying the transfer.

***

### providerPid {#providerpid}

> **providerPid**: `string`

The provider process ID identifying the transfer.

***

### generatorPid {#generatorpid}

> **generatorPid**: `string`

PID to set as Activity.generator. Always equals providerPid since
processOutboxActivity is only invoked for consumer-initiated push,
where the provider is the data sender.

***

### consumerEndpoint {#consumerendpoint}

> **consumerEndpoint**: `string`

The consumer's inbox endpoint URL to POST the activity to.

***

### consumerAuthToken? {#consumerauthtoken}

> `optional` **consumerAuthToken?**: `string`

Optional Bearer token for authenticating the push request.

***

### agreement {#agreement}

> **agreement**: `IRightsManagementAgreement`

The ODRL agreement governing the data transfer.

***

### data {#data}

> **data**: `IJsonLdNodeObject`

The JSON-LD data payload to deliver to the consumer.

***

### entityType {#entitytype}

> **entityType**: `string`

The JSON-LD

***

### tenantId? {#tenantid}

> `optional` **tenantId?**: `string`

The tenant that owns this push delivery, captured at schedule time from the active
`ContextIdStore` context (typically from the subscription's `tenantId` field).
The runner re-establishes this tenant context via `ContextIdStore.run` before invoking
tenant-scoped operations (PEP, trust signing, vault lookups). Optional — single-tenant
nodes operate without a tenant context.

***

### pushTimeoutMs? {#pushtimeoutms}

> `optional` **pushTimeoutMs?**: `number`

Timeout (ms) for the push delivery HTTP POST. Packaged at schedule time from service config.

#### Default

```ts
30000
```

***

### pushRetryCount? {#pushretrycount}

> `optional` **pushRetryCount?**: `number`

Max HTTP retry attempts for this delivery. Packaged at schedule time from service config.

#### Default

```ts
3
```

***

### pushRetryBaseDelayMs? {#pushretrybasedelayms}

> `optional` **pushRetryBaseDelayMs?**: `number`

Base retry delay (ms) for this delivery. Packaged at schedule time from service config.

#### Default

```ts
1000
```
