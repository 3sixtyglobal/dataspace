// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ScheduledTask } from "@twin.org/background-task-scheduler";
import {
	TaskSchedulerService,
	initSchema as initSchemaTaskScheduler
} from "@twin.org/background-task-scheduler";
import {
	BackgroundTaskService,
	initSchema as initSchemaBackgroundTask,
	type BackgroundTask
} from "@twin.org/background-task-service";
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory, NotFoundError } from "@twin.org/core";
import {
	DataspaceAppDataset,
	DataspaceAppFactory,
	TransferProcess
} from "@twin.org/dataspace-models";
import { TestDataspaceDataPlaneApp } from "@twin.org/dataspace-test-app";
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import type { IRightsManagementAgreement } from "@twin.org/rights-management-models";
import {
	DataspaceProtocolDataTypes,
	DataspaceProtocolTransferProcessStateType
} from "@twin.org/standards-dataspace-protocol";
import { addAllContextsToDocumentCache } from "@twin.org/standards-ld-contexts";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
import {
	createMockPolicyAdministrationPoint,
	createMockPolicyEnforcementPoint,
	createMockTrustComponent
} from "./setupTestEnv.js";
import { DataspaceDataPlaneService } from "../src/dataspaceDataPlaneService.js";
import type { ActivityLogDetails } from "../src/entities/activityLogDetails.js";
import type { ActivityTask } from "../src/entities/activityTask.js";
import type { PushSubscription } from "../src/entities/pushSubscription.js";
import { initSchema } from "../src/schema.js";

const TEST_ORGANIZATION_IDENTITY = "did:iota:testnet:provider-node";
const DATA_CONSUMER_IDENTITY = "did:iota:testnet:consumer-node";
const TEST_DATASET_ID = "urn:dataset:pap-test-dataset";
const TEST_CONSUMER_PID = "urn:uuid:pap-consumer-pid";
const TEST_PROVIDER_PID = "urn:uuid:pap-provider-pid";
const TEST_AGREEMENT_ID = "urn:agreement:pap-test-agreement";
const TEST_OFFER_ID = "urn:offer:pap-test-offer";
const TEST_TRANSFER_TOKEN = "pap-test-transfer-token";
const PAP_COMPONENT_TYPE = "test-pap";
const TRUST_COMPONENT_TYPE = "test-trust";

function makeAgreement(
	overrides?: Partial<IRightsManagementAgreement>
): IRightsManagementAgreement {
	return {
		"@context": "http://www.w3.org/ns/odrl.jsonld",
		"@type": "Agreement",
		"@id": TEST_AGREEMENT_ID,
		assigner: TEST_ORGANIZATION_IDENTITY,
		assignee: DATA_CONSUMER_IDENTITY,
		target: TEST_DATASET_ID,
		permission: [{ action: "read" }],
		...overrides
	};
}

function createTestTransferProcess(overrides?: Partial<TransferProcess>): TransferProcess {
	const now = new Date().toISOString();
	const entity = new TransferProcess();
	entity.consumerPid = TEST_CONSUMER_PID;
	entity.id = TEST_CONSUMER_PID;
	entity.providerPid = TEST_PROVIDER_PID;
	entity.agreementId = TEST_AGREEMENT_ID;
	entity.offerId = TEST_OFFER_ID;
	entity.state = DataspaceProtocolTransferProcessStateType.STARTED;
	entity.datasetId = TEST_DATASET_ID;
	entity.consumerIdentity = DATA_CONSUMER_IDENTITY;
	entity.providerIdentity = TEST_ORGANIZATION_IDENTITY;
	entity.organizationIdentity = TEST_ORGANIZATION_IDENTITY;
	entity.format = "HttpData-PULL";
	entity.dateCreated = now;
	entity.dateModified = now;
	if (overrides) {
		Object.assign(entity, overrides);
	}
	return entity;
}

describe("DataspaceDataPlaneService PAP Integration Tests", () => {
	let transferProcessStorage: MemoryEntityStorageConnector<TransferProcess>;
	let pushSubscriptionStorage: MemoryEntityStorageConnector<PushSubscription>;
	let activityLogStorage: MemoryEntityStorageConnector<ActivityLogDetails>;
	let activityTaskStorage: MemoryEntityStorageConnector<ActivityTask>;
	let backgroundTaskStorage: MemoryEntityStorageConnector<BackgroundTask>;

	beforeAll(async () => {
		initSchema();
		initSchemaBackgroundTask();
		initSchemaTaskScheduler();
		DataspaceProtocolDataTypes.registerTypes();
		await addAllContextsToDocumentCache();

		EntitySchemaFactory.register(nameof<TransferProcess>(), () =>
			EntitySchemaHelper.getSchema(TransferProcess)
		);
		EntitySchemaFactory.register(nameof<DataspaceAppDataset>(), () =>
			EntitySchemaHelper.getSchema(DataspaceAppDataset)
		);

		ContextIdStore.getContextIds = vi.fn().mockResolvedValue({
			[ContextIdKeys.Node]: TEST_ORGANIZATION_IDENTITY
		});
	});

	beforeEach(async () => {
		transferProcessStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>(),
			config: { storageKey: "transfer-process" }
		});
		activityLogStorage = new MemoryEntityStorageConnector<ActivityLogDetails>({
			entitySchema: nameof<ActivityLogDetails>(),
			config: { storageKey: "activity-log-details" }
		});
		activityTaskStorage = new MemoryEntityStorageConnector<ActivityTask>({
			entitySchema: nameof<ActivityTask>(),
			config: { storageKey: "activity-task" }
		});
		backgroundTaskStorage = new MemoryEntityStorageConnector<BackgroundTask>({
			entitySchema: nameof<BackgroundTask>(),
			config: { storageKey: "background-task" }
		});
		pushSubscriptionStorage = new MemoryEntityStorageConnector<PushSubscription>({
			entitySchema: nameof<PushSubscription>(),
			config: { storageKey: "push-subscription" }
		});

		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferProcess>(),
			() => transferProcessStorage
		);

		const dataspaceAppDatasetStorage = new MemoryEntityStorageConnector<DataspaceAppDataset>({
			entitySchema: nameof<DataspaceAppDataset>(),
			config: { storageKey: "dataspace-app-dataset" }
		});
		EntityStorageConnectorFactory.register(
			nameofKebabCase<DataspaceAppDataset>(),
			() => dataspaceAppDatasetStorage
		);

		EntityStorageConnectorFactory.register(
			nameofKebabCase<PushSubscription>(),
			() => pushSubscriptionStorage
		);
		EntityStorageConnectorFactory.register(
			nameofKebabCase<ActivityLogDetails>(),
			() => activityLogStorage
		);
		EntityStorageConnectorFactory.register(
			nameofKebabCase<ActivityTask>(),
			() => activityTaskStorage
		);
		EntityStorageConnectorFactory.register("background-task", () => backgroundTaskStorage);

		const scheduledTaskStorage = new MemoryEntityStorageConnector<ScheduledTask>({
			entitySchema: "ScheduledTask",
			config: { storageKey: "scheduled-task" }
		});
		EntityStorageConnectorFactory.register("scheduled-task", () => scheduledTaskStorage);

		ComponentFactory.register(TRUST_COMPONENT_TYPE, () =>
			createMockTrustComponent(TEST_TRANSFER_TOKEN, DATA_CONSUMER_IDENTITY)
		);

		const backgroundTaskService = new BackgroundTaskService({
			backgroundTaskEntityStorageType: "background-task"
		});
		ComponentFactory.register("background-task", () => backgroundTaskService);

		const taskScheduler = new TaskSchedulerService();
		ComponentFactory.register("task-scheduler", () => taskScheduler);

		ComponentFactory.register("policy-enforcement-point-service", () =>
			createMockPolicyEnforcementPoint()
		);

		ComponentFactory.register("platform", () => ({
			className: () => "MockPlatformComponent",
			isMultiTenant: () => false,
			execute: async (method: () => Promise<void>) => {
				await method();
			},
			getLocalOriginContext: async () => undefined
		}));

		DataspaceAppFactory.register("test-app", () => new TestDataspaceDataPlaneApp());
	});

	afterEach(() => {
		for (const key of [
			nameofKebabCase<TransferProcess>(),
			nameofKebabCase<DataspaceAppDataset>(),
			nameofKebabCase<PushSubscription>(),
			nameofKebabCase<ActivityLogDetails>(),
			nameofKebabCase<ActivityTask>(),
			"background-task",
			"scheduled-task"
		]) {
			try {
				EntityStorageConnectorFactory.unregister(key);
			} catch {}
		}
		for (const key of [
			TRUST_COMPONENT_TYPE,
			PAP_COMPONENT_TYPE,
			"background-task",
			"task-scheduler",
			"policy-enforcement-point-service",
			"platform"
		]) {
			try {
				ComponentFactory.unregister(key);
			} catch {}
		}
		for (const name of DataspaceAppFactory.names()) {
			DataspaceAppFactory.unregister(name);
		}
	});

	afterAll(() => {
		ComponentFactory.clear();
		EntityStorageConnectorFactory.clear();
	});

	// ============================================================================
	// Pull path — validateTransfer
	// ============================================================================

	describe("validateTransfer() — PAP integration", () => {
		test("uses fresh agreement from PAP instead of transfer snapshot", async () => {
			const mockPap = createMockPolicyAdministrationPoint();
			const freshAgreement = makeAgreement({
				permission: [{ action: "read" }, { action: "use" }]
			});
			mockPap.addAgreement(freshAgreement);
			ComponentFactory.register(PAP_COMPONENT_TYPE, () => mockPap);

			await transferProcessStorage.set(createTestTransferProcess());

			const service = new DataspaceDataPlaneService({
				trustComponentType: TRUST_COMPONENT_TYPE,
				papComponentType: PAP_COMPONENT_TYPE,
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pushSubscriptionEntityStorageType: nameofKebabCase<PushSubscription>()
			});

			const context = await service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN);

			expect(context.agreement["@id"]).toBe(TEST_AGREEMENT_ID);
			// Fresh agreement has two permissions; snapshot had one.
			expect(context.agreement.permission).toHaveLength(2);
		});

		test("denies access when agreement is removed from PAP", async () => {
			const mockPap = createMockPolicyAdministrationPoint();
			// Do NOT add the agreement — simulates revocation
			ComponentFactory.register(PAP_COMPONENT_TYPE, () => mockPap);

			await transferProcessStorage.set(createTestTransferProcess());

			const service = new DataspaceDataPlaneService({
				trustComponentType: TRUST_COMPONENT_TYPE,
				papComponentType: PAP_COMPONENT_TYPE,
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pushSubscriptionEntityStorageType: nameofKebabCase<PushSubscription>()
			});

			await expect(
				service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN)
			).rejects.toThrow(NotFoundError);
		});

		test("returns updated permissions after PAP agreement is modified", async () => {
			const mockPap = createMockPolicyAdministrationPoint();
			mockPap.addAgreement(makeAgreement({ permission: [{ action: "read" }] }));
			ComponentFactory.register(PAP_COMPONENT_TYPE, () => mockPap);

			await transferProcessStorage.set(createTestTransferProcess());

			const service = new DataspaceDataPlaneService({
				trustComponentType: TRUST_COMPONENT_TYPE,
				papComponentType: PAP_COMPONENT_TYPE,
				// Use an extremely long TTL so the cache does not expire between calls
				config: { agreementCacheTtlMs: 60_000 },
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pushSubscriptionEntityStorageType: nameofKebabCase<PushSubscription>()
			});

			const ctx1 = await service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN);
			expect(ctx1.agreement.permission).toHaveLength(1);

			// Simulate PAP update and re-create the service so the fresh instance re-fetches.
			mockPap.removeAgreement(TEST_AGREEMENT_ID);
			mockPap.addAgreement(makeAgreement({ permission: [{ action: "read" }, { action: "use" }] }));

			// A fresh service has an empty agreement cache and fetches from PAP.
			const serviceNoCache = new DataspaceDataPlaneService({
				trustComponentType: TRUST_COMPONENT_TYPE,
				papComponentType: PAP_COMPONENT_TYPE,
				config: { agreementCacheTtlMs: 60_000 },
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pushSubscriptionEntityStorageType: nameofKebabCase<PushSubscription>()
			});
			const ctx2 = await serviceNoCache.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN);
			expect(ctx2.agreement.permission).toHaveLength(2);
		});

		test("cache hit path: getAgreement is only called once within TTL", async () => {
			const mockPap = createMockPolicyAdministrationPoint();
			mockPap.addAgreement(makeAgreement());
			ComponentFactory.register(PAP_COMPONENT_TYPE, () => mockPap);

			await transferProcessStorage.set(createTestTransferProcess());

			const getAgreementSpy = vi.spyOn(mockPap, "getAgreement");

			const service = new DataspaceDataPlaneService({
				trustComponentType: TRUST_COMPONENT_TYPE,
				papComponentType: PAP_COMPONENT_TYPE,
				config: { agreementCacheTtlMs: 60_000 },
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pushSubscriptionEntityStorageType: nameofKebabCase<PushSubscription>()
			});

			await service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN);
			await service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN);
			await service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN);

			expect(getAgreementSpy).toHaveBeenCalledTimes(1);
		});

		test("TTL=0 disables cache and re-fetches agreement from PAP", async () => {
			const mockPap = createMockPolicyAdministrationPoint();
			mockPap.addAgreement(makeAgreement());
			ComponentFactory.register(PAP_COMPONENT_TYPE, () => mockPap);

			await transferProcessStorage.set(createTestTransferProcess());

			const getAgreementSpy = vi.spyOn(mockPap, "getAgreement");

			const service = new DataspaceDataPlaneService({
				trustComponentType: TRUST_COMPONENT_TYPE,
				papComponentType: PAP_COMPONENT_TYPE,
				config: { agreementCacheTtlMs: 0 },
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pushSubscriptionEntityStorageType: nameofKebabCase<PushSubscription>()
			});

			await service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN);
			await service.validateTransfer(TEST_CONSUMER_PID, TEST_TRANSFER_TOKEN);

			expect(getAgreementSpy).toHaveBeenCalledTimes(2);
		});

		test("throws when no PAP is registered", async () => {
			await transferProcessStorage.set(createTestTransferProcess());

			expect(
				() =>
					new DataspaceDataPlaneService({
						trustComponentType: TRUST_COMPONENT_TYPE,
						// papComponentType deliberately omitted (no "policy-administration-point" in factory)
						transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
						pushSubscriptionEntityStorageType: nameofKebabCase<PushSubscription>()
					})
			).toThrowError("factory.noGet");
		});
	});

	// ============================================================================
	// Push outbox path — processOutboxActivity
	// ============================================================================

	describe("processOutboxActivity() — PAP integration", () => {
		test("denies outbound push when agreement is removed from PAP", async () => {
			const mockPap = createMockPolicyAdministrationPoint();
			// Do NOT add agreement — simulates revocation
			ComponentFactory.register(PAP_COMPONENT_TYPE, () => mockPap);

			await transferProcessStorage.set(createTestTransferProcess());
			await pushSubscriptionStorage.set({
				consumerPid: TEST_CONSUMER_PID,
				providerPid: TEST_PROVIDER_PID,
				followActivityId: "urn:x-follow:pap-test",
				datasetId: TEST_DATASET_ID,
				consumerEndpoint: "https://consumer.example.com/inbox",
				paused: false,
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			});

			const service = new DataspaceDataPlaneService({
				trustComponentType: TRUST_COMPONENT_TYPE,
				papComponentType: PAP_COMPONENT_TYPE,
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pushSubscriptionEntityStorageType: nameofKebabCase<PushSubscription>()
			});

			const activity: IActivityStreamsActivity = {
				type: "Create",
				to: TEST_CONSUMER_PID,
				object: { "@type": "SomeEntity", "@id": "urn:x:1" }
			} as unknown as IActivityStreamsActivity;

			await expect(service.processOutboxActivity(activity)).rejects.toThrow(NotFoundError);

			// No task should be scheduled when the agreement is revoked
			const tasks = await backgroundTaskStorage.query();
			expect(tasks.entities).toHaveLength(0);
		});
	});

	// ============================================================================
	// Inbound push path — notifyActivity → enforceInboxPolicy
	// ============================================================================

	describe("notifyActivity() — PAP integration (enforceInboxPolicy)", () => {
		test("denies inbound push activity when agreement is removed from PAP", async () => {
			const mockPap = createMockPolicyAdministrationPoint();
			// Do NOT add agreement — simulates revocation before first access
			ComponentFactory.register(PAP_COMPONENT_TYPE, () => mockPap);

			await transferProcessStorage.set(createTestTransferProcess());

			const service = new DataspaceDataPlaneService({
				trustComponentType: TRUST_COMPONENT_TYPE,
				papComponentType: PAP_COMPONENT_TYPE,
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
				pushSubscriptionEntityStorageType: nameofKebabCase<PushSubscription>()
			});

			// The PAP check (enforceInboxPolicy) runs before Activity Streams schema validation,
			// so a revoked agreement throws NotFoundError regardless of the activity's payload shape.
			// generator matches consumerPid so the data plane resolves the correct transfer.
			const activity: IActivityStreamsActivity = {
				generator: TEST_CONSUMER_PID,
				type: "Create",
				object: { type: "SomeEntity" }
			} as unknown as IActivityStreamsActivity;

			await expect(service.notifyActivity(activity, TEST_TRANSFER_TOKEN)).rejects.toThrow(
				NotFoundError
			);
		});
	});
});
