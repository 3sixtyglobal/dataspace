# Interface: IDataAssetItemList

Interface describing a list of entities that are within a Data Asset.
Pagination is handled via HTTP Link headers.

## Properties

### @context {#context}

> **@context**: `"https://schema.org"`

The LD Context.

***

### type {#type}

> **type**: `"ItemList"`

The type

***

### itemListElement {#itemlistelement}

> **itemListElement**: `IJsonLdNodeObject`[]

The components of the Collection
