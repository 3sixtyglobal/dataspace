# Dataspace API Changes - consumerPid Flow

This document describes the API changes introduced for the consumerPid flow.

## GET `/entities` Endpoint

### GET `/entities` - Previous Format (Deprecated)

```http
GET /entities?type=Consignment&datasetId=urn:dataset:123
```

### GET `/entities` - Current Format

```http
GET /entities?type=Consignment&consumerPid=urn:uuid:consumer-123
Authorization: Bearer <transfer-token>
```

### Parameters

- `type` (required) - Entity type to retrieve
- `consumerPid` (required) - Consumer PID from transfer process
- `datasetId` (deprecated) - Direct dataset ID (for backward compatibility)

### Authorization for GET `/entities`

When using `consumerPid`, the `Authorization` header is required with the transfer token obtained from the Control Plane during transfer initiation.

## POST `/entities/query` Endpoint

### POST `/entities/query` - Previous Format (Deprecated)

```json
{
  "dataAsset": { "dataSetId": ["urn:dataset:123"] },
  "query": { "type": "EntityFilter", "q": "..." }
}
```

### POST `/entities/query` - Current Format

```json
{
  "consumerPid": "urn:uuid:consumer-123",
  "query": { "type": "EntityFilter", "q": "..." },
  "limit": 100,
  "cursor": "..."
}
```

### Authorization for POST `/entities/query`

When using `consumerPid`, the `Authorization` header is required.

## Error Responses

### HTTP Status Codes

- `400 Bad Request` - Syntactically incorrect request (missing required parameters)
- `401 Unauthorized` - Invalid or expired transfer token
- `404 Not Found` - `consumerPid` not found in transfer process storage
- `422 Unprocessable Entity` - Transfer not in `STARTED` state or query type not supported

### Error Response Format

```json
{
  "name": "NotFoundError",
  "message": "dataspaceDataPlaneService.consumerPidNotFound",
  "properties": {
    "consumerPid": "urn:uuid:consumer-123"
  }
}
```

## Transfer Process Flow

For consumerPid-based data access:

1. **Consumer initiates transfer** via Control Plane `requestTransfer()`
2. **Provider approves and starts** via Control Plane `startTransfer()`
3. **Consumer receives token** with `consumerPid` and transfer token
4. **Consumer queries data** via Data Plane with `consumerPid` + Authorization header
5. **Data Plane validates** transfer state and token
6. **Data Plane returns** filtered results based on agreement policies

## Policy Enforcement

When using the consumerPid flow, the Data Plane applies ODRL policies from the agreement:

### Prohibitions

Fields targeted by prohibition rules are removed from results.

### Permission Constraints

- `count` - Limits number of results returned
- `dateTime` with operators (`lt`, `lteq`, `gt`, `gteq`) - Filters by temporal boundaries

### Obligations

Obligations are logged for audit but do not block data access.

## Migration Guide

### For Consumers

1. Initiate transfer via Control Plane API
2. Store the `consumerPid` and transfer token from the response
3. Use `consumerPid` instead of `datasetId` in Data Plane queries
4. Include `Authorization: Bearer <token>` header

### For Providers

1. Ensure Control Plane and Data Plane share the same entity storage
2. Configure `transferProcessEntityStorageType` in both services
3. Agreement policies will be automatically enforced

## Backward Compatibility

The `datasetId` parameter is still supported for backward compatibility but is deprecated. New implementations should use `consumerPid`.
