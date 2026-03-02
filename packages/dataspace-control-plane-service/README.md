# TWIN Dataspace Control Plane Service

Dataspace Control Plane contract implementation and REST endpoint definitions, implementing the Eclipse Dataspace Protocol (DSP) specification.

## Installation

```shell
npm install @twin.org/dataspace-control-plane-service
```

## Overview

The Control Plane manages DSP protocol operations including contract negotiation and transfer process management.

### Key Features

- **Transfer Process Management**: Create, start, complete, suspend, and terminate transfers
- **Contract Negotiation**: Negotiate agreements with providers via Policy Negotiation Point (PNP)
- **Agreement Validation**: Validate agreements via Policy Administration Point (PAP)
- **Dataset Validation**: Validate datasets via Federated Catalogue
- **Entity Storage**: Persists `TransferProcessEntity` to shared storage (accessible by Data Plane)
- **Token Generation**: Creates transfer tokens with configurable expiration
- **State Machine**: Enforces valid state transitions per DSP specification

### Constructor Options

- `loggingComponentType` (default: `logging`) - Logging component type
- `identityComponentType` (default: `identity`) - Identity component for token signing
- `identityAuthenticationComponentType` (default: `identity-authentication`) - Token validation component
- `transferProcessEntityStorageType` (default: `transfer-process-entity`) - Entity storage for transfer processes
- `policyAdministrationPointComponentType` (default: `policy-administration-point`) - Agreement lookup component
- `policyNegotiationPointComponentType` (default: `policy-negotiation-point`) - Contract negotiation component
- `federatedCatalogueComponentType` (default: `federated-catalogue`) - Dataset validation component
- `trustComponentType` (default: `trust`) - Trust verification component

### DSP Protocols

The Control Plane implements two separate DSP protocols, following the Eclipse Dataspace Protocol specification:

#### 1. Contract Negotiation Protocol

Negotiate agreements with providers before initiating transfers. Integrates with the Rights Management Policy Negotiation Point (PNP).

**REST API Endpoints:**

- `POST /control-plane/negotiations` - Initiate contract negotiation
- `GET /control-plane/negotiations/:negotiationId` - Get negotiation status

**Example Flow:**

```bash
# Step 1: Initiate negotiation
curl -X POST https://consumer.example.com/control-plane/negotiations \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "offer-from-catalog",
    "providerEndpoint": "https://provider.example.com/negotiations"
  }'
# Response: { agreement: {...}, agreementId: "...", negotiationId: "..." }

# Step 2: Check negotiation status (optional)
curl -X GET https://consumer.example.com/control-plane/negotiations/${NEGOTIATION_ID} \
  -H "Authorization: Bearer ${TOKEN}"
# Response: { negotiationId: "...", state: "FINALIZED", ... }
```

**Service Methods:**

- `negotiateAgreement()` - Initiate contract negotiation (returns agreement)
- `getNegotiation()` - Retrieve negotiation state

**Flow**: Catalog → Negotiation → Agreement → Transfer

#### 2. Transfer Process Protocol

Manage the lifecycle of data transfers using negotiated agreements.

**REST API Endpoints:**

- `POST /control-plane/transfers/request` - Request a transfer
- `GET /control-plane/transfers/:pid` - Get transfer process state
- `POST /control-plane/transfers/:pid/start` - Start a transfer
- `POST /control-plane/transfers/:pid/complete` - Complete a transfer
- `POST /control-plane/transfers/:pid/suspend` - Suspend a transfer
- `POST /control-plane/transfers/:pid/terminate` - Terminate a transfer

**Service Methods:**

- `requestTransfer()` - Initiate a transfer request (requires existing agreement)
- `getTransferProcess()` - Retrieve transfer process state
- `startTransfer()` - Start an approved transfer
- `completeTransfer()` - Mark transfer as complete
- `suspendTransfer()` - Temporarily suspend a transfer
- `terminateTransfer()` - Terminate a transfer

### Shared Storage Architecture

The Control Plane writes `TransferProcessEntity` to entity storage, which is read by the Data Plane for `consumerPid` resolution:

```text
Control Plane                    Data Plane
     │                               │
     │ set(TransferProcessEntity)    │ get(consumerPid)
     │                               │
     └───── Entity Storage ──────────┘
```

## Examples

Usage of the APIs is shown in the examples [docs/examples.md](docs/examples.md)

## Reference

Detailed reference documentation for the API can be found in [docs/reference/index.md](docs/reference/index.md)

## Changelog

The changes between each version can be found in [docs/changelog.md](docs/changelog.md)
