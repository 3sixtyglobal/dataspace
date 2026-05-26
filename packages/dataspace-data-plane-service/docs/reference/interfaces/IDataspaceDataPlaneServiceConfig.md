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

***

### pushRetryCount? {#pushretrycount}

> `optional` **pushRetryCount?**: `number`

Max HTTP retry attempts per push delivery task execution.

#### Default

```ts
3
```

***

### pushRetryBaseDelayMs? {#pushretrybasedelayms}

> `optional` **pushRetryBaseDelayMs?**: `number`

Base delay (ms) for exponential backoff between push HTTP retries.
Effective delay = baseDelayMs * 2^attempt.

#### Default

```ts
1000
```

***

### pushTimeoutMs? {#pushtimeoutms}

> `optional` **pushTimeoutMs?**: `number`

Timeout (ms) for each push delivery HTTP POST request.

#### Default

```ts
30000
```

***

### pushSubscriptionCleanupIntervalMs? {#pushsubscriptioncleanupintervalms}

> `optional` **pushSubscriptionCleanupIntervalMs?**: `number`

Interval (ms) between orphaned PushSubscription cleanup scans.

#### Default

```ts
3600000 (1 hour)
```
