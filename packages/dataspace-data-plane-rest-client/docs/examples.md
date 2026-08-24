# Data Plane REST Client Examples

Use these snippets to query entities, run filtered lookups, and inspect activity processing records over HTTP.

## DataspaceDataPlaneRestClient

```typescript
import { DataspaceDataPlaneRestClient } from '@twin.org/dataspace-data-plane-rest-client';

const client = new DataspaceDataPlaneRestClient({ endpoint: 'http://localhost:8090' });

console.log(client.className()); // DataspaceDataPlaneRestClient
```

```typescript
import { DataspaceDataPlaneRestClient } from '@twin.org/dataspace-data-plane-rest-client';
import type { IEntitySet, IFilteringQuery } from '@twin.org/dataspace-models';

const client = new DataspaceDataPlaneRestClient({ endpoint: 'http://localhost:8090' });
const trustPayload = 'eyJhbGciOi...';

const entitySet: IEntitySet = {
  entityType: 'https://vocabulary.uncefact.org/Consignment',
  entityId: ['urn:ucr:24PLP051219453I002610799053311']
};

const entitiesResult = await client.getDataAssetEntities(
  entitySet,
  'consumer-process-id',
  undefined,
  50,
  trustPayload
);
console.log(entitiesResult.itemList.length); // 1
console.log(entitiesResult.cursor ?? ''); // next-cursor-token

const query: IFilteringQuery = {
  query: {
    destinationCountry: {
      equals: 'unece:CountryId#GB'
    }
  }
};

const queryResult = await client.queryDataAsset(
  'consumer-process-id',
  query,
  undefined,
  25,
  trustPayload
);
console.log(queryResult.itemList.length); // 1
console.log(queryResult.cursor ?? ''); // next-cursor-token
```

```typescript
import { DataspaceDataPlaneRestClient } from '@twin.org/dataspace-data-plane-rest-client';
import type { IActivityStreamsActivity } from '@twin.org/standards-w3c-activity-streams';

const client = new DataspaceDataPlaneRestClient({ endpoint: 'http://localhost:8090' });

const activity: IActivityStreamsActivity = {
  '@context': 'https://www.w3.org/ns/activitystreams',
  id: 'urn:activity:0001',
  type: 'Create',
  actor: 'did:web:consumer.example',
  object: 'urn:ucr:24PLP051219453I002610799053311'
};

const trustPayload = 'eyJhbGciOi...';

const logEntryId = await client.notifyActivity(activity, trustPayload);
const logEntry = await client.getActivityLogEntry(logEntryId, trustPayload);

console.log(logEntry.id); // urn:activity-log:0001
console.log(logEntry.status); // completed
```

```typescript
import { DataspaceDataPlaneRestClient } from '@twin.org/dataspace-data-plane-rest-client';

const client = new DataspaceDataPlaneRestClient({ endpoint: 'http://localhost:8090' });

try {
  await client.subscribeToActivityLog(async () => Promise.resolve());
} catch (error) {
  console.log(error instanceof Error); // true
}
```
