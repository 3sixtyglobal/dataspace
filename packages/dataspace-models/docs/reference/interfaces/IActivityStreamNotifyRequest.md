# Interface: IActivityStreamNotifyRequest

Activity Stream Notify Request.

## Properties

### headers? {#headers}

> `optional` **headers?**: `object`

The headers which can be used for authentication (e.g. Bearer token for cross-node push).

#### authorization?

> `optional` **authorization?**: `string`

***

### body {#body}

> **body**: `IActivityStreamsActivity`

The Activity sent to the Stream.
