# Dataspace Data Plane Service

This package processes activities and data requests while enforcing transfer and policy constraints in the data plane. It coordinates transfer state checks, app delegation, and activity tracking so downstream consumers receive policy-aligned data responses.

Its runtime behaviour is designed for integration with control plane managed transfers and shared storage-backed process state. For the architectural context see the [dataspace architecture documentation](https://github.com/3sixtyglobal/twin-dataspace/blob/next/docs/architecture/dataspace.mdx).

## Installation

```shell
npm install @twin.org/dataspace-data-plane-service
```

## Examples

Usage of the APIs is shown in the examples [docs/examples.md](docs/examples.md)

## Reference

Detailed reference documentation for the API can be found in [docs/reference/index.md](docs/reference/index.md)

## Changelog

The changes between each version can be found in [docs/changelog.md](docs/changelog.md)

## Origin

This package is derived from the original [iotaledger/twin-dataspace](https://github.com/iotaledger/twin-dataspace/tree/next/packages/dataspace-data-plane-service) repository.
