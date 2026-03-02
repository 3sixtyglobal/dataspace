# Function: generateRestRoutesDataspaceControlPlane()

> **generateRestRoutesDataspaceControlPlane**(`baseRouteName`, `componentName`): `IRestRoute`\<`any`, `any`\>[]

The REST routes for dataspace control plane (DSP Protocol only).
These routes implement the Eclipse Dataspace Protocol Transfer Process Protocol.

Contract Negotiation is handled internally via PNP callbacks — no REST endpoints needed.
PNP registers its own inbound callback routes for negotiation messages from providers.

## Parameters

### baseRouteName

`string`

Prefix to prepend to the paths.

### componentName

`string`

The name of the component to use in the routes stored in the ComponentFactory.

## Returns

`IRestRoute`\<`any`, `any`\>[]

The generated DSP protocol routes.
