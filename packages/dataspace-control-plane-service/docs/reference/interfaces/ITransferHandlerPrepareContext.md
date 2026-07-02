# Interface: ITransferHandlerPrepareContext

Context supplied to buildConsumerDataAddress during prepareTransfer.

## Properties

### consumerPid {#consumerpid}

> **consumerPid**: `string`

The consumer process ID.

***

### origin {#origin}

> **origin**: `string`

The consumer's base origin URL.

***

### dataPlanePath {#dataplanepath}

> **dataPlanePath**: `string` \| `undefined`

The data plane path segment, if configured.

***

### organizationIdentity {#organizationidentity}

> **organizationIdentity**: `string`

The organization identity resolved from the current context.
