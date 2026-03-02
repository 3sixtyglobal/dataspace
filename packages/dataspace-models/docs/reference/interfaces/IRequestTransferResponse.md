# Interface: IRequestTransferResponse

API response for requesting a transfer process.

## Properties

### body

> **body**: `IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`

Transfer Process (DSP compliant) with state REQUESTED, or error.

***

### statusCode?

> `optional` **statusCode**: `HttpStatusCode`

HTTP status code for the response.
