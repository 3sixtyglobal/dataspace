# TWIN Dataspace REST Server

A unified REST server for the Dataspace Connector, providing both Control Plane and Data Plane APIs.

## Open API

The Open API Spec is [spec.json](./docs/open-api/spec.json)

## Features

- **Control Plane APIs**: DSP protocol operations (transfer management)
- **Data Plane APIs**: Data access via GET/query endpoints
- **Activity Streams**: WebSocket APIs for activity notifications
- **Shared Storage**: Both planes share `TransferProcessEntity` storage

## Building and running the application

To install the dependencies, perform a full build and start the server.

```shell
npm install
npm run dist
npm start
```

## Development mode

Once you have performed a full build you can run the server in development mode, this will watch the TypeScript code, rebuild if there are any changes, and relaunch the server.

```shell
npm run dev
```

## Configuration

There are various options you can set through configuration, these can be found in [docs/configuration.md](docs/configuration.md).

### Key Configuration

For proper operation, ensure both Control Plane and Data Plane are configured with the same `transferProcessEntityStorageType` to enable shared state.

## Changelog

The changes between each version can be found in [docs/changelog.md](docs/changelog.md).
