# Interface: IDataspaceControlPlaneServiceConstructorOptions

Dataspace Control Plane service constructor options.

## Properties

### policyAdministrationPointComponentType? {#policyadministrationpointcomponenttype}

> `optional` **policyAdministrationPointComponentType**: `string`

Policy Administration Point component type.
Used for Agreement lookup and validation during Transfer Process initiation.

***

### policyNegotiationPointComponentType? {#policynegotiationpointcomponenttype}

> `optional` **policyNegotiationPointComponentType**: `string`

Policy Negotiation Point component type.
Used for contract negotiation to create agreements before transfer processes.

***

### policyNegotiationAdminPointComponentType? {#policynegotiationadminpointcomponenttype}

> `optional` **policyNegotiationAdminPointComponentType**: `string`

Policy Negotiation Admin Point component type.
Used for querying negotiation history.
Optional - if not provided, negotiation history will not be available.

***

### federatedCatalogueComponentType? {#federatedcataloguecomponenttype}

> `optional` **federatedCatalogueComponentType**: `string`

Federated Catalogue component type.
Used for dataset validation during Transfer Process initiation.
Validates that Agreements reference valid catalog datasets.

***

### loggingComponentType? {#loggingcomponenttype}

> `optional` **loggingComponentType**: `string`

Logging component type.

***

### identityComponentType? {#identitycomponenttype}

> `optional` **identityComponentType**: `string`

Identity component type (for token signing/verification).

***

### identityAuthenticationComponentType? {#identityauthenticationcomponenttype}

> `optional` **identityAuthenticationComponentType**: `string`

Identity Authentication component type (for token validation).

***

### trustComponentType? {#trustcomponenttype}

> `optional` **trustComponentType**: `string`

Trust component type for trust verification.
Used to verify JWT/VC tokens and extract identity information.

***

### transferProcessEntityStorageType? {#transferprocessentitystoragetype}

> `optional` **transferProcessEntityStorageType**: `string`

Entity storage type for Transfer Process entities.
Used to persist transfer state for the consumerPid flow.
Must match the Data Plane's transferProcessEntityStorageType for shared storage.

***

### taskSchedulerComponentType? {#taskschedulercomponenttype}

> `optional` **taskSchedulerComponentType**: `string`

Task scheduler component type for periodic cleanup of stalled negotiations.

***

### config? {#config}

> `optional` **config**: [`IDataspaceControlPlaneServiceConfig`](IDataspaceControlPlaneServiceConfig.md)

The configuration of the Dataspace Control Plane Service.
