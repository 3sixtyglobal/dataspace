# Variable: DataspaceTransferFormat

> `const` **DataspaceTransferFormat**: `object`

TWIN transfer format identifiers used in TransferRequestMessage.format.
Follows the Eclipse EDC canonical pattern: <DestinationType-FlowType>.
See RFC-007 Data Transfer Profile.

## Type Declaration

### HttpProxyPull {#httpproxypull}

> `readonly` **HttpProxyPull**: `"HttpProxy-PULL"` = `"HttpProxy-PULL"`

PULL mode: consumer queries data via a bearer-token-protected endpoint.
Data flows: Consumer GET provider endpoint (with token).

### HttpProxyPush {#httpproxypush}

> `readonly` **HttpProxyPush**: `"HttpProxy-PUSH"` = `"HttpProxy-PUSH"`

Consumer-initiated PUSH mode: consumer supplies their /inbox endpoint in the
TransferRequestMessage. Provider pushes ActivityStreams objects to that endpoint.
Data flows: Provider POST to consumer's /inbox.

### HttpProxyPost {#httpproxypost}

> `readonly` **HttpProxyPost**: `"HttpProxy-POST"` = `"HttpProxy-POST"`

Provider-initiated PUSH mode (inverted flow): consumer supplies no dataAddress.
Provider returns its own /inbox URL + signed JWT. Consumer then posts data there.
Data flows: Consumer POST to provider's /inbox.
