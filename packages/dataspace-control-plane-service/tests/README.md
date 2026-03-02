# Dataspace Control Plane Service - Test Documentation

## Overview

This test suite uses a **hybrid approach** combining fast unit tests with mocks and comprehensive integration tests with real services.

---

## Test Strategy

### Unit Tests (Mocks) - 41 tests (~4s)

**Purpose:** Fast, isolated testing of business logic

**Files:**

- `dataspaceControlPlaneService.spec.ts` - Core service logic
- `dataspaceControlPlaneServicePap.spec.ts` - PAP integration scenarios
- `dataspaceControlPlaneRoutes.spec.ts` - HTTP route handlers

**Uses:**

- Mock FederatedCatalogue (`MockFederatedCatalogueComponent`)
- Mock PAP (`MockPolicyAdministrationPointComponent`)
- Mock Trust (`createMockTrustComponent()`)

**Benefits:**

- ⚡ Fast execution (~4 seconds)
- 🎯 Isolated testing (no external dependencies)
- 🔧 Easy to control test scenarios

---

### Integration Tests (Real Services) - 13 tests (~30s)

**Purpose:** End-to-end validation with real service implementations

#### PAP Integration Tests - 8 tests

**File:** `dataspaceControlPlaneServicePap.integration.spec.ts`

**Real Services:**

- ✅ PolicyAdministrationPointService (with MemoryEntityStorageConnector)

**Mock Services:**

- Mock FederatedCatalogue (isolated PAP testing)
- Mock Trust (isolated PAP testing)

**Tests:**

- URN format handling
- Agreement validation
- Policy creation/retrieval
- Error scenarios (missing assignee, missing target, etc.)

**Benefits:**

- ✅ Real ODRL policy validation
- ✅ Real entity storage operations
- ✅ Namespace handling (odrl:, urn:)

#### FederatedCatalogue Integration Tests - 5 tests

**File:** `dataspaceControlPlaneFedCat.integration.spec.ts`

**Real Services:**

- ✅ FederatedCatalogueService (with MemoryEntityStorageConnector)
- ✅ PolicyAdministrationPointService (with MemoryEntityStorageConnector)
- ✅ TrustService (with test JWT verifier)

**Tests:**

- Dataset storage/retrieval
- Full transfer flow
- Dataset validation during transfer
- Catalog conformance checks
- Agreement-to-offer matching

**Benefits:**

- ✅ Real DCAT dataset validation
- ✅ Real JSON-LD processing
- ✅ Real JWT token verification
- ✅ Full service integration

---

## Test Infrastructure

### Real Service Setup

**PAP Integration:**

```typescript
import { setupPapIntegration, cleanupPapIntegration } from './integration/setupPapIntegration.js';

beforeAll(async () => {
  const { pap, policyStorage } = setupPapIntegration('test-pap');
  // ... use real PAP
});

afterAll(() => {
  cleanupPapIntegration('test-pap');
});
```

**FederatedCatalogue Integration:**

```typescript
import {
  setupFedCatIntegration,
  cleanupFedCatIntegration
} from './integration/setupFedCatIntegration.js';

beforeAll(async () => {
  const { federatedCatalogue, datasetStorage } = setupFedCatIntegration('test-fedcat');
  // ... use real FederatedCatalogue
});

afterAll(() => {
  cleanupFedCatIntegration('test-fedcat');
});
```

**Trust Service Integration:**

```typescript
import {
  setupTrustIntegration,
  cleanupTrustIntegration
} from './integration/setupTrustIntegration.js';
import { generateTestJwt } from './integration/testJwtGenerator.js';

beforeAll(async () => {
  setupTrustIntegration('test-trust');
  const token = await generateTestJwt('did:iota:consumer-abc');
  // ... use real TrustService
});

afterAll(() => {
  cleanupTrustIntegration('test-trust');
});
```

### Test JWT Verifier

**Purpose:** Simplified JWT verification for integration tests

**Features:**

- ✅ JWT structure validation
- ✅ Expiration checking
- ✅ Identity extraction from `sub` claim
- ❌ NO cryptographic signature verification
- ❌ NO DID resolution
- ❌ NO blockchain validation

**Why Simplified?**

1. Testing service logic, not crypto primitives
2. Full DID infrastructure not needed for integration tests
3. Fast execution without external dependencies

**Implementation:** `tests/integration/testJwtVerifier.ts`

---

## Test Execution

### Run All Tests

```bash
npm test
```

**Expected output:**

```text
✓ dataspaceControlPlaneService.spec.ts (41 tests)
✓ dataspaceControlPlaneFedCat.integration.spec.ts (5 tests)
✓ dataspaceControlPlaneServicePap.integration.spec.ts (8 tests)
✓ dataspaceControlPlaneServicePap.spec.ts (8 tests)
✓ dataspaceControlPlaneRoutes.spec.ts (6 tests)

Test Files  5 passed (5)
Tests       68 passed (68)
Duration    ~42 seconds
```

### Run Specific Tests

```bash
# Unit tests only
npm test -- dataspaceControlPlaneService.spec.ts

# Integration tests only
npm test -- "*.integration.spec.ts"

# PAP integration only
npm test -- dataspaceControlPlaneServicePap.integration.spec.ts

# FedCat integration only
npm test -- dataspaceControlPlaneFedCat.integration.spec.ts
```

---

## Key Learnings from Migration

### 1. Dataset ID Handling (Phase 2)

**Issue:** Service was parsing URNs to short IDs (`urn:uuid:dataset-123` → `dataset-123`)

**Fix:** Use full URNs throughout (DCAT-compliant)

**Impact:** All dataset references now use full URNs

**See:** `.cursor/docs/dataspace-connector/mocks/PHASE-2-DATASET-ID-FIX.md`

### 2. JSON-LD Field Transformations (Phase 2)

**Issue:** FederatedCatalogue's JSON-LD processing transforms field names:

- `odrl:hasPolicy` → `hasPolicy`
- `uid` → `@id`

**Fix:** Check both field names when accessing data

**Impact:** Service now handles JSON-LD compaction correctly

**See:** `.cursor/docs/dataspace-connector/mocks/PHASE-2-JSONLD-FIX.md`

### 3. Trust Verifier Interface (Phase 3)

**Issue:** Misunderstood `ITrustVerifier` interface - thought it returned an object

**Discovery:** Uses **mutate-by-reference** pattern:

```typescript
verify(payload: unknown, info: ITrustVerificationInfo, errors: IError[]): Promise<boolean>
```

**Fix:** Return `boolean`, mutate `info.identity` parameter by reference

**Impact:** Real TrustService now working correctly

**See:** `.cursor/docs/dataspace-connector/mocks/PHASE-3-TRUST-INVESTIGATION.md`

---

## Mock vs Real - Decision Guide

### Use Mocks When

- ✅ Testing business logic in isolation
- ✅ Need fast execution (unit tests)
- ✅ Testing error handling with controlled scenarios
- ✅ Running tests frequently during development

### Use Real Services When

- ✅ Testing integration between services
- ✅ Validating standards compliance (ODRL, DCAT)
- ✅ Testing JSON-LD processing
- ✅ Verifying end-to-end flows
- ✅ Catching subtle bugs (mocks may not reflect real behavior)

### Bugs Caught by Integration Tests

1. **Dataset ID parsing** - Service was incorrectly parsing URNs
2. **JSON-LD field compaction** - Service wasn't handling transformed field names
3. **Offer/Agreement UID mismatches** - Tests had latent bugs with different UIDs

**Conclusion:** Both approaches are valuable! 🎯

---

## Performance Expectations

| Test Type            | Tests  | Duration | Use Case                         |
| -------------------- | ------ | -------- | -------------------------------- |
| Unit (Mocks)         | 41     | ~4s      | Fast feedback during development |
| Integration (PAP)    | 8      | ~12s     | PAP validation                   |
| Integration (FedCat) | 5      | ~13s     | Full integration                 |
| Routes               | 6      | ~1.5s    | HTTP layer                       |
| **Total**            | **68** | **~42s** | Full validation                  |

---

## Maintenance Guide

### Adding New Tests

**For Unit Tests:**

1. Add to existing `.spec.ts` files
2. Use mock components from `tests/mocks/`
3. Focus on business logic testing

**For Integration Tests:**

1. Add to `*.integration.spec.ts` files
2. Use setup helpers from `tests/integration/`
3. Use real services with in-memory storage
4. Test standards compliance and service interactions

### Updating Mocks

**When to update:**

- Real service interface changes
- New error scenarios needed
- Standards compliance requirements change

**Files:**

- `tests/mocks/mockFederatedCatalogue.ts`
- `tests/mocks/mockPolicyAdministrationPoint.ts`
- `tests/setupTestEnv.ts` (createMockTrustComponent)

### Updating Integration Infrastructure

**Files:**

- `tests/integration/setupPapIntegration.ts`
- `tests/integration/setupFedCatIntegration.ts`
- `tests/integration/setupTrustIntegration.ts`
- `tests/integration/testJwtVerifier.ts`
- `tests/integration/testJwtGenerator.ts`

---

## Related Documentation

- [IMPLEMENTATION-PLAN.md](../.cursor/docs/dataspace-connector/mocks/IMPLEMENTATION-PLAN.md) - Migration master plan
- [PHASE-2-SUMMARY.md](../.cursor/docs/dataspace-connector/mocks/PHASE-2-SUMMARY.md) - FederatedCatalogue integration
- [PHASE-3-SUMMARY.md](../.cursor/docs/dataspace-connector/mocks/PHASE-3-SUMMARY.md) - Trust Service integration
- [PHASE-2-DATASET-ID-FIX.md](../.cursor/docs/dataspace-connector/mocks/PHASE-2-DATASET-ID-FIX.md) - Dataset ID bug fix
- [PHASE-2-JSONLD-FIX.md](../.cursor/docs/dataspace-connector/mocks/PHASE-2-JSONLD-FIX.md) - JSON-LD handling fix

---

**Last Updated:** 2026-02-04  
**Test Suite Version:** Integration Tests v1.0  
**Status:** ✅ All 68 tests passing
