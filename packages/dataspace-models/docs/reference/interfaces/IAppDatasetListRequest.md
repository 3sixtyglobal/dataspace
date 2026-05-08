# Interface: IAppDatasetListRequest

API request to list the app datasets owned by the calling tenant.

## Properties

### query? {#query}

> `optional` **query?**: `object`

Query parameters for paging. Always strings on the wire.

#### cursor?

> `optional` **cursor?**: `string`

Cursor returned from a previous list call to fetch the next page.

#### limit?

> `optional` **limit?**: `string`

Maximum number of entries to return (string-encoded; parsed on the server).
