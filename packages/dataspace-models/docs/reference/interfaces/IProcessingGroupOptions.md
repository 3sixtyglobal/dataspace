# Interface: IProcessingGroupOptions

Interface describes the options for a processing group, which determines how many tasks can be processed in parallel for a given group of activities.

## Properties

### concurrentTasks? {#concurrenttasks}

> `optional` **concurrentTasks?**: `number`

The number of concurrent tasks that can be processed for this processing group.

***

### idleShutdownTimeout? {#idleshutdowntimeout}

> `optional` **idleShutdownTimeout?**: `number`

Terminate the worker after it has been idle for the specified timeout in milliseconds,
defaults to 0 for immediate shutdown, set to -1 to keep workers alive.

***

### retryCount? {#retrycount}

> `optional` **retryCount?**: `number`

The number of times a task in this processing group should be retried in case of failure.
