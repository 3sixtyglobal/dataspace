# Interface: IActivityStreamNotifyResponse

Activity Stream Notify Response.

## Properties

### statusCode {#statuscode}

> **statusCode**: `201` \| `202` \| `422` \| `500`

The status code indicating the result of the notification processing. It can be either:
- `201 Created` if the notification was processed inline and a new activity log entry was created.
- `202 Accepted` if the notification was accepted for async processing but has not been completed yet.
- `422 Unprocessable Entity` if inline processing failed due to a semantic problem in the Activity.
- `500 Internal Server Error` if inline processing failed due to a server-side processing error.

***

### headers? {#headers}

> `optional` **headers?**: `object`

Optional headers.

#### location?

> `optional` **location?**: `string`

***

### body? {#body}

> `optional` **body?**: [`IActivityLogEntryWithError`](IActivityLogEntryWithError.md)

The Activity log entry if the notification was processed inline.
For 422/500 responses, also includes a top-level `error` field per IETF RFC 9457.
