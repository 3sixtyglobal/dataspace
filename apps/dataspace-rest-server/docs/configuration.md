# Dataspace REST Server Configuration

## Environment variables

You need to set a `.env` file similar to this example [.env.example](.env.example).

## Component Configuration

### Control Plane Service

The Control Plane service manages DSP protocol operations. Configure via constructor options:

- `loggingComponentType` - Logging component (default: `logging`)
- `identityComponentType` - Identity for token signing (default: `identity`)
- `identityAuthenticationComponentType` - Token validation (default: `identity-authentication`)
- `transferProcessEntityStorageType` - Entity storage for transfers (default: `transfer-process-entity`)
- `policyAdministrationPointComponentType` - Agreement lookup (default: `policy-administration-point`)
- `federatedCatalogueComponentType` - Dataset validation (default: `federated-catalogue`)

### Data Plane Service

The Data Plane service handles data access requests. Configure via constructor options:

- `loggingComponentType` - Logging component (default: `logging`)
- `backgroundTaskComponentType` - Background tasks (default: `background-task`)
- `taskSchedulerComponentType` - Task scheduler (default: `task-scheduler`)
- `activityLogEntityStorageType` - Activity logs (default: `activity-log-details`)
- `activityTaskEntityStorageType` - Activity tasks (default: `activity-task`)
- `transferProcessEntityStorageType` - Entity storage for transfer lookup (optional)
- `trustComponentType` - Trust validation (default: `trust`)

### Shared Storage for consumerPid Flow

For the `consumerPid` flow, both Control Plane and Data Plane must share the same `TransferProcessEntity` storage. Configure both services with the same `transferProcessEntityStorageType`:

```typescript
// Control Plane creates transfer processes
const controlPlane = new DataspaceControlPlaneService({
  transferProcessEntityStorageType: 'transfer-process-entity'
});

// Data Plane reads transfer processes
const dataPlane = new DataspaceDataPlaneService({
  transferProcessEntityStorageType: 'transfer-process-entity'
});
```

### Entity Storage Setup

Register the entity storage connector before initializing services:

```typescript
import { EntityStorageConnectorFactory } from '@twin.org/entity-storage-models';
import { MemoryEntityStorageConnector } from '@twin.org/entity-storage-connector-memory';
import { TransferProcessEntity } from '@twin.org/dataspace-models';

EntityStorageConnectorFactory.register(
  'transfer-process-entity',
  () =>
    new MemoryEntityStorageConnector<TransferProcessEntity>({
      entitySchema: nameof<TransferProcessEntity>()
    })
);
```

For production, use a persistent storage connector (e.g., ScyllaDB, DynamoDB).

## Dataspace Apps

You can register existing Dataspace Apps by editing a `dataspace-apps.json` file that must exist under the root installation folder. See this example [dataspace-apps-example.json](dataspace-apps-example.json).
