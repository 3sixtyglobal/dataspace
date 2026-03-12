# Interface: ITerminateTransferRequest

API request for terminating a transfer process.

## Properties

### pathParams {#pathparams}

> **pathParams**: `object`

Path parameters containing the process ID.

#### pid

> **pid**: `string`

Process ID (consumerPid).

***

### headers {#headers}

> **headers**: `object`

Authorization header containing the Base64-encoded trust payload.

#### authorization

> **authorization**: `string`

***

### body {#body}

> **body**: `IDataspaceProtocolTransferTerminationMessage`

Transfer termination message (DSP compliant).
