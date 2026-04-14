# Interface: IActivityQuery

(Activity,Object,Target) query for denoting combinations to be handled by a Dataspace App.

## Properties

### activityType? {#activitytype}

> `optional` **activityType?**: `string`

FQN of the Activity type.

***

### objectType {#objecttype}

> **objectType**: `string`

FQN of the Object Type.

***

### targetType? {#targettype}

> `optional` **targetType?**: `string`

FQN of the target type.

***

### processingGroupId? {#processinggroupid}

> `optional` **processingGroupId?**: `string`

The processing group id for this query, used to determine which tasks can be processed in parallel.
