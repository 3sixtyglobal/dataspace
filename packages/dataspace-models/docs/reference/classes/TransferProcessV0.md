# Class: TransferProcessV0

Transfer Process for shared storage between Control Plane and Data Plane, version 0.
Keyed on consumerPid; superseded by the version keyed on the internal id.

## Constructors

### Constructor

> **new TransferProcessV0**(): `TransferProcessV0`

#### Returns

`TransferProcessV0`

## Properties

### consumerPid {#consumerpid}

> **consumerPid**: `string`

The consumer PID is the primary key.
Used for direct lookup by consumerPid.

***

### id {#id}

> **id**: `string`

Internal UUID for storage (secondary key for providerPid lookup).

***

### providerPid {#providerpid}

> **providerPid**: `string`

Provider Process ID from the DSP protocol.
Indexed for lookup by providerPid.

***

### agreementId {#agreementid}

> **agreementId**: `string`

Agreement ID linking to the rights-management Agreement.

***

### state {#state}

> **state**: `DataspaceProtocolTransferProcessStateType`

Transfer Process state from the DSP protocol.
One of: REQUESTED, STARTED, COMPLETED, SUSPENDED, TERMINATED.

***

### datasetId {#datasetid}

> **datasetId**: `string`

Dataset ID for DSC resolution.

***

### offerId {#offerid}

> **offerId**: `string`

Offer ID from the original Catalog offer.

***

### consumerIdentity? {#consumeridentity}

> `optional` **consumerIdentity?**: `string`

Consumer identity (DID or URI).

***

### providerIdentity? {#provideridentity}

> `optional` **providerIdentity?**: `string`

Provider identity (DID or URI).

***

### localRole? {#localrole}

> `optional` **localRole?**: [`TransferProcessRole`](../type-aliases/TransferProcessRole.md)

This node's role in the transfer, captured at write time so state transitions and async delivery
can tell which party we are without inferring it from the matched PID (consumerPid is the primary
key on both nodes). Optional for back-compat with records written before this field existed.

***

### format? {#format}

> `optional` **format?**: `string`

Data format from the Dataset Distribution.

***

### callbackAddress? {#callbackaddress}

> `optional` **callbackAddress?**: `string`

Callback address for Consumer notifications.

***

### organizationIdentity {#organizationidentity}

> **organizationIdentity**: `string`

The organization that owns this transfer process, captured from the request context at write time.

***

### dateCreated {#datecreated}

> **dateCreated**: `string`

Creation timestamp (ISO string format).

***

### dateModified {#datemodified}

> **dateModified**: `string`

Last update timestamp (ISO string format).

***

### policies? {#policies}

> `optional` **policies?**: `IRightsManagementPolicy`[]

Policies from the Agreement (stored as JSON).

***

### dataAddress? {#dataaddress}

> `optional` **dataAddress?**: `IDataspaceProtocolDataAddress`

Data address for the transfer (stored as JSON): the consumer's inbox for PUSH, or the
provider-built address persisted at start for PULL/POST; may expire while STARTED.
