# Class: TransferRetrieval

Records the consumer's first successful retrieval for a transfer.
Written by the Data Plane, read by the Control Plane's one-shot policy sweep.

## Constructors

### Constructor

> **new TransferRetrieval**(): `TransferRetrieval`

#### Returns

`TransferRetrieval`

## Properties

### consumerPid {#consumerpid}

> **consumerPid**: `string`

The consumer PID of the transfer, primary key.

***

### dateFirstRetrieved {#datefirstretrieved}

> **dateFirstRetrieved**: `string`

When the first successful retrieval happened (ISO string format).

***

### dateLastRetrieved {#datelastretrieved}

> **dateLastRetrieved**: `string`

When the most recent successful retrieval happened (ISO string format).
