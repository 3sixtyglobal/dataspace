# Interface: ICompleteTransferResponse

API response for completing a transfer process.

## Properties

### body

> **body**: `IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`

Transfer Process (DSP compliant) with state COMPLETED, or error.

***

### statusCode?

> `optional` **statusCode**: `HttpStatusCode`

HTTP status code for the response.
