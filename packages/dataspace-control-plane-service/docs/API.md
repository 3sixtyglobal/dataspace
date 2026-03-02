# Dataspace Control Plane API Documentation

REST API endpoints for the Eclipse Dataspace Protocol (DSP) Contract Negotiation and Transfer Process protocols.

## Table of Contents

- [Authentication](#authentication)
- [Contract Negotiation Protocol](#contract-negotiation-protocol)
  - [POST /negotiations](#post-negotiations)
  - [GET /negotiations/:negotiationId](#get-negotiationsnegotiationid)
- [Transfer Process Protocol](#transfer-process-protocol)
  - [POST /transfers/request](#post-transfersrequest)
  - [GET /transfers/:pid](#get-transferspid)
  - [POST /transfers/:pid/start](#post-transferspidstart)
  - [POST /transfers/:pid/complete](#post-transferspidcomplete)
  - [POST /transfers/:pid/suspend](#post-transferspidsuspend)
  - [POST /transfers/:pid/terminate](#post-transferspidterminate)
- [Error Handling](#error-handling)

## Authentication

All API endpoints require authentication via Bearer token in the `Authorization` header:

```http
Authorization: Bearer <trust-token>
```

## Contract Negotiation Protocol

Implements the DSP Contract Negotiation Protocol for negotiating agreements with data providers.

**Base Path:** `/control-plane/negotiations`

**Specification:** [Eclipse DSP 2025-1 - Contract Negotiation](https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/#negotiation-protocol)

### POST /negotiations

Initiate a contract negotiation with a provider.

**Request:**

```http
POST /control-plane/negotiations
Authorization: Bearer <trust-token>
Content-Type: application/json

{
  "offerId": "offer-123",
  "providerEndpoint": "https://provider.example.com/negotiations",
  "publicOrigin": "https://consumer.example.com"  // Optional
}
```

**Request Body:**

| Field              | Type   | Required | Description                                                                         |
| ------------------ | ------ | -------- | ----------------------------------------------------------------------------------- |
| `offerId`          | string | Yes      | The offer ID from the provider's catalog                                            |
| `providerEndpoint` | string | Yes      | The provider's contract negotiation endpoint URL                                    |
| `publicOrigin`     | string | No       | The public origin URL for callbacks (defaults to hosting component's public origin) |

**Response (200 OK):**

```json
{
  "agreement": {
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Agreement",
    "uid": "agreement-456",
    "assigner": "did:iota:provider-xyz",
    "assignee": "did:iota:consumer-abc",
    "target": "urn:uuid:dataset-789",
    "permission": [{ "action": "read" }]
  },
  "agreementId": "agreement-456",
  "negotiationId": "negotiation-123",
  "consumerPid": "consumer-pid-123",
  "providerPid": "provider-pid-456"
}
```

**Response Body:**

| Field           | Type        | Description                              |
| --------------- | ----------- | ---------------------------------------- |
| `agreement`     | IOdrlPolicy | The negotiated ODRL agreement            |
| `agreementId`   | string      | The unique identifier of the agreement   |
| `negotiationId` | string      | The unique identifier of the negotiation |
| `consumerPid`   | string      | The consumer process ID                  |
| `providerPid`   | string      | The provider process ID                  |

**Error Responses:**

| Status Code | Description                                   |
| ----------- | --------------------------------------------- |
| 400         | Invalid request (missing required fields)     |
| 401         | Unauthorized (invalid or missing trust token) |
| 404         | Offer not found                               |
| 500         | Internal server error during negotiation      |
| 504         | Negotiation timeout                           |

**Example:**

```bash
curl -X POST https://consumer.example.com/control-plane/negotiations \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "offer-from-catalog",
    "providerEndpoint": "https://provider.example.com/negotiations"
  }'
```

### GET /negotiations/:negotiationId {#get-negotiationsnegotiationid}

Get the current state of a contract negotiation.

**Request:**

```http
GET /control-plane/negotiations/{negotiationId}
Authorization: Bearer <trust-token>
```

**Path Parameters:**

| Parameter       | Type   | Description                              |
| --------------- | ------ | ---------------------------------------- |
| `negotiationId` | string | The unique identifier of the negotiation |

**Response (200 OK):**

```json
{
  "negotiationId": "negotiation-123",
  "state": "FINALIZED",
  "consumerPid": "consumer-pid-123",
  "providerPid": "provider-pid-456",
  "agreementId": "agreement-456"
}
```

**Response Body:**

| Field           | Type   | Description                                                                             |
| --------------- | ------ | --------------------------------------------------------------------------------------- |
| `negotiationId` | string | The unique identifier of the negotiation                                                |
| `state`         | string | Current negotiation state (REQUESTED, OFFERED, AGREED, VERIFIED, FINALIZED, TERMINATED) |
| `consumerPid`   | string | The consumer process ID                                                                 |
| `providerPid`   | string | The provider process ID                                                                 |
| `agreementId`   | string | The agreement ID (only present if state is FINALIZED)                                   |
| `errorDetail`   | string | Error details (only present if state is TERMINATED)                                     |

**Negotiation States:**

| State        | Description                                   |
| ------------ | --------------------------------------------- |
| `REQUESTED`  | Initial request sent to provider              |
| `OFFERED`    | Provider sent counter-offer                   |
| `AGREED`     | Agreement reached                             |
| `VERIFIED`   | Agreement verified                            |
| `FINALIZED`  | Negotiation complete, agreement ready for use |
| `TERMINATED` | Negotiation failed or was cancelled           |

**Error Responses:**

| Status Code | Description                                   |
| ----------- | --------------------------------------------- |
| 401         | Unauthorized (invalid or missing trust token) |
| 404         | Negotiation not found                         |
| 500         | Internal server error                         |

**Example:**

```bash
curl -X GET https://consumer.example.com/control-plane/negotiations/negotiation-123 \
  -H "Authorization: Bearer ${TOKEN}"
```

## Transfer Process Protocol

Implements the DSP Transfer Process Protocol for managing data transfers.

**Base Path:** `/control-plane/transfers`

**Specification:** [Eclipse DSP 2025-1 - Transfer Process](https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/#transfer-process-protocol)

### POST /transfers/request

Initiate a transfer request using a previously negotiated agreement.

**Request:**

```http
POST /control-plane/transfers/request
Authorization: Bearer <trust-token>
Content-Type: application/json

{
  "@context": ["https://w3id.org/dspace/2025/1/context.jsonld"],
  "@type": "TransferRequestMessage",
  "consumerPid": "consumer-pid-123",
  "agreementId": "agreement-456",
  "callbackAddress": "https://consumer.example.com/callbacks",
  "format": "application/json"
}
```

_See [Eclipse DSP Transfer Request specification](https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/#transfer-process-protocol) for complete request schema._

### GET /transfers/:pid {#get-transferspid}

Get the current state of a transfer process.

**Request:**

```http
GET /control-plane/transfers/{pid}
Authorization: Bearer <trust-token>
```

_Returns the DSP TransferProcess object with current state and metadata._

### POST /transfers/:pid/start {#post-transferspidstart}

Start an approved transfer.

### POST /transfers/:pid/complete {#post-transferspidcomplete}

Mark a transfer as complete.

### POST /transfers/:pid/suspend {#post-transferspidsuspend}

Suspend a running transfer.

### POST /transfers/:pid/terminate {#post-transferspidterminate}

Terminate a transfer.

_See the main [README.md](../README.md) and [DSP specification](https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/) for detailed Transfer Process Protocol documentation._

## Error Handling

All endpoints return errors in the DSP error format when applicable:

**Contract Negotiation Error:**

```json
{
  "@context": ["https://w3id.org/dspace/2025/1/context.jsonld"],
  "@type": "dspace:ContractNegotiationError",
  "providerPid": "provider-pid-456",
  "consumerPid": "consumer-pid-123",
  "code": "ErrorCode:description",
  "reason": [{ "message": "Human-readable error message", "language": "en" }]
}
```

**Transfer Process Error:**

```json
{
  "@context": ["https://w3id.org/dspace/2025/1/context.jsonld"],
  "@type": "dspace:TransferError",
  "providerPid": "provider-pid-456",
  "consumerPid": "consumer-pid-123",
  "code": "ErrorCode:description",
  "reason": [{ "message": "Human-readable error message", "language": "en" }]
}
```

**HTTP Status Codes:**

| Status Code | Description                                      |
| ----------- | ------------------------------------------------ |
| 200         | Success                                          |
| 400         | Bad Request (invalid input)                      |
| 401         | Unauthorized (missing or invalid authentication) |
| 404         | Not Found (resource doesn't exist)               |
| 409         | Conflict (invalid state transition)              |
| 500         | Internal Server Error                            |
| 504         | Gateway Timeout (negotiation timeout)            |

## Full Example Workflow

```bash
#!/bin/bash

# 1. Query provider catalog (not part of Control Plane API)
CATALOG_RESPONSE=$(curl -X GET https://provider.example.com/catalog \
  -H "Authorization: Bearer ${TOKEN}")
OFFER_ID=$(echo $CATALOG_RESPONSE | jq -r '.offers[0].uid')

# 2. Initiate contract negotiation
NEGOTIATION_RESPONSE=$(curl -X POST https://consumer.example.com/control-plane/negotiations \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"offerId\": \"${OFFER_ID}\",
    \"providerEndpoint\": \"https://provider.example.com/negotiations\"
  }")

AGREEMENT_ID=$(echo $NEGOTIATION_RESPONSE | jq -r '.agreementId')
NEGOTIATION_ID=$(echo $NEGOTIATION_RESPONSE | jq -r '.negotiationId')

echo "Agreement ID: ${AGREEMENT_ID}"
echo "Negotiation ID: ${NEGOTIATION_ID}"

# 3. (Optional) Check negotiation status
NEGOTIATION_STATUS=$(curl -X GET \
  "https://consumer.example.com/control-plane/negotiations/${NEGOTIATION_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Negotiation Status: $(echo $NEGOTIATION_STATUS | jq -r '.state')"

# 4. Request transfer using the agreement
TRANSFER_RESPONSE=$(curl -X POST https://consumer.example.com/control-plane/transfers/request \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"@context\": [\"https://w3id.org/dspace/2025/1/context.jsonld\"],
    \"@type\": \"TransferRequestMessage\",
    \"consumerPid\": \"my-consumer-pid-001\",
    \"agreementId\": \"${AGREEMENT_ID}\",
    \"callbackAddress\": \"https://consumer.example.com/callbacks\",
    \"format\": \"application/json\"
  }")

CONSUMER_PID=$(echo $TRANSFER_RESPONSE | jq -r '.consumerPid')
echo "Transfer Process ID: ${CONSUMER_PID}"

# 5. Get transfer status
curl -X GET "https://consumer.example.com/control-plane/transfers/${CONSUMER_PID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

## See Also

- [Eclipse Dataspace Protocol Specification](https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/)
- [ODRL (Open Digital Rights Language)](https://www.w3.org/TR/odrl-model/)
- [Rights Management Contract Negotiation Documentation](../../../../.cursor/docs/dataspace-connector/contract-negotiation/README.md)
