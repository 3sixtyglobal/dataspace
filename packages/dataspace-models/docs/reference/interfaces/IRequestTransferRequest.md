# Interface: IRequestTransferRequest

API request for requesting a transfer process.

## Properties

### headers

> **headers**: `object`

Authorization header containing the Base64-encoded trust payload.

#### authorization

> **authorization**: `string`

***

### body

> **body**: `IDataspaceProtocolTransferRequestMessage`

Transfer request message (DSP compliant).
