# Interface: IDataspaceActivity\<O, T\>

A dataspace activity that restricts an activity so that it can be handled by a Dataspace Data Plane

## Extends

- `Omit`\<`IActivityStreamsActivity`, `"object"`\>

## Type Parameters

### O

`O` *extends* `object` = `object`

### T

`T` *extends* `object` = `object`

## Properties

### object

> **object**: `ObjectOrArray`\<`JsonLdObjectWithContext`\<`O` & `object`\>\>

Activity's Object

***

### target?

> `optional` **target**: `JsonLdObjectWithContext`\<`T` & `object`\>

Activity's target

#### Overrides

`Omit.target`
