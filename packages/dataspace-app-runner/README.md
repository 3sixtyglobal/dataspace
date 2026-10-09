# Dataspace App Runner

This package runs dataspace app activity handlers in background execution contexts. It is intended for workloads where app logic should execute asynchronously while preserving runtime context and engine state.

By isolating execution concerns, it helps services schedule and process activity workloads consistently.

## Installation

```shell
npm install @3sixty/dataspace-app-runner
```

## Examples

Usage of the APIs is shown in the examples [docs/examples.md](docs/examples.md)

## Reference

Detailed reference documentation for the API can be found in [docs/reference/index.md](docs/reference/index.md)

## Changelog

The changes between each version can be found in [docs/changelog.md](docs/changelog.md)

## Origin

This package is derived from the original [iotaledger/twin-dataspace](https://github.com/iotaledger/twin-dataspace/tree/next/packages/dataspace-app-runner) repository.
