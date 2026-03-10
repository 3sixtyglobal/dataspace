# TWIN Dataspace

This repository provides a coordinated set of components for secure dataspace data exchange, including control plane lifecycle management, data plane processing, and companion clients for integration.

The workspace is structured to support interoperable transfer and activity workflows aligned with the [Eclipse Dataspace Protocol](https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/), with shared models to keep behaviour consistent across services, clients, and test applications.

## Packages

- [dataspace-models](packages/dataspace-models/README.md) - Defines shared entities, interfaces, and data types used by control plane and data plane components.
- [dataspace-test-app](packages/dataspace-test-app/README.md) - Provides a sample dataspace app for local integration tests and development workflows.
- [dataspace-control-plane-service](packages/dataspace-control-plane-service/README.md) - Implements agreement negotiation and transfer process lifecycle management for control plane operations.
- [dataspace-control-plane-rest-client](packages/dataspace-control-plane-rest-client/README.md) - Provides an HTTP client for invoking control plane transfer process endpoints.
- [dataspace-data-plane-rest-client](packages/dataspace-data-plane-rest-client/README.md) - Provides an HTTP client for querying data assets and activity logs from data plane endpoints.
- [dataspace-data-plane-socket-client](packages/dataspace-data-plane-socket-client/README.md) - Provides a WebSocket client for subscribing to activity log status notifications.
- [dataspace-app-runner](packages/dataspace-app-runner/README.md) - Runs dataspace app activity handlers in background execution contexts.
- [dataspace-data-plane-service](packages/dataspace-data-plane-service/README.md) - Processes activities and data requests while enforcing transfer and policy constraints in the data plane.

## Apps

- [dataspace-rest-server](apps/dataspace-rest-server/README.md) - Hosts control plane and data plane APIs in a single deployable REST server.

## Contributing

To contribute to this package see the guidelines for building and publishing in [CONTRIBUTING](./CONTRIBUTING.md)
