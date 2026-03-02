# TWIN Dataspace

This mono-repository contains the packages to use with dataspace operations in TWIN applications.

This repository implements the Eclipse Dataspace Protocol (DSP) Transfer Process Protocol and Activity Stream processing for decentralized dataspaces, with both **Control Plane** and **Data Plane** components.

## Packages

### Control Plane

- [dataspace-control-plane-service](packages/dataspace-control-plane-service/README.md) - Control Plane service implementing DSP Transfer Process Protocol for data transfer negotiation and state management.

### Data Plane

- [dataspace-data-plane-service](packages/dataspace-data-plane-service/README.md) - Data Plane service for Activity Stream processing and dataspace app execution.
- [dataspace-data-plane-rest-client](packages/dataspace-data-plane-rest-client/README.md) - Data Plane contract implementation which can connect to REST endpoints.
- [dataspace-data-plane-socket-client](packages/dataspace-data-plane-socket-client/README.md) - Data Plane contract implementation which can connect to WebSocket endpoints.

### Shared

- [dataspace-models](packages/dataspace-models/README.md) - Models which define the structure of the dataspace contracts and connectors for both Control Plane and Data Plane.
- [dataspace-app-runner](packages/dataspace-app-runner/README.md) - Dataspace app execution framework.
- [dataspace-test-app](packages/dataspace-test-app/README.md) - Test application for development and testing.

## Apps

- [dataspace-rest-server](apps/dataspace-rest-server/README.md) - A REST server implementation for both the Data Plane and Control Plane.

## Contributing

To contribute to this package see the guidelines for building and publishing in [CONTRIBUTING](./CONTRIBUTING.md)
