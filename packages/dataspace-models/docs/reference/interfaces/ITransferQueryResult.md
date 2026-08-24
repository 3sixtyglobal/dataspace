# Interface: ITransferQueryResult

Result of querying Transfer Processes by agreement.

## Properties

### transfers {#transfers}

> **transfers**: [`ITransferProcess`](ITransferProcess.md)[]

The transfer processes matching the query, empty when none match.

***

### cursor? {#cursor}

> `optional` **cursor?**: `string`

Pagination cursor for retrieving the next page, omitted when no more results exist.
