# Interface: IDataAssetItemListResult

Result containing the data asset item list and optional pagination cursor.
The cursor is returned via HTTP Link headers (RFC 8288), not in the response body.

## Properties

### itemList {#itemlist}

> **itemList**: [`IDataAssetItemList`](IDataAssetItemList.md)

The item list data.

***

### cursor? {#cursor}

> `optional` **cursor**: `string`

Pagination cursor for retrieving the next page.
This is used to generate the Link header, not included in the response body.
