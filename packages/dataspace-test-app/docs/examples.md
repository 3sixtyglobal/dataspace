# Test App Examples

Use these snippets to prototype datasets, activity handling, and query responses in an application implementation.

## TestDataspaceDataPlaneApp

```typescript
import { TestDataspaceDataPlaneApp } from '@twin.org/dataspace-test-app';

const app = new TestDataspaceDataPlaneApp({ loggingComponentType: 'logging' });

console.log(app.className()); // TestDataspaceDataPlaneApp
await app.start();
```

```typescript
import { TestDataspaceDataPlaneApp } from '@twin.org/dataspace-test-app';

const app = new TestDataspaceDataPlaneApp();

const datasets = await app.datasetsHandled();
const supportedQueryTypes = app.supportedQueryTypes();
const activities = app.activitiesHandled();

console.log(datasets.length); // 1
console.log(supportedQueryTypes[0]); // TestQueryType
console.log(activities[0].objectType); // https://vocabulary.uncefact.org/Consignment
```

```typescript
import { TestDataspaceDataPlaneApp } from '@twin.org/dataspace-test-app';
import type { IDataspaceActivity } from '@twin.org/dataspace-models';

const app = new TestDataspaceDataPlaneApp();

const activity: IDataspaceActivity = {
  '@context': 'https://www.w3.org/ns/activitystreams',
  id: 'urn:activity:3001',
  type: 'Create',
  object: 'urn:ucr:24PLP051219453I002610799053311'
};

const activityResult = await app.handleActivity<string>(activity);
console.log(activityResult); // 1234
```

```typescript
import { DataRequestType, type IDataRequest } from '@twin.org/dataspace-models';
import { TestDataspaceDataPlaneApp } from '@twin.org/dataspace-test-app';

const app = new TestDataspaceDataPlaneApp();

const entityRequest: IDataRequest = {
  type: DataRequestType.DataAssetEntities,
  entitySet: {
    entityType: 'https://vocabulary.uncefact.org/Consignment',
    entityId: ['urn:ucr:24PLP051219453I002610799053311']
  }
};

const entityResponse = await app.handleDataRequest(entityRequest, undefined, 10);
console.log(Array.isArray(entityResponse.data)); // false

const queryRequest: IDataRequest = {
  type: DataRequestType.QueryDataAsset,
  query: {
    query: {
      destinationCountry: {
        equals: 'unece:CountryId#GB'
      }
    }
  }
};

const queryResponse = await app.handleDataRequest(queryRequest, undefined, 10);
console.log(Array.isArray(queryResponse.data)); // true
```
