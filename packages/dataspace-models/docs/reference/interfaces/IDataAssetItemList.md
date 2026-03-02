# Interface: IDataAssetItemList

Interface describing a list of entities that are within a Data Asset.
Pagination is handled via HTTP Link headers.

## Properties

### @context

> **@context**: `"https://schema.org"`

The LD Context.

***

### type

> **type**: `"ItemList"`

The type

***

### itemListElement

> **itemListElement**: `IJsonLdNodeObject`[]

The components of the Collection
