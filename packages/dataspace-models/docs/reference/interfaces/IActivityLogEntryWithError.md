# Interface: IActivityLogEntryWithError

Activity log entry extended with a top-level RFC 9457 error field.
Returned as the response body for 422/500 inline-processing failures.

## Extends

- [`IActivityLogEntry`](IActivityLogEntry.md)

## Properties

### id {#id}

> **id**: `string`

The Id of the Activity Log entry.

#### Inherited from

[`IActivityLogEntry`](IActivityLogEntry.md).[`id`](IActivityLogEntry.md#id)

***

### activityId? {#activityid}

> `optional` **activityId?**: `string`

The activity Id that this entry refers to.

#### Inherited from

[`IActivityLogEntry`](IActivityLogEntry.md).[`activityId`](IActivityLogEntry.md#activityid)

***

### generator {#generator}

> **generator**: `string`

The identity of the Activity's generator.

#### Inherited from

[`IActivityLogEntry`](IActivityLogEntry.md).[`generator`](IActivityLogEntry.md#generator)

***

### dateCreated {#datecreated}

> **dateCreated**: `string`

The creation date of this object.

#### Inherited from

[`IActivityLogEntry`](IActivityLogEntry.md).[`dateCreated`](IActivityLogEntry.md#datecreated)

***

### dateModified {#datemodified}

> **dateModified**: `string`

The last update date of this object.

#### Inherited from

[`IActivityLogEntry`](IActivityLogEntry.md).[`dateModified`](IActivityLogEntry.md#datemodified)

***

### status {#status}

> **status**: [`ActivityProcessingStatus`](../type-aliases/ActivityProcessingStatus.md)

Status of the Activity Processing.

#### Inherited from

[`IActivityLogEntry`](IActivityLogEntry.md).[`status`](IActivityLogEntry.md#status)

***

### tasks? {#tasks}

> `optional` **tasks?**: [`IActivityTaskEntry`](IActivityTaskEntry.md)[]

The tasks that have to be run to process the Activity.

#### Inherited from

[`IActivityLogEntry`](IActivityLogEntry.md).[`tasks`](IActivityLogEntry.md#tasks)

***

### error? {#error}

> `optional` **error?**: `IError`

Top-level RFC 9457-formatted error describing the processing failure.
Present only for 422 and 500 responses.
