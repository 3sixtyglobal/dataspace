# Interface: IDataspaceDataPlaneServiceConfig

Dataspace Data Plane service configuration

## Properties

### retainActivityLogsFor? {#retainactivitylogsfor}

> `optional` **retainActivityLogsFor?**: `number`

The amount of time in minutes to retain activity log entries until removal, set to -1 to keep forever.

#### Default

```ts
10
```

***

### activityLogsCleanUpInterval? {#activitylogscleanupinterval}

> `optional` **activityLogsCleanUpInterval?**: `number`

The interval in minutes in between activity log clean ups. -1 indicates no clean up shall be done.

#### Default

```ts
60 minutes
```

***

### retryCount? {#retrycount}

> `optional` **retryCount?**: `number`

The number of times to retry failed tasks, defaults to forever.

#### Default

```ts
undefined.
```
