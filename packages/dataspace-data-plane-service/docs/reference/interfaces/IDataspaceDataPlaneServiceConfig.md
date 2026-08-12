# Interface: IDataspaceDataPlaneServiceConfig

Dataspace Data Plane service configuration

## Properties

### retainActivityLogsForMs? {#retainactivitylogsforms}

> `optional` **retainActivityLogsForMs?**: `number`

The amount of time in ms to retain activity log entries until removal, set to -1 to keep forever.

#### Default

```ts
600000
```

***

### activityLogsCleanUpIntervalMs? {#activitylogscleanupintervalms}

> `optional` **activityLogsCleanUpIntervalMs?**: `number`

The interval in ms between activity log clean ups. -1 indicates no clean up shall be done.

#### Default

```ts
3600000
```

***

### retryCount? {#retrycount}

> `optional` **retryCount?**: `number`

The number of times to retry failed tasks, defaults to no retries.

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

***

### agreementCacheTtlMs? {#agreementcachettlms}

> `optional` **agreementCacheTtlMs?**: `number`

TTL in ms for the in-memory PAP agreement cache.
Applies only when a PAP component is registered.

#### Default

```ts
30000 (30 seconds)
```

***

### agreementCacheMutexTimeoutMs? {#agreementcachemutextimeoutms}

> `optional` **agreementCacheMutexTimeoutMs?**: `number`

Maximum time in ms to wait for the agreement cache mutex during a getOrSet call.

#### Default

```ts
undefined (LruCache default)
```
