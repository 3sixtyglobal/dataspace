# TWIN Dataspace Data Plane Service

Dataspace Data Plane contract implementation and REST endpoint definitions.

## Installation

```shell
npm install @twin.org/dataspace-data-plane-service
```

## Overview

The Data Plane handles data access requests, delegating to Dataspace Apps for actual data retrieval while enforcing policies from transfer agreements.

### Key Features

- **consumerPid Flow**: Supports `consumerPid` parameter for transfer-based access
- **Shared Storage Integration**: Reads `TransferProcessEntity` from Control Plane storage
- **Policy Enforcement**: Applies ODRL prohibitions and constraints from agreements
- **App Delegation**: Delegates data retrieval to registered Dataspace Apps
- **Backward Compatibility**: Still supports direct `datasetId` parameter (deprecated)

### Constructor Options

- `loggingComponentType` (default: `logging`) - Logging component type
- `backgroundTaskComponentType` (default: `background-task`) - Background task component
- `taskSchedulerComponentType` (default: `task-scheduler`) - Task scheduler component
- `activityLogEntityStorageType` (default: `activity-log-details`) - Activity log storage
- `activityTaskEntityStorageType` (default: `activity-task`) - Activity task storage
- `transferProcessEntityStorageType` (required) - Entity storage for reading transfer processes
- `trustComponentType` (default: `trust`) - Trust validation component

### consumerPid Flow

When `consumerPid` is provided, the Data Plane:

1. Validates the transfer token from Authorization header
2. Looks up `TransferProcessEntity` by `consumerPid`
3. Validates transfer state is `STARTED`
4. Extracts `datasetId` from the transfer process
5. Finds the App registered for that dataset
6. Delegates query to the App
7. Applies policy filters from the agreement
8. Returns filtered results

### Policy Enforcement

The service applies ODRL policies from agreements:

- **Prohibitions**: Removes fields targeted by prohibition rules
- **Permissions with Constraints**:
  - `count` constraint: Limits number of results
  - `dateTime` constraint: Filters by temporal boundaries (lt, lteq, gt, gteq)
- **Obligations**: Logged for audit purposes

### Error Responses

- `400 Bad Request` - Syntactically incorrect request (GuardError)
- `401 Unauthorized` - Invalid or expired transfer token
- `404 Not Found` - `consumerPid` not found
- `422 Unprocessable Entity` - Query type not supported or invalid transfer state

## Examples

Usage of the APIs is shown in the examples [docs/examples.md](docs/examples.md)

## Reference

Detailed reference documentation for the API can be found in [docs/reference/index.md](docs/reference/index.md)

## Changelog

The changes between each version can be found in [docs/changelog.md](docs/changelog.md)
