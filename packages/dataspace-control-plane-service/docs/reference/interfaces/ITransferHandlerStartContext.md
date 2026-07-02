# Interface: ITransferHandlerStartContext

Context supplied to buildProviderStartDataAddress during startTransfer (provider role).

## Properties

### entity {#entity}

> **entity**: `ITransferProcess`

The transfer process entity.

***

### publicOrigin {#publicorigin}

> **publicOrigin**: `string`

The provider's public origin URL.

***

### dataPlanePath {#dataplanepath}

> **dataPlanePath**: `string` \| `undefined`

The data plane path segment, if configured.

***

### organizationIdentity {#organizationidentity}

> **organizationIdentity**: `string`

The organization identity resolved from the current context.

***

### trustComponent {#trustcomponent}

> **trustComponent**: `ITrustComponent`

The trust component for generating access tokens.

***

### overrideTrustGeneratorType {#overridetrustgeneratortype}

> **overrideTrustGeneratorType**: `string` \| `undefined`

The override trust generator type, if configured.
