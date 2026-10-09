// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { HttpContextIdKeys } from "@3sixty/api-models";
import { ContextIdKeys, ContextIdStore } from "@3sixty/context";
import { ComponentFactory, Converter, Factory, GeneralError, RandomHelper } from "@3sixty/core";
import {
	DataspaceControlPlaneMetricIds,
	TransferProcessRole,
	type DataspaceAppDataset,
	type TransferProcess,
	type TransferRetrieval
} from "@3sixty/dataspace-models";
import { MemoryEntityStorageConnector } from "@3sixty/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@3sixty/entity-storage-models";
import type { ILoggingComponent } from "@3sixty/logging-models";
import { nameof, nameofKebabCase } from "@3sixty/nameof";
import type { IRightsManagementAgreement } from "@3sixty/rights-management-models";
import { DataspaceProtocolTransferProcessStateType } from "@3sixty/standards-dataspace-protocol";
import { OdrlPolicyType } from "@3sixty/standards-w3c-odrl";
import type { ITelemetryComponent } from "@3sixty/telemetry-models";
import { DataspaceControlPlaneService } from "../src/dataspaceControlPlaneService.js";
import { MockFederatedCatalogueComponent } from "./mocks/mockFederatedCatalogue.js";
import { MockPolicyAdministrationPointComponent } from "./mocks/mockPolicyAdministrationPoint.js";
import { MockPolicyNegotiationAdminPointComponent } from "./mocks/mockPolicyNegotiationAdminPoint.js";
import { MockPolicyNegotiationPointComponent } from "./mocks/mockPolicyNegotiationPoint.js";
import {
	createMockEngineCore,
	createMockTaskScheduler,
	createMockTrustComponent,
	createMultiTenantPlatformComponent,
	createSingleTenantPlatformComponent,
	DEFAULT_SERVICE_OPTIONS,
	setupTestEnv
} from "./setupTestEnv.js";

const HOUR_MS = 60 * 60 * 1000;
const OLD_DATE = new Date(0).toISOString();

/**
 * Test suite for the unused agreement sweep.
 */
describe("DataspaceControlPlaneService unused agreement sweep", () => {
	let transferProcessStorage: MemoryEntityStorageConnector<TransferProcess>;
	let dataspaceAppDatasetStorage: MemoryEntityStorageConnector<DataspaceAppDataset>;
	let transferRetrievalStorage: MemoryEntityStorageConnector<TransferRetrieval>;
	let mockPap: MockPolicyAdministrationPointComponent;
	let logSpy: ReturnType<typeof vi.fn>;
	let metricValues: { id: string; value: unknown }[];

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

		// Start from an empty PAP so the sweep only sees the agreements each test seeds.
		mockPap = new MockPolicyAdministrationPointComponent();
		mockPap.clearAgreements();
		ComponentFactory.register("test-pap", () => mockPap);
		ComponentFactory.register("test-pnp", () => new MockPolicyNegotiationPointComponent());
		ComponentFactory.register("test-fedcat", () => new MockFederatedCatalogueComponent());
		ComponentFactory.register(
			"test-pnap-admin",
			() => new MockPolicyNegotiationAdminPointComponent()
		);
		ComponentFactory.register("test-trust", () => createMockTrustComponent());
		ComponentFactory.register("task-scheduler", () => createMockTaskScheduler());
		ComponentFactory.register("platform", () => createSingleTenantPlatformComponent());

		logSpy = vi.fn().mockResolvedValue(undefined);
		ComponentFactory.register(
			"test-logging",
			() => ({ className: () => "MockLogging", log: logSpy }) as unknown as ILoggingComponent
		);

		metricValues = [];
		ComponentFactory.register(
			"test-telemetry",
			() =>
				({
					className: () => "MockTelemetry",
					createMetric: async () => {},
					addMetricValue: async (id: string, value: unknown) => {
						metricValues.push({ id, value });
						return "v";
					}
				}) as unknown as ITelemetryComponent
		);

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
			ComponentFactory.unregister("test-logging");
			ComponentFactory.unregister("test-telemetry");
		} catch {
			// Ignore errors if already unregistered
		}

		await transferProcessStorage.teardown();
		await dataspaceAppDatasetStorage.teardown();
		await transferRetrievalStorage.teardown();

		vi.restoreAllMocks();
	});

	/**
	 * Seed an agreement into the mock PAP.
	 * @param id The agreement id.
	 * @param dates Optional PAP lifecycle timestamps.
	 * @param dates.dateCreated The creation timestamp.
	 * @param dates.dateModified The modification timestamp.
	 */
	function seedAgreement(
		id: string,
		dates?: { dateCreated?: string; dateModified?: string }
	): void {
		mockPap.addAgreement({
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			"@id": id,
			assigner: "did:iota:provider-node-xyz",
			assignee: "did:iota:consumer-node-abc",
			target: "urn:uuid:dataset-sweep",
			permission: [{ action: "read" }],
			...dates
		} as unknown as IRightsManagementAgreement);
	}

	/**
	 * Seed a transfer referencing an agreement.
	 * @param consumerPid The consumerPid (indexed).
	 * @param agreementId The referenced agreement id.
	 * @param state The transfer state.
	 * @param dateModified The last-modified timestamp (defaults to 1970).
	 */
	async function seedTransfer(
		consumerPid: string,
		agreementId: string,
		state: DataspaceProtocolTransferProcessStateType,
		dateModified: string = OLD_DATE
	): Promise<void> {
		await transferProcessStorage.set({
			id: Converter.bytesToHex(RandomHelper.generate(32)),
			consumerPid,
			providerPid: `provider-pid-for-${consumerPid}`,
			state,
			agreementId,
			datasetId: "urn:uuid:dataset-sweep",
			consumerIdentity: "did:iota:consumer",
			providerIdentity: "did:iota:provider",
			localRole: TransferProcessRole.Provider,
			offerId: "offer-sweep",
			format: "HttpData-PULL",
			organizationIdentity: "did:iota:provider-node-xyz",
			dateCreated: OLD_DATE,
			dateModified
		});
	}

	/**
	 * Construct a service with the sweep configured.
	 * @param config Sweep configuration overrides.
	 * @param config.agreementUnusedThresholdMs The unused window.
	 * @param config.agreementSweepIntervalMs The sweep interval.
	 * @returns The service.
	 */
	function createSweepService(config?: {
		agreementUnusedThresholdMs?: number;
		agreementSweepIntervalMs?: number;
	}): DataspaceControlPlaneService {
		return new DataspaceControlPlaneService({
			...DEFAULT_SERVICE_OPTIONS,
			loggingComponentType: "test-logging",
			telemetryComponentType: "test-telemetry",
			config: {
				...DEFAULT_SERVICE_OPTIONS.config,
				agreementUnusedThresholdMs: HOUR_MS,
				...config
			}
		});
	}

	/**
	 * Run the private sweep.
	 * @param service The service.
	 */
	async function runSweep(service: DataspaceControlPlaneService): Promise<void> {
		await (
			service as unknown as { sweepUnusedAgreements(): Promise<void> }
		).sweepUnusedAgreements();
	}

	/**
	 * List the agreement ids currently in the mock PAP.
	 * @returns The agreement ids.
	 */
	async function papAgreementIds(): Promise<string[]> {
		const { policies } = await mockPap.query({ type: OdrlPolicyType.Agreement });
		return policies.map(p => p["@id"]);
	}

	/**
	 * Count captured increments for a metric id.
	 * @param id The metric id.
	 * @returns The number of increments.
	 */
	function metricCount(id: string): number {
		return metricValues.filter(v => v.id === id).length;
	}

	test("start does not register the sweep task when the unused threshold is unset", async () => {
		const addTask = vi.fn().mockResolvedValue(undefined);
		const removeTask = vi.fn().mockResolvedValue(undefined);
		ComponentFactory.register("test-task-scheduler", () => ({
			className: () => "MockTaskScheduler",
			addTask,
			removeTask,
			tasksInfo: vi.fn()
		}));
		Factory.createFactory("engine-core").register("engine", () => createMockEngineCore());

		try {
			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				taskSchedulerComponentType: "test-task-scheduler"
			});
			await service.start();
			expect(addTask).toHaveBeenCalledTimes(4);
			expect(addTask).not.toHaveBeenCalledWith(
				"control-plane-agreement-sweep",
				expect.anything(),
				expect.anything()
			);
			await service.stop();
			expect(removeTask).toHaveBeenCalledTimes(4);

			addTask.mockClear();
			const zeroService = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				taskSchedulerComponentType: "test-task-scheduler",
				config: { ...DEFAULT_SERVICE_OPTIONS.config, agreementUnusedThresholdMs: 0 }
			});
			await zeroService.start();
			expect(addTask).not.toHaveBeenCalledWith(
				"control-plane-agreement-sweep",
				expect.anything(),
				expect.anything()
			);
			await zeroService.stop();
		} finally {
			try {
				ComponentFactory.unregister("test-task-scheduler");
				Factory.createFactory("engine-core").unregister("engine");
			} catch {
				// Ignore errors if already unregistered
			}
		}
	});

	test("start registers the sweep task with the configured interval and stop removes it", async () => {
		const addTask = vi.fn().mockResolvedValue(undefined);
		const removeTask = vi.fn().mockResolvedValue(undefined);
		ComponentFactory.register("test-task-scheduler", () => ({
			className: () => "MockTaskScheduler",
			addTask,
			removeTask,
			tasksInfo: vi.fn()
		}));
		Factory.createFactory("engine-core").register("engine", () => createMockEngineCore());

		try {
			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				taskSchedulerComponentType: "test-task-scheduler",
				config: {
					...DEFAULT_SERVICE_OPTIONS.config,
					agreementUnusedThresholdMs: HOUR_MS,
					agreementSweepIntervalMs: 90000
				}
			});
			await service.start();
			// 90000ms rounds to 2 whole minutes (the scheduler has minute granularity).
			expect(addTask).toHaveBeenCalledWith(
				"control-plane-agreement-sweep",
				[expect.objectContaining({ intervalMinutes: 2 })],
				expect.any(Function)
			);
			await service.stop();
			expect(removeTask).toHaveBeenCalledWith("control-plane-agreement-sweep");

			// A non-positive interval falls back to the one-hour default.
			addTask.mockClear();
			const zeroIntervalService = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				taskSchedulerComponentType: "test-task-scheduler",
				config: {
					...DEFAULT_SERVICE_OPTIONS.config,
					agreementUnusedThresholdMs: HOUR_MS,
					agreementSweepIntervalMs: 0
				}
			});
			await zeroIntervalService.start();
			expect(addTask).toHaveBeenCalledWith(
				"control-plane-agreement-sweep",
				[expect.objectContaining({ intervalMinutes: 60 })],
				expect.any(Function)
			);
			await zeroIntervalService.stop();
		} finally {
			try {
				ComponentFactory.unregister("test-task-scheduler");
				Factory.createFactory("engine-core").unregister("engine");
			} catch {
				// Ignore errors if already unregistered
			}
		}
	});

	test("the registered task callback runs the sweep", async () => {
		const addTask = vi.fn().mockResolvedValue(undefined);
		ComponentFactory.register("test-task-scheduler", () => ({
			className: () => "MockTaskScheduler",
			addTask,
			removeTask: vi.fn().mockResolvedValue(undefined),
			tasksInfo: vi.fn()
		}));
		Factory.createFactory("engine-core").register("engine", () => createMockEngineCore());

		try {
			seedAgreement("agreement-callback", { dateCreated: OLD_DATE });
			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				loggingComponentType: "test-logging",
				taskSchedulerComponentType: "test-task-scheduler",
				config: {
					...DEFAULT_SERVICE_OPTIONS.config,
					agreementUnusedThresholdMs: HOUR_MS
				}
			});
			await service.start();

			const sweepCall = addTask.mock.calls.find(
				call => call[0] === "control-plane-agreement-sweep"
			);
			expect(sweepCall).toBeDefined();
			await sweepCall?.[2]();

			expect(logSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "agreementSwept",
					data: expect.objectContaining({
						agreementId: "agreement-callback",
						reason: "neverReferenced"
					})
				})
			);
		} finally {
			try {
				ComponentFactory.unregister("test-task-scheduler");
				Factory.createFactory("engine-core").unregister("engine");
			} catch {
				// Ignore errors if already unregistered
			}
		}
	});

	test("removes an unused agreement whose transfers are all terminal and stale", async () => {
		seedAgreement("agreement-unused", { dateCreated: OLD_DATE });
		await seedTransfer(
			"urn:uuid:sweep-unused-001",
			"agreement-unused",
			DataspaceProtocolTransferProcessStateType.COMPLETED
		);
		await seedTransfer(
			"urn:uuid:sweep-unused-002",
			"agreement-unused",
			DataspaceProtocolTransferProcessStateType.TERMINATED
		);

		const service = createSweepService();
		await runSweep(service);

		expect(await papAgreementIds()).not.toContain("agreement-unused");
		expect(logSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "agreementSwept",
				data: expect.objectContaining({ agreementId: "agreement-unused", reason: "unused" })
			})
		);
	});

	test("removes a never-referenced agreement older than the threshold", async () => {
		seedAgreement("agreement-orphan", { dateCreated: OLD_DATE });

		const service = createSweepService();
		await runSweep(service);

		expect(await papAgreementIds()).not.toContain("agreement-orphan");
		expect(logSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "agreementSwept",
				data: expect.objectContaining({
					agreementId: "agreement-orphan",
					reason: "neverReferenced"
				})
			})
		);
	});

	test("keeps agreements referenced by a live transfer in any live state", async () => {
		const liveStates = [
			DataspaceProtocolTransferProcessStateType.REQUESTED,
			DataspaceProtocolTransferProcessStateType.STARTED,
			DataspaceProtocolTransferProcessStateType.SUSPENDED
		];
		for (let i = 0; i < liveStates.length; i++) {
			seedAgreement(`agreement-live-${i}`, { dateCreated: OLD_DATE });
			await seedTransfer(`urn:uuid:sweep-live-00${i}`, `agreement-live-${i}`, liveStates[i]);
		}

		const service = createSweepService();
		await runSweep(service);

		expect(await papAgreementIds()).toEqual(
			expect.arrayContaining(["agreement-live-0", "agreement-live-1", "agreement-live-2"])
		);
		expect(logSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "agreementSweepSkipped",
				data: expect.objectContaining({
					agreementId: "agreement-live-0",
					reason: "activeTransfer"
				})
			})
		);
	});

	test("keeps an agreement whose terminal transfer changed within the window", async () => {
		seedAgreement("agreement-recent-transfer", { dateCreated: OLD_DATE });
		await seedTransfer(
			"urn:uuid:sweep-recent-001",
			"agreement-recent-transfer",
			DataspaceProtocolTransferProcessStateType.COMPLETED,
			new Date().toISOString()
		);

		const service = createSweepService();
		await runSweep(service);

		expect(await papAgreementIds()).toContain("agreement-recent-transfer");
		expect(logSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "agreementSweepSkipped",
				data: expect.objectContaining({
					agreementId: "agreement-recent-transfer",
					reason: "recentActivity"
				})
			})
		);
	});

	test("keeps a referenced agreement whose own record was recently modified", async () => {
		seedAgreement("agreement-recent-update", {
			dateCreated: OLD_DATE,
			dateModified: new Date().toISOString()
		});
		await seedTransfer(
			"urn:uuid:sweep-updated-001",
			"agreement-recent-update",
			DataspaceProtocolTransferProcessStateType.COMPLETED
		);

		const service = createSweepService();
		await runSweep(service);

		expect(await papAgreementIds()).toContain("agreement-recent-update");
	});

	test("keeps an agreement with a recent orphaned retrieval row", async () => {
		seedAgreement("agreement-orphan-retrieval", { dateCreated: OLD_DATE });
		await seedTransfer(
			"urn:uuid:sweep-retrieval-001",
			"agreement-orphan-retrieval",
			DataspaceProtocolTransferProcessStateType.COMPLETED
		);
		await transferRetrievalStorage.set({
			consumerPid: "urn:uuid:sweep-retrieval-001",
			dateFirstRetrieved: OLD_DATE,
			dateLastRetrieved: new Date().toISOString()
		});

		const service = createSweepService();
		await runSweep(service);

		expect(await papAgreementIds()).toContain("agreement-orphan-retrieval");
		expect(logSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "agreementSweepSkipped",
				data: expect.objectContaining({
					agreementId: "agreement-orphan-retrieval",
					reason: "recentActivity"
				})
			})
		);
	});

	test("keeps a never-referenced agreement younger than the threshold", async () => {
		seedAgreement("agreement-fresh", { dateCreated: new Date().toISOString() });

		const service = createSweepService();
		await runSweep(service);

		expect(await papAgreementIds()).toContain("agreement-fresh");
		expect(logSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "agreementSweepSkipped",
				data: expect.objectContaining({
					agreementId: "agreement-fresh",
					reason: "recentAgreement"
				})
			})
		);
	});

	test("keeps a never-referenced agreement with no timestamps", async () => {
		seedAgreement("agreement-no-dates");

		const service = createSweepService();
		await runSweep(service);

		expect(await papAgreementIds()).toContain("agreement-no-dates");
		expect(logSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "agreementSweepSkipped",
				data: expect.objectContaining({
					agreementId: "agreement-no-dates",
					reason: "noTimestamp"
				})
			})
		);
	});

	test("rerunning the sweep is idempotent", async () => {
		seedAgreement("agreement-rerun", { dateCreated: OLD_DATE });

		const service = createSweepService();
		await runSweep(service);
		await runSweep(service);

		expect(await papAgreementIds()).not.toContain("agreement-rerun");
		expect(logSpy.mock.calls.filter(call => call[0]?.message === "agreementSwept")).toHaveLength(1);
		expect(metricCount(DataspaceControlPlaneMetricIds.AgreementsSwept)).toBe(1);
	});

	test("logs and continues when a candidate removal fails", async () => {
		seedAgreement("agreement-remove-fails", { dateCreated: OLD_DATE });
		// Real connectors surface backend failures from remove() as GeneralError (e.g. the DynamoDB
		// connector's "tableDoesNotExist"); the stub mirrors that contract.
		mockPap.remove = vi
			.fn()
			.mockRejectedValue(
				new GeneralError(MockPolicyAdministrationPointComponent.CLASS_NAME, "removeFailed")
			);

		const service = createSweepService();
		await expect(runSweep(service)).resolves.toBeUndefined();

		expect(logSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "agreementSweepRemoveFailed",
				data: expect.objectContaining({ agreementId: "agreement-remove-fails" })
			})
		);
		expect(metricCount(DataspaceControlPlaneMetricIds.AgreementsSwept)).toBe(0);
		expect(logSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "agreementSweepComplete",
				data: expect.objectContaining({ candidates: 1, swept: 0 })
			})
		);
	});

	test("treats a non-positive threshold as disabled", async () => {
		seedAgreement("agreement-negative", { dateCreated: OLD_DATE });

		const service = createSweepService({ agreementUnusedThresholdMs: -1 });
		await runSweep(service);

		expect(await papAgreementIds()).toContain("agreement-negative");
		expect(logSpy).not.toHaveBeenCalledWith(expect.objectContaining({ message: "agreementSwept" }));
	});

	test("pages through the PAP query when agreements exceed one page", async () => {
		// 45 agreements span two pages of the mock's 40-per-page default.
		for (let i = 0; i < 45; i++) {
			seedAgreement(`agreement-page-${i}`, { dateCreated: OLD_DATE });
		}

		const service = createSweepService();
		await runSweep(service);

		expect(await papAgreementIds()).toHaveLength(0);
		expect(metricCount(DataspaceControlPlaneMetricIds.AgreementsSwept)).toBe(45);
		expect(logSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "agreementSweepComplete",
				data: expect.objectContaining({ scanned: 45, swept: 45 })
			})
		);
	});

	test("sees a live transfer beyond the first transfer page", async () => {
		seedAgreement("agreement-deep-live", { dateCreated: OLD_DATE });
		// 40 stale terminal transfers fill the memory connector's first page; the live transfer,
		// seeded last, lands on the second page.
		for (let i = 0; i < 40; i++) {
			await seedTransfer(
				`urn:uuid:sweep-deep-${i}`,
				"agreement-deep-live",
				DataspaceProtocolTransferProcessStateType.COMPLETED
			);
		}
		await seedTransfer(
			"urn:uuid:sweep-deep-live",
			"agreement-deep-live",
			DataspaceProtocolTransferProcessStateType.STARTED
		);

		// Precondition: the live transfer must not be on the first page, or this test is vacuous.
		const firstPage = await transferProcessStorage.query();
		expect(firstPage.entities.map(e => (e as TransferProcess).consumerPid)).not.toContain(
			"urn:uuid:sweep-deep-live"
		);

		const service = createSweepService();
		await runSweep(service);

		expect(await papAgreementIds()).toContain("agreement-deep-live");
		expect(logSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "agreementSweepSkipped",
				data: expect.objectContaining({
					agreementId: "agreement-deep-live",
					reason: "activeTransfer"
				})
			})
		);
	});

	test("runs the sweep once per tenant in multi-tenant mode", async () => {
		ComponentFactory.register("platform", () =>
			createMultiTenantPlatformComponent([
				{ [ContextIdKeys.Tenant]: "did:iota:tenant-one" },
				{ [ContextIdKeys.Tenant]: "did:iota:tenant-two" }
			])
		);
		seedAgreement("agreement-tenants", { dateCreated: OLD_DATE });
		const querySpy = vi.spyOn(mockPap, "query");

		const service = createSweepService();
		await runSweep(service);

		// One PAP page per tenant proves the sweep body ran for each tenant; the first tenant
		// removes the agreement, so the second scans an empty PAP.
		expect(querySpy).toHaveBeenCalledTimes(2);
		expect(logSpy.mock.calls.filter(call => call[0]?.message === "agreementSwept")).toHaveLength(1);
		expect(await papAgreementIds()).toHaveLength(0);
	});

	test("counts a mixed scan in the swept metric and the summary log", async () => {
		seedAgreement("agreement-mix-unused", { dateCreated: OLD_DATE });
		seedAgreement("agreement-mix-live", { dateCreated: OLD_DATE });
		await seedTransfer(
			"urn:uuid:sweep-mix-001",
			"agreement-mix-live",
			DataspaceProtocolTransferProcessStateType.STARTED
		);
		seedAgreement("agreement-mix-fresh", { dateCreated: new Date().toISOString() });

		const service = createSweepService();
		await runSweep(service);

		expect(metricCount(DataspaceControlPlaneMetricIds.AgreementsSwept)).toBe(1);
		expect(logSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "agreementSweepComplete",
				data: { scanned: 3, skipped: 2, candidates: 1, swept: 1 }
			})
		);
	});
});
