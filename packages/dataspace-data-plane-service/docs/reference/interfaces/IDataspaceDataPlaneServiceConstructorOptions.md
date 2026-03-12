# Interface: IDataspaceDataPlaneServiceConstructorOptions

Dataspace Data Plane service options

## Properties

### loggingComponentType?

> `optional` **loggingComponentType**: `string`

Logging component type.

***

### backgroundTaskComponentType?

> `optional` **backgroundTaskComponentType**: `string`

Background task component.

***

### taskSchedulerComponentType?

> `optional` **taskSchedulerComponentType**: `string`

Task Scheduler Component Type.

***

### activityLogEntityStorageType?

> `optional` **activityLogEntityStorageType**: `string`

The entity storage for activity log details.

***

### activityTaskEntityStorageType?

> `optional` **activityTaskEntityStorageType**: `string`

The entity storage for the association between Activities and Tasks.

***

### transferProcessEntityStorageType?

> `optional` **transferProcessEntityStorageType**: `string`

The entity storage type for Transfer Process entities.
Used to read Transfer Process state from shared storage.

***

### partitionContextIds?

> `optional` **partitionContextIds**: `string`[]

The keys to use from the context ids to cleanup partitions.

***

### trustComponentType?

> `optional` **trustComponentType**: `string`

Trust component type.

***

### pepComponentType?

> `optional` **pepComponentType**: `string`

Policy enforcement point component type for ODRL policy enforcement.

***

### config?

> `optional` **config**: [`IDataspaceDataPlaneServiceConfig`](IDataspaceDataPlaneServiceConfig.md)

The configuration of the Dataspace Data Plane Service.
