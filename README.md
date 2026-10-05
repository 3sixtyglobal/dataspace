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

## Architecture

- [Dataspace Overview](docs/architecture/dataspace.mdx) - What a dataspace is, key principles, participant roles, and the component landscape.
- [Dataspace Connector](docs/architecture/dataspace-connector.mdx) - Control plane and data plane separation, Dataspace Protocol surface, transfer formats, and token flow.
- [Trust and Identity](docs/architecture/dataspace-trust-and-identity.mdx) - DIDs, verifiable credentials, trust payloads, and trust data.
- [Federated Catalogue](docs/architecture/dataspace-federated-catalogue.mdx) - DCAT dataset descriptions, catalogue APIs, and entry lifecycle.
- [ODRL Policies](docs/architecture/dataspace-odrl-policies.mdx) - The policy model, constraint patterns, and the dataspace ODRL profile.
- [Rights Management](docs/architecture/dataspace-rights-management.mdx) - The policy point architecture, evaluation pipeline, usage control, and audit trail.
- [End-to-End Data Exchange](docs/architecture/dataspace-end-to-end.mdx) - A worked example from registration through publication, discovery, negotiation, transfer, and audit.
- [Glossary](docs/architecture/dataspace-glossary.mdx) - Terms and acronyms used across the documentation.

## Contributing

To contribute to this package see the guidelines for building and publishing in [CONTRIBUTING](./CONTRIBUTING.md)

## Origin

This repository is derived from the original [iotaledger/twin-dataspace](https://github.com/iotaledger/twin-dataspace) repository.
