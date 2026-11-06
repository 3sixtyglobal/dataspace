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

### dataPlanePath? {#dataplanepath}

> `optional` **dataPlanePath?**: `string`

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

### overrideTrustGeneratorType? {#overridetrustgeneratortype}

> `optional` **overrideTrustGeneratorType?**: `string`

The override trust generator type, if configured.
