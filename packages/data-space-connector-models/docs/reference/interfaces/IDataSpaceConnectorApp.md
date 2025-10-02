# Interface: IDataSpaceConnectorApp

Interface describes a Data Space Connector App.

## Extends

- `IComponent`

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
