# Interface: IDataspaceControlPlaneServiceConfig

Dataspace Control Plane service configuration.

## Properties

### overrideTrustGeneratorType?

> `optional` **overrideTrustGeneratorType**: `string`

Override the default trust generator type for token generation.
If not specified, the default trust generator configured in the trust component will be used.

***

### dataPlanePath?

> `optional` **dataPlanePath**: `string`

Data plane endpoint path for PULL transfers (path only, not full URL).
Will be combined with the public origin from the hosting component.

REQUIRED if PULL transfers are supported.
If not specified, PULL transfers will not be available.

Example: "data-plane/data" or "api/data-plane/data"
