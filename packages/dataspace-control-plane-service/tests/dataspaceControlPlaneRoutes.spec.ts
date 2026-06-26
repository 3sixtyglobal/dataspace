// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IHttpRequest, IHttpRequestContext } from "@twin.org/api-models";
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory } from "@twin.org/core";
import type { DataspaceAppDataset, TransferProcess } from "@twin.org/dataspace-models";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import {
	DataspaceProtocolContexts,
	DataspaceProtocolTransferProcessTypes
} from "@twin.org/standards-dataspace-protocol";
import { vi } from "vitest";
import { generateRestRoutesDataspaceControlPlane } from "../src/dataspaceControlPlaneRoutes.js";
import { DataspaceControlPlaneService } from "../src/dataspaceControlPlaneService.js";
import { MockFederatedCatalogueComponent } from "./mocks/mockFederatedCatalogue.js";
import { MockPolicyAdministrationPointComponent } from "./mocks/mockPolicyAdministrationPoint.js";
import { MockPolicyNegotiationPointComponent } from "./mocks/mockPolicyNegotiationPoint.js";
import { createMockTrustComponent, setupTestEnv } from "./setupTestEnv.js";

/**
 * Test suite for DataspaceControlPlane REST routes.
 */
describe("dataspaceControlPlaneRoutes", () => {
	const componentName = "dataspace-control-plane-test";
	let transferProcessStorage: MemoryEntityStorageConnector<TransferProcess>;

	beforeAll(async () => {
		await setupTestEnv();
	});

	beforeEach(() => {
		transferProcessStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>(),
			config: { storageKey: "transfer-process" }
		});

		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferProcess>(),
			() => transferProcessStorage
		);

		EntityStorageConnectorFactory.register(
			nameofKebabCase<DataspaceAppDataset>(),
			() =>
				new MemoryEntityStorageConnector<DataspaceAppDataset>({
					entitySchema: nameof<DataspaceAppDataset>(),
					config: { storageKey: "dataspace-app-dataset" }
				})
		);

		const mockPap = new MockPolicyAdministrationPointComponent();
		const mockPnp = new MockPolicyNegotiationPointComponent();
		const mockFedCat = new MockFederatedCatalogueComponent();
		ComponentFactory.register("test-pap-routes", () => mockPap);
		ComponentFactory.register("test-pnp-routes", () => mockPnp);
		ComponentFactory.register("test-fedcat-routes", () => mockFedCat);
		ComponentFactory.register("test-trust-routes", () => createMockTrustComponent());

		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
			[ContextIdKeys.Node]: "did:iota:test-node",
			[ContextIdKeys.Tenant]: "did:iota:test-tenant",
			[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
			[ContextIdKeys.User]: "did:iota:test-user"
		});

		ComponentFactory.register(
			componentName,
			() =>
				new DataspaceControlPlaneService({
					policyAdministrationPointComponentType: "test-pap-routes",
					policyNegotiationPointComponentType: "test-pnp-routes",
					federatedCatalogueComponentType: "test-fedcat-routes",
					trustComponentType: "test-trust-routes",
					transferProcessEntityStorageType: nameofKebabCase<TransferProcess>(),
					dataspaceAppDatasetEntityStorageType: nameofKebabCase<DataspaceAppDataset>()
				})
		);
	});

	afterEach(() => {
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<TransferProcess>());
			EntityStorageConnectorFactory.unregister(nameofKebabCase<DataspaceAppDataset>());
		} catch {
			// Ignore errors if already unregistered
		}
		try {
			ComponentFactory.unregister(componentName);
			ComponentFactory.unregister("test-pap-routes");
			ComponentFactory.unregister("test-pnp-routes");
			ComponentFactory.unregister("test-fedcat-routes");
			ComponentFactory.unregister("test-trust-routes");
			ComponentFactory.unregister("url-transformer");
		} catch {
			// Ignore errors if already unregistered
		}
		vi.restoreAllMocks();
	});

	afterAll(() => {
		ComponentFactory.reset();
	});

	describe("DSP Protocol Routes", () => {
		test("should only include DSP transfer process routes", () => {
			const dspRoutes = generateRestRoutesDataspaceControlPlane(
				"/api/dataspace-control-plane",
				componentName
			);

			// Resolver methods should not be present
			expect(dspRoutes.find(r => r.operationId === "resolveConsumerPid")).toBeUndefined();

			// Negotiation routes should not be present (handled by PNP)
			expect(dspRoutes.find(r => r.operationId === "negotiateAgreement")).toBeUndefined();
			expect(dspRoutes.find(r => r.operationId === "offerCallback")).toBeUndefined();
			expect(dspRoutes.find(r => r.operationId === "agreementCallback")).toBeUndefined();
			expect(dspRoutes.find(r => r.operationId === "eventCallback")).toBeUndefined();
			expect(dspRoutes.find(r => r.operationId === "getNegotiationHistory")).toBeUndefined();

			// DSP transfer process routes should be present
			expect(dspRoutes.find(r => r.operationId === "requestTransfer")).toBeDefined();
			expect(dspRoutes.find(r => r.operationId === "getTransferProcess")).toBeDefined();
			expect(dspRoutes.find(r => r.operationId === "startTransfer")).toBeDefined();
			expect(dspRoutes.find(r => r.operationId === "completeTransfer")).toBeDefined();
			expect(dspRoutes.find(r => r.operationId === "suspendTransfer")).toBeDefined();
			expect(dspRoutes.find(r => r.operationId === "terminateTransfer")).toBeDefined();

			// Version discovery route should be present
			expect(dspRoutes.find(r => r.operationId === "getProtocolVersions")).toBeDefined();
		});

		test("DSP protocol skipAuth routes require tenant context; version discovery route is fully unauthenticated", () => {
			const dspRoutes = generateRestRoutesDataspaceControlPlane(
				"/api/dataspace-control-plane",
				componentName
			);

			expect(dspRoutes).toHaveLength(12);

			// DSP protocol routes: skipAuth but tenant context still required (via tenantToken)
			const dspProtocolRoutes = dspRoutes.filter(
				r => r.skipAuth === true && r.operationId !== "getProtocolVersions"
			);
			expect(dspProtocolRoutes.length).toBeGreaterThan(0);

			for (const route of dspProtocolRoutes) {
				expect(
					route.skipTenant ?? false,
					`${route.operationId} should not set skipTenant: true (tenant context required via encrypted tenantToken)`
				).toBe(false);
			}

			// Version discovery route: fully unauthenticated per RFC 8615
			const versionRoute = dspRoutes.find(r => r.operationId === "getProtocolVersions");
			expect(versionRoute?.skipAuth).toBe(true);
			expect(versionRoute?.skipTenant).toBe(true);
		});
	});

	describe("GET /transfers/:pid - getTransferProcess endpoint", () => {
		test("should have correct route configuration", () => {
			const routes = generateRestRoutesDataspaceControlPlane(
				"/api/dataspace-control-plane",
				componentName
			);
			const getRoute = routes.find(r => r.operationId === "getTransferProcess");

			expect(getRoute).toBeDefined();
			expect(getRoute?.method).toBe("GET");
			expect(getRoute?.path).toBe("/api/dataspace-control-plane/transfers/:pid");
		});

		test("should return transfer process for existing consumerPid", async () => {
			const routes = generateRestRoutesDataspaceControlPlane(
				"/api/dataspace-control-plane",
				componentName
			);
			const getRoute = routes.find(r => r.operationId === "getTransferProcess");

			const mockContext = {} as IHttpRequestContext;

			const mockRequest: IHttpRequest = {
				pathParams: {
					pid: "consumer-pid-001"
				},
				headers: {
					authorization: "Bearer mock-trust-token"
				}
			};

			const response = await getRoute?.handler(mockContext, mockRequest);

			expect(response).toBeDefined();
			expect(response?.body).toBeDefined();
			expect(response?.body.consumerPid).toBe("consumer-pid-001");
		});

		test("should return TransferError for non-existent consumerPid", async () => {
			const routes = generateRestRoutesDataspaceControlPlane(
				"/api/dataspace-control-plane",
				componentName
			);
			const getRoute = routes.find(r => r.operationId === "getTransferProcess");

			const mockContext = {} as IHttpRequestContext;

			const mockRequest: IHttpRequest = {
				pathParams: {
					pid: "non-existent-pid"
				},
				headers: {
					authorization: "Bearer mock-trust-token"
				}
			};

			const response = await getRoute?.handler(mockContext, mockRequest);
			expect(response?.body).toBeDefined();
			if (response?.body) {
				expect(response.body["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
				if (response.body["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
					expect(response.body.code).toMatch(/^NotFoundError:/);
					expect(response.statusCode).toBe(404);
				}
			}
		});
	});

	describe("GET /.well-known/dspace-version - getProtocolVersions endpoint", () => {
		test("should have correct route configuration", () => {
			const routes = generateRestRoutesDataspaceControlPlane(
				"/api/dataspace-control-plane",
				componentName
			);
			const versionRoute = routes.find(r => r.operationId === "getProtocolVersions");

			expect(versionRoute).toBeDefined();
			expect(versionRoute?.method).toBe("GET");
			expect(versionRoute?.path).toBe(".well-known/dspace-version");
			expect(versionRoute?.skipAuth).toBe(true);
			expect(versionRoute?.skipTenant).toBe(true);
		});

		test("should return a valid protocol version response", async () => {
			const routes = generateRestRoutesDataspaceControlPlane(
				"/api/dataspace-control-plane",
				componentName
			);
			const versionRoute = routes.find(r => r.operationId === "getProtocolVersions");

			const mockContext = {} as IHttpRequestContext;
			const mockRequest = {};

			const response = await versionRoute?.handler(mockContext, mockRequest);

			expect(response).toBeDefined();
			expect(response?.body).toBeDefined();
			expect(Array.isArray(response?.body.protocolVersions)).toBe(true);
			expect(response?.body.protocolVersions.length).toBeGreaterThanOrEqual(1);

			const entry = response?.body.protocolVersions[0];
			expect(entry?.version).toBe("2025-1");
			expect(entry?.binding).toBe("HTTPS");
			expect(typeof entry?.path).toBe("string");
			expect(entry?.path).toMatch(/^\//);
		});
	});

	describe("POST /transfers/request - requestTransfer endpoint", () => {
		test("should have correct route configuration", () => {
			const routes = generateRestRoutesDataspaceControlPlane(
				"/api/dataspace-control-plane",
				componentName
			);
			const initiateRoute = routes.find(r => r.operationId === "requestTransfer");

			expect(initiateRoute).toBeDefined();
			expect(initiateRoute?.method).toBe("POST");
			expect(initiateRoute?.path).toBe("/api/dataspace-control-plane/transfers/request");
		});

		test("should create new transfer process", async () => {
			const routes = generateRestRoutesDataspaceControlPlane(
				"/api/dataspace-control-plane",
				componentName
			);
			const initiateRoute = routes.find(r => r.operationId === "requestTransfer");

			const mockContext = {
				serverRequest: { url: "https://test-origin.com/transfers/request" }
			} as unknown as IHttpRequestContext;

			const mockRequest: IHttpRequest = {
				body: {
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "new-consumer-pid-test",
					agreementId: "agreement-new-test",
					callbackAddress: "https://callback.example.com",
					format: "application/json"
				},
				headers: {
					authorization: "Bearer mock-trust-token"
				}
			};

			const response = await initiateRoute?.handler(mockContext, mockRequest);

			expect(response).toBeDefined();
			expect(response?.body).toBeDefined();
			expect(response?.body.consumerPid).toBe("new-consumer-pid-test");
			expect(response?.body["@type"]).toBe("TransferProcess");
		});
	});
});
