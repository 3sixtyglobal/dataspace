# Interface: IDataspaceDataPlaneServiceConstructorOptions

Dataspace Data Plane service options

## Properties

### loggingComponentType? {#loggingcomponenttype}

> `optional` **loggingComponentType?**: `string`

Logging component type.

#### Default

```ts
logging
```

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

### dataspaceAppDatasetEntityStorageType? {#dataspaceappdatasetentitystoragetype}

> `optional` **dataspaceAppDatasetEntityStorageType?**: `string`

The entity storage type for Dataspace App Dataset entities.

#### Default

```ts
dataspace-app-dataset
```

***

### partitionContextIds? {#partitioncontextids}

> `optional` **partitionContextIds?**: `string`[]

The keys to use from the context ids to cleanup partitions.

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

### tenantAdminType? {#tenantadmintype}

> `optional` **tenantAdminType?**: `string`

Tenant admin component type.

#### Default

```ts
tenant-admin
```

***

### urlTransformerComponentType? {#urltransformercomponenttype}

> `optional` **urlTransformerComponentType?**: `string`

URL Transformer component type used to encrypt the tenant token into the data-plane.

#### Default

```ts
url-transformer
```

***

### config? {#config}

> `optional` **config?**: [`IDataspaceDataPlaneServiceConfig`](IDataspaceDataPlaneServiceConfig.md)

The configuration of the Dataspace Data Plane Service.
