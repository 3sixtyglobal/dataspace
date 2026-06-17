# Interface: IRequestTransferRequest

API request for requesting a transfer process.

## Properties

### headers {#headers}

> **headers**: `object`

Authorization header containing the Base64-encoded trust payload.

#### authorization

> **authorization**: `string`

***

### query? {#query}

> `optional` **query?**: `object`

The query parameters of the request.

#### autoStart?

> `optional` **autoStart?**: `string`

When "true", the provider immediately starts the requested transfer once it has been created.

***

### body {#body}

> **body**: `IDataspaceProtocolTransferRequestMessage`

Transfer request message (DSP compliant).
