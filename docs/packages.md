# Dataspace Packages

## dataspace-models

This package defines shared entities, interfaces, and data types used across control plane and data plane implementations. It establishes a consistent contract layer so services and clients can exchange compatible payloads with predictable semantics.

- [README](../packages/dataspace-models/README.md)
- [Examples](../packages/dataspace-models/docs/examples.md)
- [Changelog](../packages/dataspace-models/docs/changelog.md)

## dataspace-test-app

This package provides a reference app implementation used for local testing and integration scenarios. It demonstrates how applications can expose datasets, process activities, and respond to data requests through the shared contracts.

- [README](../packages/dataspace-test-app/README.md)
- [Examples](../packages/dataspace-test-app/docs/examples.md)
- [Changelog](../packages/dataspace-test-app/docs/changelog.md)

## dataspace-control-plane-service

This package implements transfer lifecycle management and agreement negotiation for control plane workflows. It aligns service behaviour with the [Eclipse Dataspace Protocol](https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/) and provides the operational core for policy-aware transfer orchestration.

- [README](../packages/dataspace-control-plane-service/README.md)
- [Examples](../packages/dataspace-control-plane-service/docs/examples.md)
- [Changelog](../packages/dataspace-control-plane-service/docs/changelog.md)

## dataspace-control-plane-rest-client

This package offers an HTTP client for invoking control plane endpoints from external services and tools. It simplifies integration by exposing a focused client surface for transfer process operations.

- [README](../packages/dataspace-control-plane-rest-client/README.md)
- [Examples](../packages/dataspace-control-plane-rest-client/docs/examples.md)
- [Changelog](../packages/dataspace-control-plane-rest-client/docs/changelog.md)

## dataspace-data-plane-rest-client

This package provides an HTTP client for querying entities, submitting activities, and retrieving activity log entries from data plane services. It supports straightforward integration with REST-based data workflows.

- [README](../packages/dataspace-data-plane-rest-client/README.md)
- [Examples](../packages/dataspace-data-plane-rest-client/docs/examples.md)
- [Changelog](../packages/dataspace-data-plane-rest-client/docs/changelog.md)

## dataspace-data-plane-socket-client

This package provides a WebSocket client for activity log subscriptions and event-driven status updates. It is suited to integrations that need low-latency notifications alongside request-driven data access.

- [README](../packages/dataspace-data-plane-socket-client/README.md)
- [Examples](../packages/dataspace-data-plane-socket-client/docs/examples.md)
- [Changelog](../packages/dataspace-data-plane-socket-client/docs/changelog.md)

## dataspace-app-runner

This package runs application handlers within managed execution contexts for background processing flows. It helps services execute app logic consistently while preserving engine state and context propagation.

- [README](../packages/dataspace-app-runner/README.md)
- [Examples](../packages/dataspace-app-runner/docs/examples.md)
- [Changelog](../packages/dataspace-app-runner/docs/changelog.md)

## dataspace-data-plane-service

This package processes activities and data queries while applying transfer and policy constraints in the data plane. It acts as the runtime bridge between transfer state, application logic, and downstream data responses.

- [README](../packages/dataspace-data-plane-service/README.md)
- [Examples](../packages/dataspace-data-plane-service/docs/examples.md)
- [Changelog](../packages/dataspace-data-plane-service/docs/changelog.md)
