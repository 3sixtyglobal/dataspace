# Interface: IDataspaceDataPlaneServiceConstructorOptions

Dataspace Data Plane service options

## Properties

### loggingComponentType? {#loggingcomponenttype}

> `optional` **loggingComponentType?**: `string`

Logging component type.

***

### backgroundTaskComponentType? {#backgroundtaskcomponenttype}

> `optional` **backgroundTaskComponentType?**: `string`

Background task component.

#### Default

```ts
background-task
```

***

### taskSchedulerComponentType? {#taskschedulercomponenttype}

> `optional` **taskSchedulerComponentType?**: `string`

Task Scheduler Component Type.

#### Default

```ts
task-scheduler
```

***

### activityLogEntityStorageType? {#activitylogentitystoragetype}

> `optional` **activityLogEntityStorageType?**: `string`

The entity storage for activity log details.

#### Default

```ts
activity-log-details
```

***

### activityTaskEntityStorageType? {#activitytaskentitystoragetype}

> `optional` **activityTaskEntityStorageType?**: `string`

The entity storage for the association between Activities and Tasks.

#### Default

```ts
activity-task
```

***

### transferProcessEntityStorageType? {#transferprocessentitystoragetype}

> `optional` **transferProcessEntityStorageType?**: `string`

The entity storage type for Transfer Process entities.
Used to read Transfer Process state from shared storage.

#### Default

```ts
transfer-process
```

***

### pushSubscriptionEntityStorageType? {#pushsubscriptionentitystoragetype}

> `optional` **pushSubscriptionEntityStorageType?**: `string`

The entity storage type for PushSubscription entities.

#### Default

```ts
push-subscription
```

***

### transferRetrievalEntityStorageType? {#transferretrievalentitystoragetype}

> `optional` **transferRetrievalEntityStorageType?**: `string`

The entity storage type for Transfer Retrieval entities; when not registered no retrievals
are recorded. Must match the Control Plane's setting.

#### Default

```ts
transfer-retrieval
```

***

### dataspaceAppDatasetEntityStorageType? {#dataspaceappdatasetentitystoragetype}

> `optional` **dataspaceAppDatasetEntityStorageType?**: `string`

The entity storage type for Dataspace App Dataset entities.

#### Default

```ts
dataspace-app-dataset
```

***

### trustComponentType? {#trustcomponenttype}

> `optional` **trustComponentType?**: `string`

Trust component type.

#### Default

```ts
trust
```

***

### pepComponentType? {#pepcomponenttype}

> `optional` **pepComponentType?**: `string`

Policy enforcement point component type for ODRL policy enforcement.

#### Default

```ts
policy-enforcement-point-service
```

***

### platformComponentType? {#platformcomponenttype}

> `optional` **platformComponentType?**: `string`

Platform component type.

#### Default

```ts
platform
```

***

### papComponentType? {#papcomponenttype}

> `optional` **papComponentType?**: `string`

Policy administration point component type.
The data plane fetches fresh agreements from PAP at access time (with a short-TTL
in-memory cache) so that revoked or updated agreements take effect promptly.

#### Default

```ts
policy-administration-point
```

***

### telemetryComponentType? {#telemetrycomponenttype}

> `optional` **telemetryComponentType?**: `string`

The component type for the optional telemetry component used for metrics, defaults to no telemetry.

***

### config? {#config}

> `optional` **config?**: [`IDataspaceDataPlaneServiceConfig`](IDataspaceDataPlaneServiceConfig.md)

The configuration of the Dataspace Data Plane Service.
