# Interface: ITransferContext

Transfer Context data structure.
Contains all information needed by DSC to execute queries.
This is NOT part of the DSP protocol - it's a TWIN internal API
used by dataspace-control-plane to resolve consumerPid to datasetId and policies.

## Properties

### consumerPid {#consumerpid}

> **consumerPid**: `string`

Consumer Process ID.

***

### providerPid {#providerpid}

> **providerPid**: `string`

Provider Process ID.

***

### agreement {#agreement}

> **agreement**: `IRightsManagementAgreement`

Agreement associated with this Transfer Process.
Contains permissions, obligations, and prohibitions that DSC uses for runtime policy enforcement.

***

### datasetId {#datasetid}

> **datasetId**: `string`

Dataset ID - what the DSC needs to execute the query.
Convenience field extracted from agreement.target for quick access.

***

### offerId {#offerid}

> **offerId**: `string`

Offer ID.

***

### state {#state}

> **state**: `DataspaceProtocolTransferProcessStateType`

Current Transfer Process state.
DSC should only allow queries if state is STARTED.

***

### consumerIdentity? {#consumeridentity}

> `optional` **consumerIdentity?**: `string`

Consumer identity (for auditing).

***

### providerIdentity? {#provideridentity}

> `optional` **providerIdentity?**: `string`

Provider identity (for auditing).
Extracted from Agreement's assigner field.

***

### dataAddress? {#dataaddress}

> `optional` **dataAddress?**: `IDataspaceProtocolDataAddress`

Data address for consumer-initiated push transfers (HttpData-PUSH).
Contains the consumer's /inbox endpoint as supplied in the TransferRequestMessage.
Absent for PULL (HttpData-PULL) and provider-initiated push (HttpData-POST),
where the consumer deliberately omits a dataAddress.
