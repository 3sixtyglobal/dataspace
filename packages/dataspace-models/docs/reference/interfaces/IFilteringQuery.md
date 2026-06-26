# Interface: IFilteringQuery

A query over a data asset that to be processed by a Dataspace Data Plane App.

## Properties

### type {#type}

> **type**: `string`

The query type.

***

### q? {#q}

> `optional` **q?**: `unknown`

The representation of the query, optional depending on the query type.

***

### jsonLdContext? {#jsonldcontext}

> `optional` **jsonLdContext?**: `IJsonLdContextDefinitionElement`[]

The JSON-LD context to be applied over the query terms.
