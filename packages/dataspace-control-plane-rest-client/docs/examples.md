# Control Plane REST Client Examples

Use these snippets to initiate and manage DSP transfer processes through HTTP endpoints.

## DataspaceControlPlaneRestClient

```typescript
import { DataspaceControlPlaneRestClient } from '@twin.org/dataspace-control-plane-rest-client';

const client = new DataspaceControlPlaneRestClient({
  endpoint: 'http://localhost:8090'
});

console.log(client.className()); // DataspaceControlPlaneRestClient
```

```typescript
import { DataspaceControlPlaneRestClient } from '@twin.org/dataspace-control-plane-rest-client';
import type {
  IDataspaceProtocolTransferRequestMessage,
  IDataspaceProtocolTransferStartMessage,
  IDataspaceProtocolTransferCompletionMessage
} from '@twin.org/standards-dataspace-protocol';

const client = new DataspaceControlPlaneRestClient({ endpoint: 'http://localhost:8090' });
const trustPayload = 'eyJhbGciOi...';

declare const requestMessage: IDataspaceProtocolTransferRequestMessage;
declare const startMessage: IDataspaceProtocolTransferStartMessage;
declare const completionMessage: IDataspaceProtocolTransferCompletionMessage;

const requested = await client.requestTransfer(requestMessage, trustPayload);
const started = await client.startTransfer(startMessage, trustPayload);
const completed = await client.completeTransfer(completionMessage, trustPayload);

console.log(requested['@type']); // TransferProcess
console.log(started['@type']); // TransferStartMessage
console.log(completed['@type']); // TransferProcess
```

```typescript
import { DataspaceControlPlaneRestClient } from '@twin.org/dataspace-control-plane-rest-client';
import type {
  IDataspaceProtocolTransferSuspensionMessage,
  IDataspaceProtocolTransferTerminationMessage
} from '@twin.org/standards-dataspace-protocol';

const client = new DataspaceControlPlaneRestClient({ endpoint: 'http://localhost:8090' });
const trustPayload = 'eyJhbGciOi...';

declare const suspensionMessage: IDataspaceProtocolTransferSuspensionMessage;
declare const terminationMessage: IDataspaceProtocolTransferTerminationMessage;

const suspended = await client.suspendTransfer(suspensionMessage, trustPayload);
const terminated = await client.terminateTransfer(terminationMessage, trustPayload);

console.log(suspended['@type']); // TransferProcess
console.log(terminated['@type']); // TransferProcess
```

```typescript
import { DataspaceControlPlaneRestClient } from '@twin.org/dataspace-control-plane-rest-client';

const client = new DataspaceControlPlaneRestClient({ endpoint: 'http://localhost:8090' });
const process = await client.getTransferProcess('consumer-process-id', 'eyJhbGciOi...');

console.log(process['@type']); // TransferProcess
```
