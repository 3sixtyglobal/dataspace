# Interface: ITestAppConstructorOptions

Test App Constructor options.

## Properties

### loggingComponentType? {#loggingcomponenttype}

> `optional` **loggingComponentType?**: `string`

Logging component type.

#### Default

```ts
logging
```

***

### consignments? {#consignments}

> `optional` **consignments?**: `IJsonLdDocument`[]

List of consignment documents to serve.
Can be loaded from a JSON file via the `@json:` env var syntax.
Falls back to built-in default consignments if not provided.
