# Interface: IStartTransferResponse

API response for starting a transfer process.

## Properties

### body

> **body**: `IDataspaceProtocolTransferError` \| `IDataspaceProtocolTransferStartMessage`

Transfer Start Message (DSP compliant) with dataAddress for PULL transfers, or error.

***

### statusCode?

> `optional` **statusCode**: `HttpStatusCode`

HTTP status code for the response.
