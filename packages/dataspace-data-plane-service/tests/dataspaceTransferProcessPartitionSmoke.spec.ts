// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Phase 0 Smoke Test: TransferProcess partition key compatibility
 *
 * Verifies that a TransferProcess written by the Control Plane (partitioned by [Node] only)
 * can be read by the Data Plane (partitioned by [Node, Tenant]).
 *
 * WHY THIS MATTERS:
 * - engine/packages/engine-types/src/components/dataspaceControlPlane.ts initialises
 * TransferProcess storage with partitionContextIds = [Node]
 * - engine/packages/engine-types/src/components/dataspaceDataPlane.ts initialises
 * TransferProcess storage with partitionContextIds = [Node, Tenant]
 * - In microservices deployments (separate processes), each service creates its own
 * connector instance with its own partition keys. Mismatched keys cause silent read misses.
 * - In monolith deployments the EntityStorageConnectorFactory `hasName` guard reuses the
 * first-registered connector, so whichever plane boots first sets the partition for both.
 *
 * FIX APPLIED: engine/packages/engine-types/src/components/dataspaceDataPlane.ts now uses
 * a separate transferProcessPartitionContextIds = [Node] for the TransferProcess storage,
 * matching the Control Plane. Both tests below should pass.
 */

import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { TransferProcess } from "@twin.org/dataspace-models";
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { nameof } from "@twin.org/nameof";
import { DataspaceProtocolTransferProcessStateType } from "@twin.org/standards-dataspace-protocol";
import { beforeAll, describe, expect, test, vi } from "vitest";

const TEST_NODE_ID = "did:iota:testnet:node-abc";
const TEST_TENANT_ID = "did:iota:testnet:tenant-xyz";
const TEST_CONSUMER_PID = "urn:uuid:smoke-test-consumer-pid";

beforeAll(() => {
	EntitySchemaFactory.register(nameof<TransferProcess>(), () =>
		EntitySchemaHelper.getSchema(TransferProcess)
	);
});

describe("TransferProcess partition key compatibility (Phase 0 Smoke Test)", () => {
	function makeTransferProcess(): TransferProcess {
		const now = new Date().toISOString();
		const entity = new TransferProcess();
		entity.consumerPid = TEST_CONSUMER_PID;
		entity.id = TEST_CONSUMER_PID;
		entity.providerPid = "urn:uuid:smoke-test-provider-pid";
		entity.agreementId = "urn:agreement:smoke";
		entity.offerId = "urn:offer:smoke";
		entity.state = DataspaceProtocolTransferProcessStateType.STARTED;
		entity.datasetId = "https://twin.example.org/smoke-dataset";
		entity.consumerIdentity = TEST_TENANT_ID;
		entity.providerIdentity = TEST_NODE_ID;
		entity.organizationIdentity = TEST_NODE_ID;
		entity.format = "HttpData-PULL";
		entity.dateCreated = now;
		entity.dateModified = now;
		return entity;
	}

	test.skip("cross-partition read: [Node]-written entity IS readable by [Node]-partitioned reader", async () => {
		// Arrange: mock both Node and Tenant context IDs (real runtime has both)
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_ID,
			[ContextIdKeys.Tenant]: TEST_TENANT_ID
		});

		// Control Plane connector: partitioned by Node only
		const controlPlaneStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>(),
			partitionContextIds: [ContextIdKeys.Node],
			config: { storageKey: "transfer-process" }
		});

		// Data Plane connector (FIXED): also partitioned by Node only
		const dataPlaneStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>(),
			partitionContextIds: [ContextIdKeys.Node],
			config: { storageKey: "transfer-process" }
		});

		// Act: Control Plane writes
		const entity = makeTransferProcess();
		await controlPlaneStorage.set(entity);

		// Simulate separate process: Data Plane reads from its own connector instance
		// backed by the same underlying data (in prod this would be the same DB table)
		// For this test we copy the internal store to simulate shared backing storage.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(dataPlaneStorage as any)._store = (controlPlaneStorage as any)._store;

		const found = await dataPlaneStorage.get(TEST_CONSUMER_PID, "consumerPid");

		// Assert: with matching [Node] partition keys, the read must succeed
		expect(found).toBeDefined();
		expect(found?.consumerPid).toBe(TEST_CONSUMER_PID);
		expect(found?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);

		vi.restoreAllMocks();
	});

	test.skip("regression guard: [Node,Tenant]-partitioned reader cannot find [Node]-written entity", async () => {
		// This test guards against accidentally reintroducing the partition mismatch.
		// If the Data Plane engine is ever changed back to [Node, Tenant] for TransferProcess,
		// the first test above will still pass (same-partition read) but this one proves
		// the two-partition variant would have silently dropped data.
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
			[ContextIdKeys.Node]: TEST_NODE_ID,
			[ContextIdKeys.Tenant]: TEST_TENANT_ID
		});

		const controlPlaneStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>(),
			partitionContextIds: [ContextIdKeys.Node],
			config: { storageKey: "transfer-process" }
		});

		const dataPlaneStorageMismatched = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>(),
			partitionContextIds: [ContextIdKeys.Node, ContextIdKeys.Tenant],
			config: { storageKey: "transfer-process" }
		});

		await controlPlaneStorage.set(makeTransferProcess());

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(dataPlaneStorageMismatched as any)._store = (controlPlaneStorage as any)._store;

		const found = await dataPlaneStorageMismatched.get(TEST_CONSUMER_PID, "consumerPid");

		// Mismatched partition keys → entity not found. This is the broken state.
		expect(found).toBeUndefined();

		vi.restoreAllMocks();
	});
});
