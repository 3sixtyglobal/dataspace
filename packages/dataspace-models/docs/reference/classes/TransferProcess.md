# Class: TransferProcess

Transfer Process for shared storage between Control Plane and Data Plane.
This entity is the persistent representation of ITransferProcess.

## Constructors

### Constructor

> **new TransferProcess**(): `TransferProcess`

#### Returns

`TransferProcess`

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

> `optional` **consumerIdentity**: `string`

Consumer identity (DID or URI).

***

### providerIdentity? {#provideridentity}

> `optional` **providerIdentity**: `string`

Provider identity (DID or URI).

***

### format? {#format}

> `optional` **format**: `string`

Data format from the Dataset Distribution.

***

### callbackAddress? {#callbackaddress}

> `optional` **callbackAddress**: `string`

Callback address for Consumer notifications.

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

> `optional` **policies**: `IDataspaceProtocolPolicy`[]

Policies from the Agreement (stored as JSON).

***

### dataAddress? {#dataaddress}

> `optional` **dataAddress**: `IDataspaceProtocolDataAddress`

Data address for push mode transfers (stored as JSON).
