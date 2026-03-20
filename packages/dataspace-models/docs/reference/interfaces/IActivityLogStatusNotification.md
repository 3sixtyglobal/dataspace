# Interface: IActivityLogStatusNotification

The status supplied to clients of the Dataspace Data Plane

## Properties

### activityLogEntryId {#activitylogentryid}

> **activityLogEntryId**: `string`

The activity log entry id.

***

### activityId? {#activityid}

> `optional` **activityId?**: `string`

The activity Id.

***

### taskProcessingStatus {#taskprocessingstatus}

> **taskProcessingStatus**: `object`

The activity processing status through the associated tasks.

#### taskId

> **taskId**: `string`

The task reported.

#### dataspaceAppId

> **dataspaceAppId**: `string`

The Dataspace App.

#### taskStatus

> **taskStatus**: `TaskStatus`

The status of the task reported. Only terminated and error are reported.
