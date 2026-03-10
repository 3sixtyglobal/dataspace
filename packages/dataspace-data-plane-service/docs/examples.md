# Data Plane Service Examples

Use these snippets to process activities, expose data assets, and model activity storage records.

## DataspaceDataPlaneService

```typescript
import { DataspaceDataPlaneService } from '@twin.org/dataspace-data-plane-service';

const service = new DataspaceDataPlaneService({
  loggingComponentType: 'logging',
  trustComponentType: 'trust',
  config: {
    retainActivityLogsFor: 30,
    activityLogsCleanUpInterval: 15
  }
});

console.log(service.className()); // DataspaceDataPlaneService
await service.start();
```

```typescript
import { DataspaceDataPlaneService } from '@twin.org/dataspace-data-plane-service';
import type { IActivityStreamsActivity } from '@twin.org/standards-w3c-activity-streams';

const service = new DataspaceDataPlaneService();

const activity: IActivityStreamsActivity = {
  '@context': 'https://www.w3.org/ns/activitystreams',
  id: 'urn:activity:1001',
  type: 'Create',
  actor: 'did:web:consumer.example',
  object: 'urn:ucr:24PLP051219453I002610799053311'
};

const logEntryId = await service.notifyActivity(activity);
console.log(logEntryId); // urn:activity-log:1001

const subscriptionId = await service.subscribeToActivityLog(async notification => {
  console.log(notification.id); // urn:activity-log:1001
  console.log(notification.status); // completed
});

const logEntry = await service.getActivityLogEntry(logEntryId);
console.log(logEntry.id); // urn:activity-log:1001
console.log(logEntry.status); // completed

await service.unSubscribeToActivityLog(subscriptionId);
```

```typescript
import { DataspaceDataPlaneService } from '@twin.org/dataspace-data-plane-service';
import type { IEntitySet, IFilteringQuery } from '@twin.org/dataspace-models';

const service = new DataspaceDataPlaneService();

const entitySet: IEntitySet = {
  entityType: 'https://vocabulary.uncefact.org/Consignment',
  entityId: ['urn:ucr:24PLP051219453I002610799053311']
};

const entities = await service.getDataAssetEntities(
  entitySet,
  'consumer-process-id',
  undefined,
  10,
  'eyJhbGciOi...'
);
console.log(entities.itemList.length); // 1

const query: IFilteringQuery = {
  query: {
    destinationCountry: {
      equals: 'unece:CountryId#GB'
    }
  }
};

const filtered = await service.queryDataAsset(
  'consumer-process-id',
  query,
  undefined,
  10,
  'eyJhbGciOi...'
);
console.log(filtered.itemList.length); // 1
```

```typescript
import { DataspaceDataPlaneService } from '@twin.org/dataspace-data-plane-service';

const service = new DataspaceDataPlaneService();
const valid = await service.validateTransfer('consumer-process-id', 'eyJhbGciOi...');

console.log(valid); // true
```

## ActivityLogDetails

```typescript
import { ActivityLogDetails } from '@twin.org/dataspace-data-plane-service';

const details = new ActivityLogDetails();
details.id = 'urn:activity-log:1001';
details.activityId = 'urn:activity:1001';
details.generator = 'https://consumer.example/apps/consignment';
details.dateCreated = new Date().toISOString();
details.dateModified = details.dateCreated;
details.retryCount = 0;

console.log(details.id); // urn:activity-log:1001
```

## ActivityTask

```typescript
import { ActivityTask } from '@twin.org/dataspace-data-plane-service';

const activityTask = new ActivityTask();
activityTask.activityLogEntryId = 'urn:activity-log:1001';
activityTask.associatedTasks = [
  {
    id: 'task-1',
    type: 'activity-processing'
  }
];

console.log(activityTask.associatedTasks.length); // 1
```
