# Interface: IActivityLogDetails

The details related to the processing of an Activity

## Extended by

- [`IActivityLogEntry`](IActivityLogEntry.md)

## Properties

### id {#id}

> **id**: `string`

The Id of the Activity Log entry.

***

### activityId? {#activityid}

> `optional` **activityId**: `string`

The activity Id that this entry refers to.

***

### generator {#generator}

> **generator**: `string`

The identity of the Activity's generator.

***

### dateCreated {#datecreated}

> **dateCreated**: `string`

The creation date of this object.

***

### dateModified {#datemodified}

> **dateModified**: `string`

The last update date of this object.

***

### retryCount? {#retrycount}

> `optional` **retryCount**: `number`

Number of times this activity has been retried.
