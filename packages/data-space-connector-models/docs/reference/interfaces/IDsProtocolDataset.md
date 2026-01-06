# Interface: IDsProtocolDataset

Dataset interface compliant with Eclipse Data Space Protocol.

This interface extends IDataset and enforces DS Protocol-specific requirements
by overriding properties with more specific types and constraints.

**Requirements per DS Protocol:**
- `@id` MUST be present for dataset identification (REQUIRED)
- `odrl:hasPolicy` MUST be present as an array of ODRL Offers (REQUIRED)
- Array MUST contain at least one IOdrlOffer
- Each Offer MUST have `@type`: "Offer"
- Each Offer MUST have `@id` or `uid` for identification
- `dcat:distribution` MUST be present (REQUIRED)
- Validation is enforced at runtime via `validateDatasetCompliance()`

**Type System Design:**
- W3C DCAT spec defines `odrl:hasPolicy` as optional singular `IOdrlPolicy`
- DS Protocol requires it as a REQUIRED array of `IOdrlOffer`
- Interface extension allows TypeScript to override inherited property types
- Standards packages (@twin.org/standards-w3c-*) follow W3C specs exactly
- DS Protocol-specific constraints are defined here

**Future Compatibility:**
- Currently only one Offer per dataset is supported
- Array structure allows future support for multiple offers

## See

 - https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1-err1/#lower-level-types
 - https://www.w3.org/TR/vocab-dcat-3/ - W3C DCAT v3 spec
 - IOdrlOffer from @twin.org/standards-w3c-odrl
 - IResource.odrl:hasPolicy from @twin.org/standards-w3c-dcat

## Extends

- `Omit`\<`IDcatDataset`, `"odrl:hasPolicy"` \| `"dcat:distribution"` \| `"@type"`\>

## Indexable

\[`key`: `string`\]: `string` \| `number` \| `boolean` \| `IJsonLdNodeObject` \| `IJsonLdGraphObject` \| `object` & `object` \| `object` & `object` \| `object` & `object` \| `IJsonLdListObject` \| `IJsonLdSetObject` \| `IJsonLdNodePrimitive`[] \| `IJsonLdLanguageMap` \| `IJsonLdIndexMap` \| `IJsonLdNodeObject`[] \| `IJsonLdIdMap` \| `IJsonLdTypeMap` \| `string`[] \| `IJsonLdContextDefinition` \| `IJsonLdContextDefinitionElement`[] \| `IJsonLdJsonObject` \| `IJsonLdJsonObject`[] \| \{\[`key`: `string`\]: `string`; \} \| `null` \| `undefined`

\[`key`: `number`\]: `string` \| `number` \| `boolean` \| `IJsonLdNodeObject` \| `IJsonLdGraphObject` \| `object` & `object` \| `object` & `object` \| `object` & `object` \| `IJsonLdListObject` \| `IJsonLdSetObject` \| `IJsonLdNodePrimitive`[] \| `IJsonLdLanguageMap` \| `IJsonLdIndexMap` \| `IJsonLdNodeObject`[] \| `IJsonLdIdMap` \| `IJsonLdTypeMap` \| `string`[] \| `IJsonLdContextDefinition` \| `IJsonLdContextDefinitionElement`[] \| `IJsonLdJsonObject` \| `IJsonLdJsonObject`[] \| \{\[`key`: `string`\]: `string`; \} \| `null` \| `undefined`

## Properties

### @type

> **@type**: `"Dataset"`

The type identifier for the dataset.
REQUIRED per Eclipse Data Space Protocol.

***

### @id

> **@id**: `string`

Unique identifier for the dataset.
REQUIRED per Eclipse Data Space Protocol.

***

### odrl:hasPolicy

> **odrl:hasPolicy**: `ObjectOrArray`\<`IOdrlOffer`\>

Array of ODRL policies (Offers) as required by DS Protocol.

REQUIRED per Eclipse Data Space Protocol spec.
Must contain at least one IOdrlOffer.
Currently only single offer is supported, but array structure
allows for future multi-offer support.

***

### dcat:distribution

> **dcat:distribution**: `ObjectOrArray`\<`IDcatDistribution`\>

Distribution of the dataset.
REQUIRED per Eclipse Data Space Protocol.

***

### dcterms:type

> **dcterms:type**: `string`

Entity type.
REQUIRED for TWIN Data Space Protocol Profile.
