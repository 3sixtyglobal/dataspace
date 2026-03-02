# Interface: ISuspendTransferRequest

API request for suspending a transfer process.

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

> **body**: `IDataspaceProtocolTransferSuspensionMessage`

Transfer suspension message (DSP compliant).
