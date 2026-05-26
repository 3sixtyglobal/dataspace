# Interface: IUndoActivity

ActivityPub Undo activity used by the DS Connector to unsubscribe
an app from a data source. The object MUST reference the `@id` of
a previously issued Follow activity.

## Extends

- `IActivityStreamsActivity`

## Properties

### type {#type}

> **type**: `"Undo"`

The activity type, always "Undo".

#### Overrides

`IActivityStreamsActivity.type`

***

### generator {#generator}

> **generator**: `string`

The consumerPid URN identifying the transfer process being unsubscribed.

#### Overrides

`IActivityStreamsActivity.generator`

***

### actor {#actor}

> **actor**: `string`

The DID of the unsubscribing organization.

#### Overrides

`IActivityStreamsActivity.actor`

***

### object {#object}

> **object**: `string`

The `@id` of the Follow activity being undone.

#### Overrides

`IActivityStreamsActivity.object`
