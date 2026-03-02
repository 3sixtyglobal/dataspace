# Interface: IDataspaceDataPlaneServiceConstructorOptions

Dataspace Data Plane service options

## Properties

### loggingComponentType?

> `optional` **loggingComponentType**: `string`

Logging component type.

#### Default

```ts
logging
```

***

### backgroundTaskComponentType?

> `optional` **backgroundTaskComponentType**: `string`

Background task component.

#### Default

```ts
background-task
```

***

### taskSchedulerComponentType?

> `optional` **taskSchedulerComponentType**: `string`

Task Scheduler Component Type.

#### Default

```ts
task-scheduler
```

***

### activityLogEntityStorageType?

> `optional` **activityLogEntityStorageType**: `string`

The entity storage for activity log details.

#### Default

```ts
activity-log-details
```

***

### activityTaskEntityStorageType?

> `optional` **activityTaskEntityStorageType**: `string`

The entity storage for the association between Activities and Tasks.

#### Default

```ts
activity-task
```

***

### transferProcessEntityStorageType?

> `optional` **transferProcessEntityStorageType**: `string`

The entity storage type for Transfer Process entities.
Used to read Transfer Process state from shared storage.

#### Default

```ts
transfer-process
```

***

### partitionContextIds?

> `optional` **partitionContextIds**: `string`[]

The keys to use from the context ids to cleanup partitions.

***

### trustComponentType?

> `optional` **trustComponentType**: `string`

Trust component type.

#### Default

```ts
trust
```

***

### pepComponentType?

> `optional` **pepComponentType**: `string`

Policy enforcement point component type for ODRL policy enforcement.

#### Default

```ts
policy-enforcement-point-service
```

***

### config?

> `optional` **config**: [`IDataspaceDataPlaneServiceConfig`](IDataspaceDataPlaneServiceConfig.md)

The configuration of the Dataspace Data Plane Service.
