# Interface: IDataSpaceConnectorApp

Interface describes a Data Space Connector App.

## Extends

- `IComponent`

## Indexable

\[`key`: `string`\]: `any`

All methods are optional, so we introduce an index signature to allow
any additional properties or methods, which removes the TypeScript error where
the class has no properties in common with the type.

## Methods

### activitiesHandled()

> **activitiesHandled**(): [`IActivityQuery`](IActivityQuery.md)[]

The activities handled by the App.

#### Returns

[`IActivityQuery`](IActivityQuery.md)[]

The activities handled by the App.

***

### handleActivity()

> **handleActivity**\<`T`\>(`activity`): `Promise`\<`T`\>

Handles an Activity and report about results through the Data Space Connector Callback

#### Type Parameters

##### T

`T`

#### Parameters

##### activity

`IActivity`

The Activity to be handled

#### Returns

`Promise`\<`T`\>

The result of executing the Activity.
