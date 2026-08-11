# Interface: IDataspaceControlPlaneServiceConstructorOptions

Dataspace Control Plane service constructor options.

## Properties

### policyAdministrationPointComponentType? {#policyadministrationpointcomponenttype}

> `optional` **policyAdministrationPointComponentType?**: `string`

Policy Administration Point component type.
Used for Agreement lookup and validation during Transfer Process initiation.

#### Default

```ts
policy-administration-point
```

***

### policyNegotiationPointComponentType? {#policynegotiationpointcomponenttype}

> `optional` **policyNegotiationPointComponentType?**: `string`

Policy Negotiation Point component type.
Used for contract negotiation to create agreements before transfer processes.

#### Default

```ts
policy-negotiation-point
```

***

### policyNegotiationAdminPointComponentType? {#policynegotiationadminpointcomponenttype}

> `optional` **policyNegotiationAdminPointComponentType?**: `string`

Policy Negotiation Admin Point component type.
Used for querying negotiation history.

#### Default

```ts
policy-negotiation-admin-point
```

***

### federatedCatalogueComponentType? {#federatedcataloguecomponenttype}

> `optional` **federatedCatalogueComponentType?**: `string`

Federated Catalogue component type.
Used for dataset validation during Transfer Process initiation.
Validates that Agreements reference valid catalog datasets.

#### Default

```ts
federated-catalogue
```

***

### loggingComponentType? {#loggingcomponenttype}

> `optional` **loggingComponentType?**: `string`

Logging component type.

***

### trustComponentType? {#trustcomponenttype}

> `optional` **trustComponentType?**: `string`

Trust component type for trust verification.
Used to verify JWT/VC tokens and extract identity information.

#### Default

```ts
trust
```

***

### transferProcessEntityStorageType? {#transferprocessentitystoragetype}

> `optional` **transferProcessEntityStorageType?**: `string`

Entity storage type for Transfer Process entities.
Used to persist transfer state for the consumerPid flow.
Must match the Data Plane's transferProcessEntityStorageType for shared storage.

#### Default

```ts
transfer-process
```

***

### dataspaceAppDatasetEntityStorageType? {#dataspaceappdatasetentitystoragetype}

> `optional` **dataspaceAppDatasetEntityStorageType?**: `string`

Entity storage type for Dataspace App Dataset entities.

#### Default

```ts
dataspace-app-dataset
```

***

### transferRetrievalEntityStorageType? {#transferretrievalentitystoragetype}

> `optional` **transferRetrievalEntityStorageType?**: `string`

Entity storage type for Transfer Retrieval entities; when not registered the one-shot
policy is inactive. Must match the Data Plane's setting.

#### Default

```ts
transfer-retrieval
```

***

### taskSchedulerComponentType? {#taskschedulercomponenttype}

> `optional` **taskSchedulerComponentType?**: `string`

Task scheduler component type for periodic cleanup of stalled negotiations.

#### Default

```ts
task-scheduler
```

***

### dataPlaneComponentType? {#dataplanecomponenttype}

> `optional` **dataPlaneComponentType?**: `string`

Data Plane component type, used to invoke push subscription lifecycle methods.

#### Default

```ts
dataspace-data-plane
```

***

### remoteControlPlaneComponentType? {#remotecontrolplanecomponenttype}

> `optional` **remoteControlPlaneComponentType?**: `string`

Remote control plane component type used to make outbound DSP transfer requests.
Created dynamically via ComponentFactory.create() with the provider endpoint as config.

#### Default

```ts
dataspace-control-plane-rest-client
```

***

### platformComponentType? {#platformcomponenttype}

> `optional` **platformComponentType?**: `string`

Platform component type, used to retrieve public origin for constructing data plane URLs.

#### Default

```ts
platform
```

***

### telemetryComponentType? {#telemetrycomponenttype}

> `optional` **telemetryComponentType?**: `string`

The component type for the optional telemetry component used for metrics, defaults to no telemetry.

***

### config? {#config}

> `optional` **config?**: [`IDataspaceControlPlaneServiceConfig`](IDataspaceControlPlaneServiceConfig.md)

The configuration of the Dataspace Control Plane Service.
