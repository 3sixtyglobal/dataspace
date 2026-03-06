# Class: TransferProcess

Transfer Process for shared storage between Control Plane and Data Plane.
This entity is the persistent representation of ITransferProcess.

## Constructors

### Constructor

> **new TransferProcess**(): `TransferProcess`

#### Returns

`TransferProcess`

## Properties

### consumerPid

> **consumerPid**: `string`

The consumer PID is the primary key.
Used for direct lookup by consumerPid.

***

### id

> **id**: `string`

Internal UUID for storage (secondary key for providerPid lookup).

***

### providerPid

> **providerPid**: `string`

Provider Process ID from the DSP protocol.
Indexed for lookup by providerPid.

***

### agreementId

> **agreementId**: `string`

Agreement ID linking to the rights-management Agreement.

***

### state

> **state**: `DataspaceProtocolTransferProcessStateType`

Transfer Process state from the DSP protocol.
One of: REQUESTED, STARTED, COMPLETED, SUSPENDED, TERMINATED.

***

### datasetId

> **datasetId**: `string`

Dataset ID for DSC resolution.

***

### offerId

> **offerId**: `string`

Offer ID from the original Catalog offer.

***

### consumerIdentity?

> `optional` **consumerIdentity**: `string`

Consumer identity (DID or URI).

***

### providerIdentity?

> `optional` **providerIdentity**: `string`

Provider identity (DID or URI).

***

### format?

> `optional` **format**: `string`

Data format from the Dataset Distribution.

***

### callbackAddress?

> `optional` **callbackAddress**: `string`

Callback address for Consumer notifications.

***

### dateCreated

> **dateCreated**: `string`

Creation timestamp (ISO string format).

***

### dateModified

> **dateModified**: `string`

Last update timestamp (ISO string format).

***

### policies?

> `optional` **policies**: `IDataspaceProtocolPolicy`[]

Policies from the Agreement (stored as JSON).

***

### dataAddress?

> `optional` **dataAddress**: `IDataspaceProtocolDataAddress`

Data address for push mode transfers (stored as JSON).
