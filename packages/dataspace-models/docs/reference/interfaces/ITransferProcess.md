# Interface: ITransferProcess

Transfer Process for internal storage.
Combines DSP protocol fields with internal TWIN fields.
This is NOT the DSP wire format (use ITransferProcess from standards for that).

## Properties

### id {#id}

> **id**: `string`

Internal UUID (primary key for entity storage).

***

### consumerPid {#consumerpid}

> **consumerPid**: `string`

Consumer Process ID from the DSP protocol.
Refers to the transfer identifier on the Consumer side.

***

### providerPid {#providerpid}

> **providerPid**: `string`

Provider Process ID from the DSP protocol.
Refers to the transfer identifier on the Provider side.

***

### state {#state}

> **state**: `DataspaceProtocolTransferProcessStateType`

Transfer Process state from the DSP protocol.
One of: REQUESTED, STARTED, COMPLETED, SUSPENDED, TERMINATED.

***

### agreementId {#agreementid}

> **agreementId**: `string`

Agreement ID linking to the rights-management Agreement.
Used to resolve policies and permissions.

***

### datasetId {#datasetid}

> **datasetId**: `string`

Dataset ID for DSC resolution.
Identifies the dataset being transferred.

***

### offerId {#offerid}

> **offerId**: `string`

Offer ID from the original Catalog offer.

***

### policies? {#policies}

> `optional` **policies?**: `IRightsManagementPolicy`[]

Policies from the Agreement.
Used by DSC for runtime policy enforcement.

***

### consumerIdentity? {#consumeridentity}

> `optional` **consumerIdentity?**: `string`

Consumer identity (DID or URI).
Used for auditing and access control.

***

### providerIdentity? {#provideridentity}

> `optional` **providerIdentity?**: `string`

Provider identity (DID or URI).
Used for auditing.

***

### localRole? {#localrole}

> `optional` **localRole?**: [`TransferProcessRole`](../type-aliases/TransferProcessRole.md)

This node's role in the transfer, captured at write time so state transitions and async delivery
can tell which party we are without inferring it from the matched PID. Optional for back-compat.

***

### callbackAddress? {#callbackaddress}

> `optional` **callbackAddress?**: `string`

Callback address for Consumer notifications.
URI where messages to the Consumer should be sent.

***

### organizationIdentity {#organizationidentity}

> **organizationIdentity**: `string`

The organization that owns this transfer process, captured at write time so async
delivery tasks and delayed state transitions can re-enter the right organization context.

***

### format? {#format}

> `optional` **format?**: `string`

Data format from the Dataset Distribution.
Specified by a Distribution for the Dataset associated with the Agreement.

***

### dataAddress? {#dataaddress}

> `optional` **dataAddress?**: `IDataspaceProtocolDataAddress`

Data address for consumer-initiated push transfers (HttpData-PUSH).
Contains the consumer's /inbox endpoint as supplied in the TransferRequestMessage.
Absent for PULL (HttpData-PULL) and provider-initiated push (HttpData-POST),
where the consumer deliberately omits a dataAddress.

***

### dateCreated {#datecreated}

> **dateCreated**: `Date`

Creation timestamp.

***

### dateModified {#datemodified}

> **dateModified**: `Date`

Last update timestamp.
