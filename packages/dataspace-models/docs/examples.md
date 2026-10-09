# Models Examples

Use these snippets to register dataspace data types and shape transfer process records for shared persistence.

## DataspaceDataTypes

```typescript
import { DataspaceDataTypes } from '@3sixty/dataspace-models';

DataspaceDataTypes.registerTypes();
console.log('registered'); // registered
```

## TransferProcess

```typescript
import { TransferProcess } from '@3sixty/dataspace-models';

const process = new TransferProcess();
process.id = 'tp-001';
process.consumerPid = 'consumer-process-id';
process.providerPid = 'provider-process-id';
process.agreementId = 'urn:agreement:001';
process.datasetId = 'https://twin.example.org/data-service-1';
process.offerId = 'urn:policy:test-offer-read-consignment';
process.state = 'REQUESTED';
process.dateCreated = new Date().toISOString();
process.dateModified = process.dateCreated;
process.callbackAddress = 'https://consumer.example/dsp/callback';

console.log(process.consumerPid); // consumer-process-id
console.log(process.state); // REQUESTED
```
