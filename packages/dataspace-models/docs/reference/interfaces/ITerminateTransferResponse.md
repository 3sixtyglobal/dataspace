# Interface: ITerminateTransferResponse

API response for terminating a transfer process.

## Properties

### body {#body}

> **body**: `IDataspaceProtocolTransferProcess` \| `IDataspaceProtocolTransferError`

Transfer Process (DSP compliant) with state TERMINATED, or error.

***

### statusCode? {#statuscode}

> `optional` **statusCode?**: `HttpStatusCode`

HTTP status code for the response.
