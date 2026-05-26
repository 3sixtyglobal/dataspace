# Interface: IFollowActivity

ActivityPub Follow activity used by the DS Connector to subscribe
an app to a data source. The app treats this as "start producing
data for this consumer."

generator = consumerPid (URN) of the follower
actor     = DID of the follower's organization
object    = TransferProcess reference, optionally with a filter expressed as JSON-LD

## Extends

- `IActivityStreamsActivity`

## Properties

### type {#type}

> **type**: `"Follow"`

The activity type, always "Follow".

#### Overrides

`IActivityStreamsActivity.type`

***

### generator {#generator}

> **generator**: `string`

The consumerPid URN identifying the follower's transfer process.

#### Overrides

`IActivityStreamsActivity.generator`

***

### actor {#actor}

> **actor**: `string`

The DID of the follower's organization.

#### Overrides

`IActivityStreamsActivity.actor`

***

### object {#object}

> **object**: `string` \| `IJsonLdNodeObject`

The TransferProcess reference, optionally with a filter expressed as JSON-LD.

#### Overrides

`IActivityStreamsActivity.object`
