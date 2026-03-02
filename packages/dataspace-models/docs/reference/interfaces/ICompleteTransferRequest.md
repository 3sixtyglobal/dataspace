# Interface: ICompleteTransferRequest

API request for completing a transfer process.

## Properties

### pathParams

> **pathParams**: `object`

Path parameters containing the process ID.

#### pid

> **pid**: `string`

Process ID (consumerPid).

***

### headers

> **headers**: `object`

Authorization header containing the Base64-encoded trust payload.

#### authorization

> **authorization**: `string`

***

### body

> **body**: `IDataspaceProtocolTransferCompletionMessage`

Transfer completion message (DSP compliant).
