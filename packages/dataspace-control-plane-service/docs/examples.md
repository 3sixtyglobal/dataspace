# Control Plane Service Examples

Use these snippets to negotiate agreements, manage transfer lifecycle, and resolve process identifiers in service components.

## DataspaceControlPlaneService

```typescript
import { DataspaceControlPlaneService } from '@twin.org/dataspace-control-plane-service';

const service = new DataspaceControlPlaneService({
  loggingComponentType: 'logging',
  trustComponentType: 'trust',
  config: {
    dataPlanePath: 'dataspace-data-plane'
  }
});

console.log(service.className()); // DataspaceControlPlaneService
```

```typescript
import { DataspaceControlPlaneService } from '@twin.org/dataspace-control-plane-service';

const service = new DataspaceControlPlaneService();

service.registerNegotiationCallback('supply-chain', {
  onStateChanged: async (negotiationId, state) => {
    console.log(negotiationId); // urn:negotiation:001
    console.log(state); // OFFERED
  },
  onCompleted: async (negotiationId, agreementId) => {
    console.log(negotiationId); // urn:negotiation:001
    console.log(agreementId); // urn:agreement:001
  },
  onFailed: async (negotiationId, reason) => {
    console.log(negotiationId); // urn:negotiation:001
    console.log(reason); // negotiationTerminatedByProvider
  }
});

await service.start();
await service.stop();
service.unregisterNegotiationCallback('supply-chain');
```

```typescript
import { DataspaceControlPlaneService } from '@twin.org/dataspace-control-plane-service';
import type {
  IDataspaceProtocolAgreement,
  IDataspaceProtocolTransferRequestMessage,
  IDataspaceProtocolTransferStartMessage,
  IDataspaceProtocolTransferCompletionMessage,
  IDataspaceProtocolTransferSuspensionMessage,
  IDataspaceProtocolTransferTerminationMessage
} from '@twin.org/standards-dataspace-protocol';

const service = new DataspaceControlPlaneService();
const trustPayload = 'eyJhbGciOi...';

declare const agreement: IDataspaceProtocolAgreement;
declare const requestMessage: IDataspaceProtocolTransferRequestMessage;
declare const startMessage: IDataspaceProtocolTransferStartMessage;
declare const completionMessage: IDataspaceProtocolTransferCompletionMessage;
declare const suspensionMessage: IDataspaceProtocolTransferSuspensionMessage;
declare const terminationMessage: IDataspaceProtocolTransferTerminationMessage;

const requested = await service.requestTransfer(requestMessage, trustPayload);
const started = await service.startTransfer(startMessage, trustPayload);
const completed = await service.completeTransfer(completionMessage, trustPayload);
const suspended = await service.suspendTransfer(suspensionMessage, trustPayload);
const terminated = await service.terminateTransfer(terminationMessage, trustPayload);

const negotiationId = await service.negotiateAgreement(
  agreement,
  'https://provider.example',
  trustPayload
);
const negotiation = await service.getNegotiation(negotiationId, trustPayload);
const history = await service.getNegotiationHistory(negotiationId, trustPayload);

console.log(requested['@type']); // TransferProcess
console.log(started['@type']); // TransferStartMessage
console.log(completed['@type']); // TransferProcess
console.log(suspended['@type']); // TransferProcess
console.log(terminated['@type']); // TransferProcess
console.log(negotiation['@id']); // urn:negotiation:001
console.log(history.length); // 3
```

```typescript
import { DataspaceControlPlaneService } from '@twin.org/dataspace-control-plane-service';

const service = new DataspaceControlPlaneService();

const transfer = await service.getTransferProcess('consumer-process-id', 'eyJhbGciOi...');
const consumerPid = await service.resolveConsumerPid('provider-process-id');
const providerPid = await service.resolveProviderPid('consumer-process-id');

console.log(transfer['@type']); // TransferProcess
console.log(consumerPid); // consumer-process-id
console.log(providerPid); // provider-process-id
```

## DataspaceControlPlanePolicyRequester

```typescript
import { DataspaceControlPlanePolicyRequester } from '@twin.org/dataspace-control-plane-service';
import type {
  IDataspaceProtocolAgreement,
  IDataspaceProtocolOffer
} from '@twin.org/standards-dataspace-protocol';

const requester = new DataspaceControlPlanePolicyRequester('logging', {
  onStateChanged: async (negotiationId, state) => {
    console.log(negotiationId); // urn:negotiation:001
    console.log(state); // OFFERED
  },
  onCompleted: async (negotiationId, agreementId) => {
    console.log(negotiationId); // urn:negotiation:001
    console.log(agreementId); // urn:agreement:001
  },
  onFailed: async (negotiationId, reason) => {
    console.log(negotiationId); // urn:negotiation:001
    console.log(reason); // negotiationTerminatedByProvider
  }
});

console.log(requester.className()); // DataspaceControlPlanePolicyRequester

requester.trackNegotiation('urn:negotiation:001');
const active = requester.getActiveNegotiations();
console.log(active.size); // 1

declare const offer: IDataspaceProtocolOffer;
declare const agreement: IDataspaceProtocolAgreement;

await requester.offer('urn:negotiation:001', offer);
await requester.agreement('urn:negotiation:001', agreement);
await requester.finalised('urn:negotiation:001');

requester.trackNegotiation('urn:negotiation:002');
await requester.terminated('urn:negotiation:002');
requester.removeNegotiation('urn:negotiation:002');
```
