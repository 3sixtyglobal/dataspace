# Class: ActivityLogDetails

Activity Log Details.

## Constructors

### Constructor

> **new ActivityLogDetails**(): `ActivityLogDetails`

#### Returns

`ActivityLogDetails`

## Properties

### id {#id}

> **id**: `string`

The entry Id.

***

### activityId? {#activityid}

> `optional` **activityId?**: `string`

The Activity Id.

***

### generator {#generator}

> **generator**: `string`

The generator of the Activity (different than the Actor)

***

### dateCreated {#datecreated}

> **dateCreated**: `string`

The creation date.

***

### dateModified {#datemodified}

> **dateModified**: `string`

The last update date.

***

### retainUntil? {#retainuntil}

> `optional` **retainUntil?**: `number`

The timestamp of when to retain the entry until.

***

### retryCount? {#retrycount}

> `optional` **retryCount?**: `number`

Number of times this activity has been retried.
