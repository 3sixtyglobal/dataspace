# Interface: ITransferProcess

Transfer Process for internal storage.
Combines DSP protocol fields with internal TWIN fields.
This is NOT the DSP wire format (use ITransferProcess from standards for that).

## Properties

### id

> **id**: `string`

Internal UUID (primary key for entity storage).

***

### consumerPid

> **consumerPid**: `string`

Consumer Process ID from the DSP protocol.
Refers to the transfer identifier on the Consumer side.

***

### providerPid

> **providerPid**: `string`

Provider Process ID from the DSP protocol.
Refers to the transfer identifier on the Provider side.

***

### state

> **state**: `DataspaceProtocolTransferProcessStateType`

Transfer Process state from the DSP protocol.
One of: REQUESTED, STARTED, COMPLETED, SUSPENDED, TERMINATED.

***

### agreementId

> **agreementId**: `string`

Agreement ID linking to the rights-management Agreement.
Used to resolve policies and permissions.

***

### datasetId

> **datasetId**: `string`

Dataset ID for DSC resolution.
Identifies the dataset being transferred.

***

### offerId

> **offerId**: `string`

Offer ID from the original Catalog offer.

***

### policies?

> `optional` **policies**: `IOdrlPolicy`[]

Policies from the Agreement.
Used by DSC for runtime policy enforcement.

***

### consumerIdentity?

> `optional` **consumerIdentity**: `string`

Consumer identity (DID or URI).
Used for auditing and access control.

***

### providerIdentity?

> `optional` **providerIdentity**: `string`

Provider identity (DID or URI).
Used for auditing.

***

### callbackAddress?

> `optional` **callbackAddress**: `string`

Callback address for Consumer notifications.
URI where messages to the Consumer should be sent.

***

### format?

> `optional` **format**: `string`

Data format from the Dataset Distribution.
Specified by a Distribution for the Dataset associated with the Agreement.

***

### dataAddress?

> `optional` **dataAddress**: `IDataspaceProtocolDataAddress`

Data address for push mode transfers.
Contains endpoint information where data should be pushed (for Activity Stream push mode).
Only present when format is Http-Push-Activity-Stream-Format or Http-Post-Activity-Stream-Format.

***

### dateCreated

> **dateCreated**: `Date`

Creation timestamp.

***

### dateModified

> **dateModified**: `Date`

Last update timestamp.
