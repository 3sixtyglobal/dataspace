# Interface: ITransferContext

Transfer Context data structure.
Contains all information needed by DSC to execute queries.
This is NOT part of the DSP protocol - it's a TWIN internal API
used by dataspace-control-plane to resolve consumerPid to datasetId and policies.

## Properties

### consumerPid

> **consumerPid**: `string`

Consumer Process ID.

***

### providerPid

> **providerPid**: `string`

Provider Process ID.

***

### agreement

> **agreement**: `IDataspaceProtocolAgreement`

Agreement associated with this Transfer Process.
Contains permissions, obligations, and prohibitions that DSC uses for runtime policy enforcement.

***

### datasetId

> **datasetId**: `string`

Dataset ID - what the DSC needs to execute the query.
Convenience field extracted from agreement.target for quick access.

***

### offerId

> **offerId**: `string`

Offer ID.

***

### state

> **state**: `DataspaceProtocolTransferProcessStateType`

Current Transfer Process state.
DSC should only allow queries if state is STARTED.

***

### consumerIdentity?

> `optional` **consumerIdentity**: `string`

Consumer identity (for auditing).

***

### providerIdentity?

> `optional` **providerIdentity**: `string`

Provider identity (for auditing).
Extracted from Agreement's assigner field.

***

### dataAddress?

> `optional` **dataAddress**: `IDataspaceProtocolDataAddress`

Data address for push mode transfers.
Contains endpoint information where data should be pushed (for Activity Stream push mode).
Only present when format is Http-Push-Activity-Stream-Format or Http-Post-Activity-Stream-Format.
