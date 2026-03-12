# Interface: IDataspaceDataPlaneServiceConfig

Dataspace Data Plane service configuration

## Properties

### retainActivityLogsFor?

> `optional` **retainActivityLogsFor**: `number`

The amount of time in minutes to retain activity log entries until removal, set to -1 to keep forever.

***

### activityLogsCleanUpInterval?

> `optional` **activityLogsCleanUpInterval**: `number`

The interval in minutes in between activity log clean ups. -1 indicates no clean up shall be done.
