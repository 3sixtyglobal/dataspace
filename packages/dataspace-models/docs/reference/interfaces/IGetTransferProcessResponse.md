# Interface: IGetTransferProcessResponse

API response for getting a transfer process state.

## Properties

### body

> **body**: `IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`

Transfer Process (DSP compliant) with current state, or error.

***

### statusCode?

> `optional` **statusCode**: `HttpStatusCode`

HTTP status code for the response.
