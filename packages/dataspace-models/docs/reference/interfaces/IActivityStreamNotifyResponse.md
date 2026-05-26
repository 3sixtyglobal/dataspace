# Interface: IActivityStreamNotifyResponse

Activity Stream Notify Response.

## Properties

### statusCode {#statuscode}

> **statusCode**: `201` \| `202`

The status code indicating the result of the notification processing. It can be either:
- `201 Created` if the notification was processed inline and a new activity log entry was created.
- `202 Accepted` if the notification was accepted for async processing but has not been completed yet.

***

### headers? {#headers}

> `optional` **headers?**: `object`

Optional headers.

#### location?

> `optional` **location?**: `string`

***

### body? {#body}

> `optional` **body?**: [`IActivityLogEntry`](IActivityLogEntry.md)

The Activity log entry if the notification was processed inline.
