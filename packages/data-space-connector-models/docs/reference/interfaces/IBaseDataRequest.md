# Interface: IBaseDataRequest

Base Data Request interface to represent a data request to a Data Space Connector App

## Properties

### type

> **type**: `string`

Type of Data Request.

***

### dataAsset

> **dataAsset**: `IDcatDataset`

The data asset we are referring to.

***

### cursor?

> `optional` **cursor**: `string`

Cursor that points to the next item in the result set.

***

### limit?

> `optional` **limit**: `number`

Maximum number of entries retrieved or to be retrieved.
