# Interface: IActivityTaskEntry

Denotes a task associated with a Dataspace App

## Properties

### taskId {#taskid}

> **taskId**: `string`

Task Id.

***

### dataspaceAppId {#dataspaceappid}

> **dataspaceAppId**: `string`

Dataspace App Id.

***

### status {#status}

> **status**: [`ActivityTaskStatus`](../type-aliases/ActivityTaskStatus.md)

Task status.

***

### processingGroupId? {#processinggroupid}

> `optional` **processingGroupId?**: `string`

Processing Group Id.

***

### startDate? {#startdate}

> `optional` **startDate?**: `string`

Task processing start timestamp

***

### endDate? {#enddate}

> `optional` **endDate?**: `string`

Task processing end timestamp

***

### result? {#result}

> `optional` **result?**: `unknown`

The result of the task processing, if completed.

***

### error? {#error}

> `optional` **error?**: `IError`

The error occurred during task processing, if any.
