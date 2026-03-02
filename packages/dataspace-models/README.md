# TWIN Dataspace Models

Models which define the structure of the dataspace contracts and connectors.

## Installation

```shell
npm install @twin.org/dataspace-models
```

## Overview

This package provides the core interfaces and entities for the TWIN Dataspace Connector, implementing the Eclipse Dataspace Protocol (DSP) specification.

### Key Components

#### Control Plane

- `IDataspaceControlPlaneComponent` - Interface for DSP protocol operations (negotiation, transfer management)
- `IDataspaceControlPlaneResolverComponent` - Interface for resolving `consumerPid` to transfer context
- `ITransferContext` - Transfer context containing datasetId, agreement, and policies
- `TransferProcessEntity` - Entity storage model for transfer processes

#### Data Plane

- `IDataspaceDataPlaneComponent` - Interface for data access operations (GET/query entities)
- `IDataspaceApp` - Interface for Dataspace Apps that handle specific datasets

#### Shared Entities

- `TransferProcessEntity` - Shared between Control Plane and Data Plane via entity storage
  - Primary key: `id` (consumerPid)
  - Stores: state, datasetId, agreement, dataAddress, token expiration
  - Used for `consumerPid` flow

### Architecture

```text
Control Plane                    Data Plane
     │                               │
     │ Creates/Updates               │ Reads
     │                               │
     └───── TransferProcessEntity ───┘
                (shared storage)
```

The unified architecture enables:

- Transfer-based access via `consumerPid` parameter
- Shared state without resolver API calls
- Policy enforcement from agreements

## Examples

Usage of the APIs is shown in the examples [docs/examples.md](docs/examples.md)

## Reference

Detailed reference documentation for the API can be found in [docs/reference/index.md](docs/reference/index.md)

## Changelog

The changes between each version can be found in [docs/changelog.md](docs/changelog.md)
