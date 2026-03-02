# Interface: IDataspaceControlPlaneServiceConstructorOptions

Dataspace Control Plane service constructor options.

## Properties

### policyAdministrationPointComponentType?

> `optional` **policyAdministrationPointComponentType**: `string`

Policy Administration Point component type.
Used for Agreement lookup and validation during Transfer Process initiation.

#### Default

```ts
policy-administration-point
```

***

### policyNegotiationPointComponentType?

> `optional` **policyNegotiationPointComponentType**: `string`

Policy Negotiation Point component type.
Used for contract negotiation to create agreements before transfer processes.

#### Default

```ts
policy-negotiation-point
```

***

### policyNegotiationAdminPointComponentType?

> `optional` **policyNegotiationAdminPointComponentType**: `string`

Policy Negotiation Admin Point component type.
Used for querying negotiation history.
Optional - if not provided, negotiation history will not be available.

#### Default

```ts
policy-negotiation-admin-point
```

***

### federatedCatalogueComponentType?

> `optional` **federatedCatalogueComponentType**: `string`

Federated Catalogue component type.
Used for dataset validation during Transfer Process initiation.
Validates that Agreements reference valid catalog datasets.

#### Default

```ts
federated-catalogue
```

***

### loggingComponentType?

> `optional` **loggingComponentType**: `string`

Logging component type.

#### Default

```ts
logging
```

***

### identityComponentType?

> `optional` **identityComponentType**: `string`

Identity component type (for token signing/verification).

#### Default

```ts
identity
```

***

### identityAuthenticationComponentType?

> `optional` **identityAuthenticationComponentType**: `string`

Identity Authentication component type (for token validation).

#### Default

```ts
identity-authentication
```

***

### trustComponentType?

> `optional` **trustComponentType**: `string`

Trust component type for trust verification.
Used to verify JWT/VC tokens and extract identity information.

#### Default

```ts
trust
```

***

### transferProcessEntityStorageType?

> `optional` **transferProcessEntityStorageType**: `string`

Entity storage type for Transfer Process entities.
Used to persist transfer state for the consumerPid flow.
Must match the Data Plane's transferProcessEntityStorageType for shared storage.

#### Default

```ts
transfer-process
```

***

### taskSchedulerComponentType?

> `optional` **taskSchedulerComponentType**: `string`

Task scheduler component type for periodic cleanup of stalled negotiations.

#### Default

```ts
task-scheduler
```

***

### config?

> `optional` **config**: [`IDataspaceControlPlaneServiceConfig`](IDataspaceControlPlaneServiceConfig.md)

The configuration of the Dataspace Control Plane Service.
