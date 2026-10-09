# App Runner Examples

Use these snippets to run application logic in background workers while preserving context and engine state.

## App Runner Functions

```typescript
import { appRunnerStart, appRunner, appRunnerEnd } from '@3sixty/dataspace-app-runner';
import type { IExecutionPayload } from '@3sixty/dataspace-models';
import type { IEngineCoreClone } from '@3sixty/engine-models';

declare const engineCloneData: IEngineCoreClone;
declare const payload: IExecutionPayload;

await appRunnerStart(engineCloneData);
const result = await appRunner(engineCloneData, payload);
console.log(result); // 1234
await appRunnerEnd();
```

```typescript
import { appRunner } from '@3sixty/dataspace-app-runner';
import type { IExecutionPayload } from '@3sixty/dataspace-models';
import type { IEngineCoreClone } from '@3sixty/engine-models';

declare const engineCloneData: IEngineCoreClone;

const payload: IExecutionPayload = {
  executorApp: 'https://twin.example.org/app1',
  activityLogEntryId: 'urn:activity-log:001',
  activity: {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Create',
    id: 'urn:activity:1'
  }
};

const result = await appRunner(engineCloneData, payload);
console.log(typeof result); // string
```
