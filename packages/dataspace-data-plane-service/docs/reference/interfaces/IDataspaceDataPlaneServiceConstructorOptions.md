# Interface: IDataspaceDataPlaneServiceConstructorOptions

Dataspace Data Plane service options

## Properties

### loggingComponentType? {#loggingcomponenttype}

> `optional` **loggingComponentType**: `string`

Logging component type.

***

### backgroundTaskComponentType? {#backgroundtaskcomponenttype}

> `optional` **backgroundTaskComponentType**: `string`

Background task component.

***

### taskSchedulerComponentType? {#taskschedulercomponenttype}

> `optional` **taskSchedulerComponentType**: `string`

Task Scheduler Component Type.

***

### activityLogEntityStorageType? {#activitylogentitystoragetype}

> `optional` **activityLogEntityStorageType**: `string`

The entity storage for activity log details.

***

### activityTaskEntityStorageType? {#activitytaskentitystoragetype}

> `optional` **activityTaskEntityStorageType**: `string`

The entity storage for the association between Activities and Tasks.

***

### transferProcessEntityStorageType? {#transferprocessentitystoragetype}

> `optional` **transferProcessEntityStorageType**: `string`

The entity storage type for Transfer Process entities.
Used to read Transfer Process state from shared storage.

***

### partitionContextIds? {#partitioncontextids}

> `optional` **partitionContextIds**: `string`[]

The keys to use from the context ids to cleanup partitions.

***

### trustComponentType? {#trustcomponenttype}

> `optional` **trustComponentType**: `string`

Trust component type.

***

### pepComponentType? {#pepcomponenttype}

> `optional` **pepComponentType**: `string`

Policy enforcement point component type for ODRL policy enforcement.

***

### config? {#config}

> `optional` **config**: [`IDataspaceDataPlaneServiceConfig`](IDataspaceDataPlaneServiceConfig.md)

The configuration of the Dataspace Data Plane Service.
