// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { HttpContextIdKeys } from "@3sixty/api-models";
import { ContextIdKeys, ContextIdStore } from "@3sixty/context";
import { ComponentFactory, Factory } from "@3sixty/core";
import {
	DataspaceTransferFormat,
	TransferProcessRole,
	type DataspaceAppDataset,
	type TransferProcess,
	type TransferRetrieval
} from "@3sixty/dataspace-models";
import { MemoryEntityStorageConnector } from "@3sixty/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@3sixty/entity-storage-models";
import { nameof, nameofKebabCase } from "@3sixty/nameof";
import { DataspaceProtocolTransferProcessStateType } from "@3sixty/standards-dataspace-protocol";
import { DataspaceControlPlaneService } from "../src/dataspaceControlPlaneService.js";
import { MockFederatedCatalogueComponent } from "./mocks/mockFederatedCatalogue.js";
import { MockPolicyAdministrationPointComponent } from "./mocks/mockPolicyAdministrationPoint.js";
import { MockPolicyNegotiationAdminPointComponent } from "./mocks/mockPolicyNegotiationAdminPoint.js";
import { MockPolicyNegotiationPointComponent } from "./mocks/mockPolicyNegotiationPoint.js";
import {
	createMockEngineCore,
	createMockTaskScheduler,
	createMockTrustComponent,
	createSingleTenantPlatformComponent,
	DEFAULT_SERVICE_OPTIONS,
	setupTestEnv
} from "./setupTestEnv.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_MS_2 = 2 * DAY_MS;
const OLD_DATE = new Date(Date.now() - DAY_MS_2).toISOString();

/**
 * Test suite for terminal transfer retention.
 */
describe("DataspaceControlPlaneService transfer retention", () => {
	let transferProcessStorage: MemoryEntityStorageConnector<TransferProcess>;
	let dataspaceAppDatasetStorage: MemoryEntityStorageConnector<DataspaceAppDataset>;
	let transferRetrievalStorage: MemoryEntityStorageConnector<TransferRetrieval>;

	beforeAll(async () => {
		await setupTestEnv();
	});

	beforeEach(() => {
		transferProcessStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>(),
			config: { storageKey: "transfer-process" }
		});
		dataspaceAppDatasetStorage = new MemoryEntityStorageConnector<DataspaceAppDataset>({
			entitySchema: nameof<DataspaceAppDataset>(),
			config: { storageKey: "dataspace-app-dataset" }
		});
		transferRetrievalStorage = new MemoryEntityStorageConnector<TransferRetrieval>({
			entitySchema: nameof<TransferRetrieval>(),
			config: { storageKey: "transfer-retrieval" }
		});

		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferProcess>(),
			() => transferProcessStorage
		);
		EntityStorageConnectorFactory.register(
			nameofKebabCase<DataspaceAppDataset>(),
			() => dataspaceAppDatasetStorage
		);
		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferRetrieval>(),
			() => transferRetrievalStorage
		);

		ComponentFactory.register("test-pap", () => new MockPolicyAdministrationPointComponent());
		ComponentFactory.register("test-pnp", () => new MockPolicyNegotiationPointComponent());
		ComponentFactory.register("test-fedcat", () => new MockFederatedCatalogueComponent());
		ComponentFactory.register(
			"test-pnap-admin",
			() => new MockPolicyNegotiationAdminPointComponent()
		);
		ComponentFactory.register("test-trust", () => createMockTrustComponent());
		ComponentFactory.register("task-scheduler", () => createMockTaskScheduler());
		ComponentFactory.register("platform", () => createSingleTenantPlatformComponent());

		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
			[ContextIdKeys.Node]: "did:iota:test-node",
			[ContextIdKeys.Tenant]: "did:iota:test-tenant",
			[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
			[ContextIdKeys.User]: "did:iota:test-user",
			[HttpContextIdKeys.PublicOrigin]: "https://test-origin.com"
		});
	});

	afterEach(async () => {
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<TransferProcess>());
			EntityStorageConnectorFactory.unregister(nameofKebabCase<DataspaceAppDataset>());
			EntityStorageConnectorFactory.unregister(nameofKebabCase<TransferRetrieval>());
		} catch {
			// Ignore errors if already unregistered
		}

		try {
			ComponentFactory.unregister("test-pap");
			ComponentFactory.unregister("test-pnp");
			ComponentFactory.unregister("test-fedcat");
			ComponentFactory.unregister("test-pnap-admin");
			ComponentFactory.unregister("test-trust");
			ComponentFactory.unregister("task-scheduler");
			ComponentFactory.unregister("platform");
		} catch {
			// Ignore errors if already unregistered
		}

		await transferProcessStorage.teardown();
		await dataspaceAppDatasetStorage.teardown();
		await transferRetrievalStorage.teardown();

		vi.restoreAllMocks();
	});

	/**
	 * Seed a transfer.
	 * @param id The internal id, also used to derive the pids.
	 * @param state The transfer state.
	 * @param dateModified The last-modified timestamp (defaults to now).
	 */
	async function seedTransfer(
		id: string,
		state: DataspaceProtocolTransferProcessStateType,
		dateModified: string = new Date().toISOString()
	): Promise<void> {
		await transferProcessStorage.set({
			id,
			consumerPid: `consumer-${id}`,
			providerPid: `provider-${id}`,
			state,
			agreementId: `agreement-${id}`,
			datasetId: `dataset-${id}`,
			offerId: `offer-${id}`,
			format: DataspaceTransferFormat.HttpDataPull,
			consumerIdentity: "did:iota:consumer-node-abc",
			providerIdentity: "did:iota:provider-node-xyz",
			localRole: TransferProcessRole.Consumer,
			organizationIdentity: "did:iota:provider-node-xyz",
			dateCreated: dateModified,
			dateModified
		});
	}

	/**
	 * Construct a service with the given retention.
	 * @param retainTerminalTransfersForMs The retention period.
	 * @returns The service.
	 */
	function createService(retainTerminalTransfersForMs?: number): DataspaceControlPlaneService {
		return new DataspaceControlPlaneService({
			...DEFAULT_SERVICE_OPTIONS,
			config: { ...DEFAULT_SERVICE_OPTIONS.config, retainTerminalTransfersForMs }
		});
	}

	/**
	 * Run the private retention cleanup.
	 * @param service The service.
	 */
	async function runCleanup(service: DataspaceControlPlaneService): Promise<void> {
		await (
			service as unknown as { cleanupRetainedTransfers(): Promise<void> }
		).cleanupRetainedTransfers();
	}

	test("cleanup removes terminal transfers older than the retention period", async () => {
		await seedTransfer(
			"old-completed",
			DataspaceProtocolTransferProcessStateType.COMPLETED,
			OLD_DATE
		);
		await seedTransfer(
			"old-terminated",
			DataspaceProtocolTransferProcessStateType.TERMINATED,
			OLD_DATE
		);
		await seedTransfer("recent-completed", DataspaceProtocolTransferProcessStateType.COMPLETED);

		await runCleanup(createService(DAY_MS));

		expect(await transferProcessStorage.get("old-completed")).toBeUndefined();
		expect(await transferProcessStorage.get("old-terminated")).toBeUndefined();
		expect(await transferProcessStorage.get("recent-completed")).toBeDefined();
	});

	test("cleanup keeps non-terminal transfers regardless of age", async () => {
		await seedTransfer(
			"old-requested",
			DataspaceProtocolTransferProcessStateType.REQUESTED,
			OLD_DATE
		);
		await seedTransfer("old-started", DataspaceProtocolTransferProcessStateType.STARTED, OLD_DATE);
		await seedTransfer(
			"old-suspended",
			DataspaceProtocolTransferProcessStateType.SUSPENDED,
			OLD_DATE
		);

		await runCleanup(createService(DAY_MS));

		expect(await transferProcessStorage.get("old-requested")).toBeDefined();
		expect(await transferProcessStorage.get("old-started")).toBeDefined();
		expect(await transferProcessStorage.get("old-suspended")).toBeDefined();
	});

	test("cleanup queries only ids and removes them in one batch", async () => {
		await seedTransfer("batch-1", DataspaceProtocolTransferProcessStateType.COMPLETED, OLD_DATE);
		await seedTransfer("batch-2", DataspaceProtocolTransferProcessStateType.TERMINATED, OLD_DATE);
		const querySpy = vi.spyOn(transferProcessStorage, "query");
		const removeBatchSpy = vi.spyOn(transferProcessStorage, "removeBatch");

		await runCleanup(createService(DAY_MS));

		expect(querySpy).toHaveBeenCalledWith(expect.anything(), undefined, ["id"], undefined);
		expect(removeBatchSpy).toHaveBeenCalledTimes(1);
		expect(removeBatchSpy.mock.calls[0][0]).toEqual(expect.arrayContaining(["batch-1", "batch-2"]));
	});

	test("a retention of -1 does not register the retention task", async () => {
		const addTask = vi.fn().mockResolvedValue(undefined);
		const removeTask = vi.fn().mockResolvedValue(undefined);
		ComponentFactory.register("test-task-scheduler", () => ({
			className: () => "MockTaskScheduler",
			addTask,
			removeTask
		}));
		Factory.createFactory("engine-core").register("engine", () => createMockEngineCore());

		try {
			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				taskSchedulerComponentType: "test-task-scheduler",
				config: { ...DEFAULT_SERVICE_OPTIONS.config, retainTerminalTransfersForMs: -1 }
			});
			await service.start();
			expect(addTask).not.toHaveBeenCalledWith(
				"control-plane-transfer-retention",
				expect.anything(),
				expect.anything()
			);

			await service.stop();
			expect(removeTask).not.toHaveBeenCalledWith("control-plane-transfer-retention");
		} finally {
			try {
				ComponentFactory.unregister("test-task-scheduler");
				Factory.createFactory("engine-core").unregister("engine");
			} catch {
				// Ignore errors if already unregistered
			}
		}
	});

	test("start registers the retention task by default and stop removes it", async () => {
		const addTask = vi.fn().mockResolvedValue(undefined);
		const removeTask = vi.fn().mockResolvedValue(undefined);
		ComponentFactory.register("test-task-scheduler", () => ({
			className: () => "MockTaskScheduler",
			addTask,
			removeTask
		}));
		Factory.createFactory("engine-core").register("engine", () => createMockEngineCore());

		try {
			// Older than the 30 day default retention.
			await seedTransfer(
				"scheduled",
				DataspaceProtocolTransferProcessStateType.COMPLETED,
				new Date(0).toISOString()
			);
			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				taskSchedulerComponentType: "test-task-scheduler"
			});
			await service.start();

			const retentionCall = addTask.mock.calls.find(
				call => call[0] === "control-plane-transfer-retention"
			);
			expect(retentionCall).toBeDefined();
			await retentionCall?.[2]();
			expect(await transferProcessStorage.get("scheduled")).toBeUndefined();

			await service.stop();
			expect(removeTask).toHaveBeenCalledWith("control-plane-transfer-retention");
		} finally {
			try {
				ComponentFactory.unregister("test-task-scheduler");
				Factory.createFactory("engine-core").unregister("engine");
			} catch {
				// Ignore errors if already unregistered
			}
		}
	});
});
