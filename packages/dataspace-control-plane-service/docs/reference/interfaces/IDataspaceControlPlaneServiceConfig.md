# Interface: IDataspaceControlPlaneServiceConfig

Dataspace Control Plane service configuration.

## Properties

### overrideTrustGeneratorType? {#overridetrustgeneratortype}

> `optional` **overrideTrustGeneratorType?**: `string`

Override the default trust generator type for token generation.
If not specified, the default trust generator configured in the trust component will be used.

***

### dataPlanePath? {#dataplanepath}

> `optional` **dataPlanePath?**: `string`

Base route path for the data plane service (path only, not full URL).
Combined with the public origin to form the `dataAddress.endpoint` sent to PULL consumers
and the inbox URL sent to PUSH providers.

This must be the mount-point prefix of the data plane routes, NOT a specific route path.
Do NOT append sub-paths such as `/entities` or `/inbox` - those are appended automatically
by each transfer handler and by the data plane REST client.

REQUIRED if PULL or PUSH transfers are supported.
If not specified, PULL and PUSH transfers will not be available.

Example: "dataspace"

***

### callbackPath? {#callbackpath}

> `optional` **callbackPath?**: `string`

Control plane callback mount path (path only). Combined with this node's public origin to form the
consumer callbackAddress a provider POSTs DSP transfer messages back to (e.g.
`<origin>/<callbackPath>/transfers/:pid/start`), with `?organization=` appended for tenant routing.

Example: "dataspace" or "api/dataspace".

***

### autoStartTransfers? {#autostarttransfers}

> `optional` **autoStartTransfers?**: `boolean`

Whether the provider immediately starts a transfer once it has been requested. This is a
provider-side decision only; the consumer cannot request or influence auto-start. When false
(the default) the transfer stays in REQUESTED until the provider explicitly calls transferStarted.

Defaults to false.

***

### stalledNegotiationTimeoutMs? {#stallednegotiationtimeoutms}

> `optional` **stalledNegotiationTimeoutMs?**: `number`

How long (ms) a negotiation may sit without progress before the periodic cleanup treats it as
timed out, removes it, and notifies the registered callbacks (onTimeout, falling back to
onFailed with reason "negotiationStalled"). Requires a task-scheduler component to be configured.

Defaults to 1800000 (30 minutes).

***

### stalledTransferTimeoutMs? {#stalledtransfertimeoutms}

> `optional` **stalledTransferTimeoutMs?**: `number`

How long (ms) a consumer-initiated transfer may sit in REQUESTED without the provider progressing
it before the periodic cleanup treats it as timed out, removes it, and notifies the registered
transfer callbacks (onTimeout, falling back to onFailed with reason "transferStalled"). Requires a
task-scheduler component to be configured.

Defaults to 1800000 (30 minutes).

***

### providerTransferIdleTimeoutMs? {#providertransferidletimeoutms}

> `optional` **providerTransferIdleTimeoutMs?**: `number`

Idle window (ms) for Provider-side STARTED PULL transfers: when there has been no data-plane
activity (last state change or last successful retrieval) within the window, the policy sweep
terminates the transfer with code "idleTimeout". Overridable per app dataset via its
transferIdleTimeoutMs (0 disables it for that dataset). Requires a task-scheduler component.
Unset (the default) disables the policy node-wide.

***

### providerTransferPolicySweepIntervalMs? {#providertransferpolicysweepintervalms}

> `optional` **providerTransferPolicySweepIntervalMs?**: `number`

Interval (ms) for the provider transfer policy sweep, rounded to whole minutes (minimum one).
Defaults to 300000 (5 minutes).
