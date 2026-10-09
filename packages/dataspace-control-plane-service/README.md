# Dataspace Control Plane Service

This package implements agreement negotiation and transfer process lifecycle management for control plane operations. It coordinates protocol-compliant state transitions and persists transfer state that can be consumed by downstream data plane components.

Its behaviour follows the [Eclipse Dataspace Protocol](https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/) and is designed for policy-aware transfer orchestration. For the architectural context see the [dataspace architecture documentation](https://github.com/3sixtyglobal/dataspace/blob/next/docs/architecture/dataspace.mdx).

## Installation

```shell
npm install @3sixty/dataspace-control-plane-service
```

## Examples

Usage of the APIs is shown in the examples [docs/examples.md](docs/examples.md)

## Reference

Detailed reference documentation for the API can be found in [docs/reference/index.md](docs/reference/index.md)

## Changelog

The changes between each version can be found in [docs/changelog.md](docs/changelog.md)

## Origin

This package is derived from the original [iotaledger/twin-dataspace](https://github.com/iotaledger/twin-dataspace/tree/next/packages/dataspace-control-plane-service) repository.
