# Interface: IGetTransferProcessRequest

API request for getting a transfer process state.

## Properties

### pathParams {#pathparams}

> **pathParams**: `object`

Path parameters containing the process ID.

#### pid

> **pid**: `string`

Process ID (consumerPid or providerPid).

***

### headers {#headers}

> **headers**: `object`

Authorization header containing the Base64-encoded trust payload.

#### authorization

> **authorization**: `string`
