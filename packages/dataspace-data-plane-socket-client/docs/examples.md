# Data Plane Socket Client Examples

Use these snippets to consume activity updates over sockets and manage local subscription callbacks.

## DataspaceDataPlaneSocketClient

```typescript
import { DataspaceDataPlaneSocketClient } from '@twin.org/dataspace-data-plane-socket-client';

const client = new DataspaceDataPlaneSocketClient({
  config: {
    endpoint: 'ws://localhost:8090'
  },
  loggingComponentType: 'logging'
});

console.log(client.className()); // DataspaceDataPlaneSocketClient
```

```typescript
import { DataspaceDataPlaneSocketClient } from '@twin.org/dataspace-data-plane-socket-client';

const client = new DataspaceDataPlaneSocketClient({
  config: {
    endpoint: 'ws://localhost:8090'
  }
});

const subscriptionId = await client.subscribeToActivityLog(async notification => {
  console.log(notification.id); // urn:activity-log:2001
  console.log(notification.status); // completed
});

await client.unSubscribeToActivityLog(subscriptionId);
```

```typescript
import { DataspaceDataPlaneRestClient } from '@twin.org/dataspace-data-plane-rest-client';

const client = new DataspaceDataPlaneRestClient({ endpoint: 'http://localhost:8090' });
const trustPayload = 'eyJhbGciOi...';

const logEntry = await client.getActivityLogEntry('urn:activity-log:2001', trustPayload);
console.log(logEntry.id); // urn:activity-log:2001
console.log(logEntry.status); // completed
```

```typescript
import { DataspaceDataPlaneSocketClient } from '@twin.org/dataspace-data-plane-socket-client';

const client = new DataspaceDataPlaneSocketClient({
  config: {
    endpoint: 'ws://localhost:8090'
  }
});

try {
  await client.getDataAssetEntities(
    { entityType: 'https://vocabulary.uncefact.org/Consignment' },
    'consumer-process-id',
    undefined,
    10,
    'eyJhbGciOi...'
  );
} catch (error) {
  console.log(error instanceof Error); // true
}

try {
  await client.queryDataAsset('consumer-process-id', { query: {} }, undefined, 10, 'eyJhbGciOi...');
} catch (error) {
  console.log(error instanceof Error); // true
}
```

```typescript
import { DataspaceDataPlaneSocketClient } from '@twin.org/dataspace-data-plane-socket-client';
import type { IActivityStreamsActivity } from '@twin.org/standards-w3c-activity-streams';

const client = new DataspaceDataPlaneSocketClient({
  config: {
    endpoint: 'ws://localhost:8090'
  }
});

const activity: IActivityStreamsActivity = {
  '@context': 'https://www.w3.org/ns/activitystreams',
  id: 'urn:activity:2001',
  type: 'Create'
};

try {
  await client.notifyActivity(activity);
} catch (error) {
  console.log(error instanceof Error); // true
}
```
