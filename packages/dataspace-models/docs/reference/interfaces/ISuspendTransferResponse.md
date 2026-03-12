# Interface: ISuspendTransferResponse

API response for suspending a transfer process.

## Properties

### body {#body}

> **body**: `IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`

Transfer Process (DSP compliant) with state SUSPENDED, or error.

***

### statusCode? {#statuscode}

> `optional` **statusCode**: `HttpStatusCode`

HTTP status code for the response.
