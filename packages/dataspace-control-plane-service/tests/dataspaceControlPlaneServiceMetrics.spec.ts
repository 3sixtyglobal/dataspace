// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory, Factory } from "@twin.org/core";
import {
	DataspaceAppFactory,
	DataspaceControlPlaneMetricIds,
	DataspaceControlPlaneMetrics,
	type DataspaceAppDataset,
	type TransferProcess
} from "@twin.org/dataspace-models";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import { DataspaceProtocolContexts } from "@twin.org/standards-dataspace-protocol";
import {
	MetricType,
	type ITelemetryComponent,
	type ITelemetryMetric
} from "@twin.org/telemetry-models";
import { DataspaceControlPlaneService } from "../src/dataspaceControlPlaneService.js";
import { MockFederatedCatalogueComponent } from "./mocks/mockFederatedCatalogue.js";
import { MockPolicyAdministrationPointComponent } from "./mocks/mockPolicyAdministrationPoint.js";
import { MockPolicyNegotiationAdminPointComponent } from "./mocks/mockPolicyNegotiationAdminPoint.js";
import { MockPolicyNegotiationPointComponent } from "./mocks/mockPolicyNegotiationPoint.js";
import { createMockEngineCore, createMockTrustComponent, setupTestEnv } from "./setupTestEnv.js";

const TEST_APP_ID = "https://twin.example.org/app1";

interface MetricValueEntry {
	id: string;
	value: "inc" | "dec" | number;
	customData?: { [key: string]: unknown };
}

/**
 * Build an in-memory telemetry component that records created metrics and metric values.
 * @returns The component plus the captured created/values arrays.
 */
function makeMockTelemetry(): {
	component: ITelemetryComponent;
	created: ITelemetryMetric[];
	values: MetricValueEntry[];
} {
	const created: ITelemetryMetric[] = [];
	const values: MetricValueEntry[] = [];
	const component: ITelemetryComponent = {
		className: () => "MockTelemetry",
		start: async () => {},
		stop: async () => {},
		createMetric: async m => {
			created.push({ ...m });
		},
		getMetric: async () => ({ metric: {} as never, value: {} as never }),
		updateMetric: async () => {},
		addMetricValue: async (id, value, customData) => {
			values.push({ id, value, customData });
			return "v";
		},
		getMetricValue: async (id, valueId) => ({
			id: valueId,
			metricId: id,
			value: 0,
			ts: Date.now()
		}),
		removeMetric: async () => {},
		query: async () => ({ entities: [] }),
		queryValues: async () => ({ metric: {} as never, entities: [] })
	};
	return { component, created, values };
}

/**
 * Build a minimal valid IDataspaceProtocolDataset payload.
 * @param datasetId The DCAT @id for the dataset.
 * @returns A minimal app dataset.
 */
function buildDataset(datasetId: string): unknown {
	return {
		"@context": [DataspaceProtocolContexts.JsonLdContext],
		"@id": datasetId,
		"@type": "Dataset",
		hasPolicy: [
			{
				"@id": "urn:policy:test",
				"@type": "Offer",
				permission: [{ action: "read" }]
			}
		],
		distribution: [
			{
				"@id": `${datasetId}/distribution-1`,
				"@type": "Distribution",
				accessService: datasetId,
				format: "Http-Pull-Query-Format"
			}
		]
	};
}

describe("DataspaceControlPlaneService — metrics", () => {
	let transferProcessStorage: MemoryEntityStorageConnector<TransferProcess>;
	let dataspaceAppDatasetStorage: MemoryEntityStorageConnector<DataspaceAppDataset>;

	const serviceOptions = {
		policyAdministrationPointComponentType: "test-pap",
		policyNegotiationPointComponentType: "test-pnp",
		policyNegotiationAdminPointComponentType: "test-pnap-admin",
		federatedCatalogueComponentType: "test-fedcat",
		trustComponentType: "test-trust",
		transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
		dataspaceAppDatasetEntityStorageType: nameofKebabCase<DataspaceAppDataset>(),
		telemetryComponentType: "test-telemetry"
	};

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

		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferProcess>(),
			() => transferProcessStorage
		);
		EntityStorageConnectorFactory.register(
			nameofKebabCase<DataspaceAppDataset>(),
			() => dataspaceAppDatasetStorage
		);

		ComponentFactory.register("test-pap", () => new MockPolicyAdministrationPointComponent());
		ComponentFactory.register("test-pnp", () => new MockPolicyNegotiationPointComponent());
		ComponentFactory.register("test-fedcat", () => new MockFederatedCatalogueComponent());
		ComponentFactory.register(
			"test-pnap-admin",
			() => new MockPolicyNegotiationAdminPointComponent()
		);
		ComponentFactory.register("test-trust", () => createMockTrustComponent());

		DataspaceAppFactory.register(TEST_APP_ID, () => ({
			className: () => "MockDataspaceApp",
			activitiesHandled: () => [],
			supportedQueryTypes: () => []
		}));

		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
			[ContextIdKeys.Node]: "did:iota:test-node",
			[ContextIdKeys.Tenant]: "did:iota:test-tenant",
			[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
			[ContextIdKeys.User]: "did:iota:test-user"
		});
	});

	afterEach(async () => {
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<TransferProcess>());
			EntityStorageConnectorFactory.unregister(nameofKebabCase<DataspaceAppDataset>());
			ComponentFactory.unregister("test-pap");
			ComponentFactory.unregister("test-pnp");
			ComponentFactory.unregister("test-fedcat");
			ComponentFactory.unregister("test-pnap-admin");
			ComponentFactory.unregister("test-trust");
			DataspaceAppFactory.unregister(TEST_APP_ID);
		} catch {
			// Ignore if already unregistered.
		}

		await transferProcessStorage.teardown();
		await dataspaceAppDatasetStorage.teardown();

		vi.restoreAllMocks();
	});

	test("start() registers every control plane metric with the telemetry component", async () => {
		const { component, created } = makeMockTelemetry();
		ComponentFactory.register("test-telemetry", () => component);
		Factory.createFactory("engine-core").register("engine", () => createMockEngineCore(false));

		try {
			const service = new DataspaceControlPlaneService(serviceOptions);
			await service.start();

			const createdIds = created.map(m => m.id);
			for (const metric of DataspaceControlPlaneMetrics) {
				expect(createdIds).toContain(metric.id);
			}
			expect(created.every(m => m.type === MetricType.Counter)).toBe(true);
			expect(created).toHaveLength(DataspaceControlPlaneMetrics.length);
		} finally {
			Factory.createFactory("engine-core").unregister("engine");
			ComponentFactory.unregister("test-telemetry");
		}
	});

	test("createAppDataset increments the AppDatasetsCreated counter", async () => {
		const { component, values } = makeMockTelemetry();
		ComponentFactory.register("test-telemetry", () => component);

		const service = new DataspaceControlPlaneService(serviceOptions);

		await service.createAppDataset(
			"urn:test:metrics-ds-1",
			TEST_APP_ID,
			buildDataset("https://twin.example.org/data-service-metrics") as never
		);

		expect(values).toContainEqual({
			id: DataspaceControlPlaneMetricIds.AppDatasetsCreated,
			value: "inc",
			customData: undefined
		});

		ComponentFactory.unregister("test-telemetry");
	});

	test("operations succeed when no telemetry component is configured", async () => {
		const service = new DataspaceControlPlaneService({
			...serviceOptions,
			telemetryComponentType: undefined
		});

		await service.start();
		await service.createAppDataset(
			"urn:test:metrics-ds-2",
			TEST_APP_ID,
			buildDataset("https://twin.example.org/data-service-no-telemetry") as never
		);

		const stored = await dataspaceAppDatasetStorage.get("urn:test:metrics-ds-2");
		expect(stored).toBeDefined();
	});
});
