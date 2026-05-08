# Interface: IAppDatasetListResponse

API response listing the app datasets owned by the calling tenant.

## Properties

### body {#body}

> **body**: `object`

The body of the response.

#### entities

> **entities**: [`IDataspaceAppDataset`](IDataspaceAppDataset.md)[]

The stored datasets.

#### cursor?

> `optional` **cursor?**: `string`

Cursor to fetch the next page if more entries exist.
