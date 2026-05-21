// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import {
	ComponentFactory,
	GeneralError,
	Is,
	NotFoundError,
	RandomHelper,
	UnauthorizedError
} from "@twin.org/core";
import {
	DataspaceAppFactory,
	type INegotiationCallback,
	type DataspaceAppDataset,
	type TransferProcess
} from "@twin.org/dataspace-models";
import { EngineCoreFactory } from "@twin.org/engine-models";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import { PolicyRequesterFactory } from "@twin.org/rights-management-models";
import {
	DataspaceProtocolCatalogTypes,
	DataspaceProtocolContexts,
	DataspaceProtocolContractNegotiationStateType,
	DataspaceProtocolEndpointType,
	DataspaceProtocolTransferProcessStateType,
	DataspaceProtocolTransferProcessTypes,
	type IDataspaceProtocolAgreement,
	type IDataspaceProtocolCatalogError,
	type IDataspaceProtocolOffer,
	type IDataspaceProtocolTransferCompletionMessage,
	type IDataspaceProtocolTransferError,
	type IDataspaceProtocolTransferProcess,
	type IDataspaceProtocolTransferRequestMessage,
	type IDataspaceProtocolTransferStartMessage,
	type IDataspaceProtocolTransferSuspensionMessage,
	type IDataspaceProtocolTransferTerminationMessage
} from "@twin.org/standards-dataspace-protocol";
import type { DataspaceControlPlanePolicyRequester } from "../src/dataspaceControlPlanePolicyRequester.js";
import { DataspaceControlPlaneService } from "../src/dataspaceControlPlaneService.js";
import { MockFederatedCatalogueComponent } from "./mocks/mockFederatedCatalogue.js";
import { MockPolicyAdministrationPointComponent } from "./mocks/mockPolicyAdministrationPoint.js";
import { MockPolicyNegotiationAdminPointComponent } from "./mocks/mockPolicyNegotiationAdminPoint.js";
import { MockPolicyNegotiationPointComponent } from "./mocks/mockPolicyNegotiationPoint.js";
import {
	createFailingMockTrustComponent,
	createMockEngineCore,
	createMockTrustComponent,
	DEFAULT_SERVICE_OPTIONS,
	setupTestEnv
} from "./setupTestEnv.js";

/**
 * Mocks sendRequestToProvider to return the negotiation ID.
 * negotiateAgreement() now returns immediately with { negotiationId },
 * so PNP callbacks happen asynchronously via the INegotiationCallback interface.
 *
 * @param mockPnpInstance The mock PNP component to configure.
 * @param negotiationId The negotiation ID to return (default: "test-negotiation-id").
 */
function mockPnpToReturnNegotiationId(
	mockPnpInstance: MockPolicyNegotiationPointComponent,
	negotiationId: string = "test-negotiation-id"
): void {
	mockPnpInstance.sendRequestToProvider = vi.fn().mockImplementation(async () => negotiationId);
}

/**
 * Test suite for DataspaceControlPlaneService.
 */
describe("DataspaceControlPlaneService", () => {
	// Create transfer process storage for tests
	let transferProcessStorage: MemoryEntityStorageConnector<TransferProcess>;
	let dataspaceAppDatasetStorage: MemoryEntityStorageConnector<DataspaceAppDataset>;
	let mockPap: MockPolicyAdministrationPointComponent;
	let mockFedCat: MockFederatedCatalogueComponent;
	let mockPnp: MockPolicyNegotiationPointComponent;

	// Register DSP schemas and contexts before running tests
	beforeAll(async () => {
		await setupTestEnv();
	});

	beforeEach(() => {
		// Create fresh storage for each test
		transferProcessStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>()
		});
		dataspaceAppDatasetStorage = new MemoryEntityStorageConnector<DataspaceAppDataset>({
			entitySchema: nameof<DataspaceAppDataset>()
		});

		// Register the entity storage connectors
		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferProcess>(),
			() => transferProcessStorage
		);
		EntityStorageConnectorFactory.register(
			nameofKebabCase<DataspaceAppDataset>(),
			() => dataspaceAppDatasetStorage
		);

		// Create and register mock PAP, PNP, and FedCat components
		mockPap = new MockPolicyAdministrationPointComponent();
		mockPnp = new MockPolicyNegotiationPointComponent();
		mockFedCat = new MockFederatedCatalogueComponent();
		ComponentFactory.register("test-pap", () => mockPap);
		ComponentFactory.register("test-pnp", () => mockPnp);
		ComponentFactory.register("test-fedcat", () => mockFedCat);

		// Register mock trust component
		ComponentFactory.register("test-trust", () => createMockTrustComponent());

		// Register mock URL transformer (pass-through by default); register both the
		// explicit "test-url-transformer" name used by DEFAULT_SERVICE_OPTIONS and the
		// default "url-transformer" name for tests that construct the service with custom options.
		const mockUrlTransformer = {
			className: () => "MockUrlTransformerComponent",
			addEncryptedQueryParamToUrl: vi.fn().mockImplementation(async (url: string) => url)
		};
		ComponentFactory.register("test-url-transformer", () => mockUrlTransformer);
		ComponentFactory.register("url-transformer", () => mockUrlTransformer);

		// Mock ContextIdStore to return test organization ID
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
			[ContextIdKeys.Node]: "did:iota:test-node",
			[ContextIdKeys.Tenant]: "did:iota:test-tenant",
			[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
			[ContextIdKeys.User]: "did:iota:test-user"
		});
	});

	afterEach(() => {
		// Unregister the entity storage connector after each test
		try {
			EntityStorageConnectorFactory.unregister(nameofKebabCase<TransferProcess>());
			EntityStorageConnectorFactory.unregister(nameofKebabCase<DataspaceAppDataset>());
		} catch {
			// Ignore errors if already unregistered
		}

		// Unregister mock components
		try {
			ComponentFactory.unregister("test-pap");
			ComponentFactory.unregister("test-pnp");
			ComponentFactory.unregister("test-fedcat");
			ComponentFactory.unregister("test-trust");
			ComponentFactory.unregister("test-url-transformer");
			ComponentFactory.unregister("url-transformer");
		} catch {
			// Ignore errors if already unregistered
		}

		vi.restoreAllMocks();
	});

	test("can construct with dependencies", async () => {
		const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
		expect(service).toBeDefined();
		expect(service.className()).toBe("DataspaceControlPlaneService");
	});

	describe("Mock Data Initialization", () => {
		test("should have 3 mock Transfer Processes in different states", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Verify STARTED state
			const process1 = await service.getTransferProcess(
				"urn:uuid:consumer-pid-001",
				"valid-trust-payload"
			);
			if (process1["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess1 = process1;
				expect(transferProcess1.consumerPid).toBe("urn:uuid:consumer-pid-001");
				expect(transferProcess1.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			}

			// Verify REQUESTED state
			const process2 = await service.getTransferProcess(
				"urn:uuid:consumer-pid-002",
				"valid-trust-payload"
			);
			if (process2["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess2 = process2;
				expect(transferProcess2.consumerPid).toBe("urn:uuid:consumer-pid-002");
				expect(transferProcess2.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);
			}

			// Verify COMPLETED state
			const process3 = await service.getTransferProcess(
				"urn:uuid:consumer-pid-003",
				"valid-trust-payload"
			);
			if (process3["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess3 = process3;
				expect(transferProcess3.consumerPid).toBe("urn:uuid:consumer-pid-003");
				expect(transferProcess3.state).toBe(DataspaceProtocolTransferProcessStateType.COMPLETED);
			}
		});
	});

	describe("requestTransfer()", () => {
		test("should create a new Transfer Process in REQUESTED state", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// 1. CONSUMER GENERATES consumerPid (per DSP spec) in URN UUIDv7 format
			const consumerGeneratedPid = `urn:uuid:${RandomHelper.generateUuidV7()}`;

			// 2. Consumer sends Transfer Request to Provider
			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: consumerGeneratedPid,
				agreementId: "agreement-123",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			};

			// 3. Provider receives request and returns Transfer Process with both PIDs
			const response = await service.requestTransfer(request, "valid-trust-payload");

			// Check it's a TransferProcess, not an error
			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const transferProcess = response;

			expect(transferProcess).toBeDefined();
			expect(transferProcess["@context"]).toBeDefined();
			expect(transferProcess["@type"]).toBe("TransferProcess");
			expect(transferProcess.consumerPid).toBe(consumerGeneratedPid); // Echo back Consumer's PID
			expect(transferProcess.providerPid).toMatch(
				/^urn:uuid:[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i
			); // Provider generated UUIDv7
			expect((transferProcess as IDataspaceProtocolTransferProcess).state).toBe(
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);
		});

		test("should allow retrieving the created Transfer Process", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Consumer generates their own PID in URN UUIDv7 format
			const consumerGeneratedPid = `urn:uuid:${RandomHelper.generateUuidV7()}`;

			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: consumerGeneratedPid,
				agreementId: "agreement-456",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			};

			await service.requestTransfer(request, "valid-trust-payload");

			// Both Consumer and Provider can query using consumerPid
			const retrieved = await service.getTransferProcess(
				consumerGeneratedPid,
				"valid-trust-payload"
			);
			if (retrieved["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(retrieved.consumerPid).toBe(consumerGeneratedPid);
			}
		});
	});

	describe("getTransferProcess()", () => {
		test("should return Transfer Process for existing consumerPid", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const process = await service.getTransferProcess("consumer-pid-001", "valid-trust-payload");

			expect(process).toBeDefined();
			if (process["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = process;
				expect(transferProcess.consumerPid).toBe("consumer-pid-001");
				expect(transferProcess.providerPid).toBe("provider-pid-001");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
			}
		});

		test("should return TransferError for non-existent consumerPid", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const result = await service.getTransferProcess("non-existent-pid", "valid-trust-payload");
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferError = result;
				// Semantic error code format: "ErrorName:message"
				expect(transferError.code).toMatch(/^NotFoundError:/);
			}
		});
	});

	describe("startTransfer()", () => {
		test("should transition Transfer Process to STARTED state", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Use mock process in REQUESTED state
			const message: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "consumer-pid-002",
				providerPid: "provider-pid-002"
			};

			const response = await service.startTransfer(
				message,
				"https://test-origin.com",
				"valid-trust-payload"
			);

			expect(response).toBeDefined();
			if (response["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferStartMessage = response;
				expect(transferStartMessage.consumerPid).toBe("consumer-pid-002");
				expect(transferStartMessage.providerPid).toBe("provider-pid-002");
				expect(transferStartMessage["@type"]).toBe(
					DataspaceProtocolTransferProcessTypes.TransferStartMessage
				);
			}
		});

		test("should return TransferError for non-existent consumerPid", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "non-existent-pid",
				providerPid: "provider-pid-999"
			};

			const result = await service.startTransfer(
				message,
				"https://test-origin.com",
				"valid-trust-payload"
			);
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferError = result;
				// Semantic error code format: "ErrorName:message"
				expect(transferError.code).toMatch(/^NotFoundError:/);
			}
		});

		describe("tenant token URL handling", () => {
			// Mock trust component returns identity "did:iota:consumer-node-abc" by default; seed the
			// transfer with providerIdentity matching so validateCallerIsProvider passes, and an
			// empty dataAddress so the PULL-mode branch is exercised.
			const seedPullTransfer = async (): Promise<IDataspaceProtocolTransferStartMessage> => {
				const now = new Date().toISOString();
				const consumerPid = "urn:uuid:pull-consumer-pid";
				const providerPid = "urn:uuid:pull-provider-pid";
				await transferProcessStorage.set({
					consumerPid,
					id: "pull-test-id",
					providerPid,
					state: DataspaceProtocolTransferProcessStateType.REQUESTED,
					agreementId: "agreement-123",
					datasetId: "urn:uuid:dataset-123",
					offerId: "agreement-123",
					consumerIdentity: "did:iota:provider-node-xyz",
					providerIdentity: "did:iota:consumer-node-abc",
					dateCreated: now,
					dateModified: now
				});
				return {
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferStartMessage",
					consumerPid,
					providerPid
				};
			};

			test("returns raw endpoint URL when url transformer is a pass-through", async () => {
				const message = await seedPullTransfer();
				const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

				const response = await service.startTransfer(
					message,
					"https://test-origin.com",
					"valid-trust-payload"
				);

				if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
					throw new Error(`unexpected TransferError: ${response.code}`);
				}
				expect(response.dataAddress?.endpoint).toBe("https://test-origin.com/data-plane/data");
			});

			test("calls addEncryptedQueryParamToUrl on url transformer when configured", async () => {
				const message = await seedPullTransfer();
				const mockUrlTransformerComponent = {
					addEncryptedQueryParamToUrl: vi
						.fn()
						.mockImplementation(async (url: string) => `${url}?tenant-token=encrypted-tenant-did`),
					className: () => "MockUrlTransformerComponent"
				};

				ComponentFactory.register("test-url-transformer-custom", () => mockUrlTransformerComponent);

				const service = new DataspaceControlPlaneService({
					...DEFAULT_SERVICE_OPTIONS,
					urlTransformerComponentType: "test-url-transformer-custom"
				});

				const response = await service.startTransfer(
					message,
					"https://test-origin.com",
					"valid-trust-payload"
				);

				if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
					throw new Error(`unexpected TransferError: ${response.code}`);
				}
				expect(response.dataAddress?.endpoint).toBe(
					"https://test-origin.com/data-plane/data?tenant-token=encrypted-tenant-did"
				);
				expect(mockUrlTransformerComponent.addEncryptedQueryParamToUrl).toHaveBeenCalledWith(
					"https://test-origin.com/data-plane/data",
					"tenant",
					"did:iota:test-tenant"
				);

				ComponentFactory.unregister("test-url-transformer-custom");
			});

			test("returns raw endpoint URL when url transformer is configured but tenant context is missing", async () => {
				const message = await seedPullTransfer();
				const mockUrlTransformerComponent = {
					addEncryptedQueryParamToUrl: vi.fn(),
					className: () => "MockUrlTransformerComponent"
				};

				ComponentFactory.register(
					"test-url-transformer-no-tenant",
					() => mockUrlTransformerComponent
				);

				const service = new DataspaceControlPlaneService({
					...DEFAULT_SERVICE_OPTIONS,
					urlTransformerComponentType: "test-url-transformer-no-tenant"
				});

				// Remove Tenant from context
				vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
					[ContextIdKeys.Node]: "did:iota:test-node",
					[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
					[ContextIdKeys.User]: "did:iota:test-user"
				});

				const response = await service.startTransfer(
					message,
					"https://test-origin.com",
					"valid-trust-payload"
				);

				if (response["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
					throw new Error(`unexpected TransferError: ${response.code}`);
				}
				expect(response.dataAddress?.endpoint).toBe("https://test-origin.com/data-plane/data");
				expect(mockUrlTransformerComponent.addEncryptedQueryParamToUrl).not.toHaveBeenCalled();

				ComponentFactory.unregister("test-url-transformer-no-tenant");
			});
		});
	});

	describe("completeTransfer()", () => {
		test("should transition Transfer Process to COMPLETED state", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Use mock process in STARTED state
			const message: IDataspaceProtocolTransferCompletionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferCompletionMessage",
				consumerPid: "consumer-pid-001",
				providerPid: "provider-pid-001"
			};

			const response = await service.completeTransfer(message, "valid-trust-payload");

			expect(response).toBeDefined();
			if (response["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = response;
				expect(transferProcess.consumerPid).toBe("consumer-pid-001");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.COMPLETED);
			}
		});

		test("should return TransferError for non-existent consumerPid", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferCompletionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferCompletionMessage",
				consumerPid: "non-existent-pid",
				providerPid: "provider-pid-999"
			};

			const result = await service.completeTransfer(message, "valid-trust-payload");
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferError = result;
				// Semantic error code format: "ErrorName:message"
				expect(transferError.code).toMatch(/^NotFoundError:/);
			}
		});
	});

	describe("suspendTransfer()", () => {
		test("should transition Transfer Process to SUSPENDED state", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferSuspensionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferSuspensionMessage",
				consumerPid: "consumer-pid-001",
				providerPid: "provider-pid-001",
				reason: ["Manual suspension for testing"]
			};

			const response = await service.suspendTransfer(message, "valid-trust-payload");

			expect(response).toBeDefined();
			if (response["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = response;
				expect(transferProcess.consumerPid).toBe("consumer-pid-001");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.SUSPENDED);
			}
		});

		test("should return TransferError for non-existent consumerPid", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferSuspensionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferSuspensionMessage",
				consumerPid: "non-existent-pid",
				providerPid: "provider-pid-999"
			};

			const result = await service.suspendTransfer(message, "valid-trust-payload");
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferError = result;
				// Semantic error code format: "ErrorName:message"
				expect(transferError.code).toMatch(/^NotFoundError:/);
			}
		});
	});

	describe("terminateTransfer()", () => {
		test("should transition Transfer Process to TERMINATED state", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferTerminationMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferTerminationMessage",
				consumerPid: "consumer-pid-001",
				providerPid: "provider-pid-001",
				reason: ["Manual termination for testing"]
			};

			const response = await service.terminateTransfer(message, "valid-trust-payload");

			expect(response).toBeDefined();
			if (response["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = response;
				expect(transferProcess.consumerPid).toBe("consumer-pid-001");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.TERMINATED);
			}
		});

		test("should return TransferError for non-existent consumerPid", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferTerminationMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferTerminationMessage",
				consumerPid: "non-existent-pid",
				providerPid: "provider-pid-999"
			};

			const result = await service.terminateTransfer(message, "valid-trust-payload");
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferError = result;
				// Semantic error code format: "ErrorName:message"
				expect(transferError.code).toMatch(/^NotFoundError:/);
			}
		});
	});

	describe("resolveConsumerPid() - Internal API for DSC", () => {
		let mockPapResolve: MockPolicyAdministrationPointComponent;
		let mockFedCatResolve: MockFederatedCatalogueComponent;

		beforeEach(() => {
			// Create and register mock PAP and FedCat
			mockPapResolve = new MockPolicyAdministrationPointComponent();
			mockFedCatResolve = new MockFederatedCatalogueComponent();
			ComponentFactory.register("test-pap-resolve", () => mockPapResolve);
			ComponentFactory.register("test-fedcat-resolve", () => mockFedCatResolve);

			// Register mock trust components for resolver tests
			ComponentFactory.register("test-trust-resolve", () => createMockTrustComponent());
			ComponentFactory.register("test-trust-resolve-as-provider", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			// Mock ContextIdStore to return test organization ID
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz", // Matches assigner in test agreements
				[ContextIdKeys.User]: "did:iota:test-user"
			});
		});

		afterEach(() => {
			try {
				ComponentFactory.unregister("test-pap-resolve");
				ComponentFactory.unregister("test-fedcat-resolve");
				ComponentFactory.unregister("test-trust-resolve");
				ComponentFactory.unregister("test-trust-resolve-as-provider");
			} catch {
				// Ignore errors if already unregistered
			}
			vi.restoreAllMocks();
		});

		test("should resolve consumerPid to Transfer Context with Agreement", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add a test agreement (target must match dataset @id in mock FedCat)
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-001",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-123",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-001",
					agreementId: "agreement-001",
					callbackAddress: "https://consumer.example.com/callback",
					format: "application/json"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;

				// Start the transfer as the provider (startTransfer requires provider identity)
				const providerService = new DataspaceControlPlaneService({
					policyAdministrationPointComponentType: "test-pap-resolve",
					policyNegotiationPointComponentType: "test-pnp",
					federatedCatalogueComponentType: "test-fedcat-resolve",
					trustComponentType: "test-trust-resolve-as-provider",
					transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
				});
				await providerService.startTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferStartMessage",
						consumerPid: transferProcess.consumerPid,
						providerPid: transferProcess.providerPid
					},
					"https://test-origin.com",
					"valid-trust-payload"
				);
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Verify entity was stored
			const storedEntity = await transferProcessStorage.get("consumer-pid-001");
			expect(storedEntity).toBeDefined();

			// Pass a valid trust payload (mock trust component accepts any payload)
			// In production, the consumer would receive a data access token via TransferStartMessage.dataAddress
			const context = await service.resolveConsumerPid("consumer-pid-001", "valid-trust-payload");

			expect(context).toBeDefined();
			expect(context.consumerPid).toBe("consumer-pid-001");
			expect(context.providerPid).toBe(providerPid);
			// datasetId is now the full URN (DCAT-compliant, not parsed)
			expect(context.datasetId).toBe("urn:uuid:dataset-123");
			expect(context.agreement).toBeDefined();
			expect(context.agreement["@id"]).toBe("agreement-001");
			expect(context.agreement["@type"]).toBe("Agreement");
			expect(context.providerIdentity).toBe("did:iota:provider-node-xyz");
			expect(context.offerId).toBeDefined();
			expect(context.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
		});

		test("should throw NotFoundError for non-existent consumerPid", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			await expect(service.resolveConsumerPid("non-existent-pid", "some-token")).rejects.toThrow(
				NotFoundError
			);
		});

		test("should throw GeneralError if Transfer Process is TERMINATED", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-001",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-123",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-001",
					agreementId: "agreement-001",
					callbackAddress: "https://consumer.example.com/callback",
					format: "application/json"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;
			} else {
				throw new Error("Failed to create transfer process");
			}

			// First terminate the process
			const terminateMessage: IDataspaceProtocolTransferTerminationMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferTerminationMessage",
				consumerPid: "consumer-pid-001",
				providerPid
			};
			await service.terminateTransfer(terminateMessage, "valid-trust-payload");

			// Then try to resolve it - should throw GeneralError for TERMINATED state
			await expect(
				service.resolveConsumerPid("consumer-pid-001", "valid-trust-payload")
			).rejects.toThrow(GeneralError);
		});

		test("should throw UnauthorizedError when trust verification fails", async () => {
			// Register a failing trust component
			ComponentFactory.register("test-trust-failing", () => createFailingMockTrustComponent());

			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-failing",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-trust-fail",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-123",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			// We need to use a service with working trust to create the transfer
			const workingService = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			await workingService.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-trust-fail",
					agreementId: "agreement-trust-fail",
					callbackAddress: "https://consumer.example.com/callback",
					format: "application/json"
				},
				"valid-trust-payload"
			);

			// Start the transfer as provider (startTransfer requires provider identity)
			const providerStartService = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve-as-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});
			const startResponse = await workingService.getTransferProcess(
				"consumer-pid-trust-fail",
				"valid-trust-payload"
			);
			if (startResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				await providerStartService.startTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferStartMessage",
						consumerPid: startResponse.consumerPid,
						providerPid: startResponse.providerPid
					},
					"https://test-origin.com",
					"valid-trust-payload"
				);
			}

			// Now try to resolve with the failing trust component service
			// TrustHelper.verifyTrust should throw UnauthorizedError when verified: false
			await expect(
				service.resolveConsumerPid("consumer-pid-trust-fail", "any-token")
			).rejects.toThrow(UnauthorizedError);

			// Cleanup
			ComponentFactory.unregister("test-trust-failing");
		});

		test("should throw UnauthorizedError when organization context is missing", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-001",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-123",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-001",
					agreementId: "agreement-001",
					callbackAddress: "https://consumer.example.com/callback",
					format: "application/json"
				},
				"valid-trust-payload"
			);

			// Mock ContextIdStore to return undefined organization
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant"
				// Organization is missing
			});

			// Pass the correct token format for the trust component
			await expect(
				service.resolveConsumerPid("consumer-pid-001", "mock-jwt-consumer-pid-001")
			).rejects.toThrow(UnauthorizedError);
		});

		test("should throw UnauthorizedError when Agreement assigner doesn't match organization", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement with valid assigner (matches mock FedCat offer)
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-001",
				assigner: "did:iota:provider-node-xyz", // Matches offer in mock FedCat
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-123",
				permission: [{ action: "read" }]
			});

			// Create transfer process first (with correct org context)
			await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-001",
					agreementId: "agreement-001",
					callbackAddress: "https://consumer.example.com/callback",
					format: "application/json"
				},
				"valid-trust-payload"
			);

			// Now change context to different organization for resolve call
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant",
				[ContextIdKeys.Organization]: "did:iota:different-provider", // Different from Agreement assigner
				[ContextIdKeys.User]: "did:iota:test-user"
			});

			// Pass the correct token format for the trust component
			await expect(
				service.resolveConsumerPid("consumer-pid-001", "mock-jwt-consumer-pid-001")
			).rejects.toThrow(UnauthorizedError);
		});

		test("should return TransferError when Agreement is missing assigner", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement without assigner (invalid but for testing)
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-001",
				// assigner is missing
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-123",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolAgreement);

			// With FedCat validation, missing assigner causes requestTransfer to return TransferError
			// (agreement won't match any offer in catalog)
			const result = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-001",
					agreementId: "agreement-001",
					callbackAddress: "https://consumer.example.com/callback",
					format: "application/json"
				},
				"valid-trust-payload"
			);

			// Assert - Should be a TransferError
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const transferError = result as IDataspaceProtocolTransferError;
			expect(transferError.code).toMatch(/GeneralError:/);
		});

		test("should include dataAddress when present in transfer process", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve",
				trustComponentType: "test-trust-resolve",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapResolve.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Create transfer process with dataAddress (push mode)
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push",
					agreementId: "agreement-push",
					format: "Http-Push-Activity-Stream-Format",
					callbackAddress: "https://consumer.example.com/callback",
					dataAddress: {
						"@type": "DataAddress",
						endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
						endpoint: "https://consumer.example.com/dataspace/inbox"
					}
				},
				"valid-trust-payload"
			);

			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;

				// Start the transfer as provider (startTransfer requires provider identity)
				const providerStartService = new DataspaceControlPlaneService({
					policyAdministrationPointComponentType: "test-pap-resolve",
					policyNegotiationPointComponentType: "test-pnp",
					federatedCatalogueComponentType: "test-fedcat-resolve",
					trustComponentType: "test-trust-resolve-as-provider",
					transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
				});
				await providerStartService.startTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferStartMessage",
						consumerPid: transferProcess.consumerPid,
						providerPid: transferProcess.providerPid
					},
					"https://test-origin.com",
					"valid-trust-payload"
				);
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Verify the entity was stored
			const storedEntity = await transferProcessStorage.get("consumer-pid-push");
			expect(storedEntity).toBeDefined();
			if (!storedEntity) {
				throw new Error("Entity not found");
			}

			// Pass a valid trust payload (trust verification handles authentication)
			const context = await service.resolveConsumerPid("consumer-pid-push", "valid-trust-payload");

			expect(context.dataAddress).toBeDefined();
			expect(context.dataAddress?.["@type"]).toBe("DataAddress");
			expect(context.dataAddress?.endpointType).toBe(
				DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint
			);
			expect(context.dataAddress?.endpoint).toBe("https://consumer.example.com/dataspace/inbox");
		});
	});

	describe("resolveProviderPid() - Internal API for DSC (Push Mode)", () => {
		let mockPapProvider: MockPolicyAdministrationPointComponent;
		let mockFedCatProvider: MockFederatedCatalogueComponent;

		beforeEach(() => {
			// Create and register mock PAP and FedCat
			mockPapProvider = new MockPolicyAdministrationPointComponent();
			mockFedCatProvider = new MockFederatedCatalogueComponent();
			ComponentFactory.register("test-pap-resolve-provider", () => mockPapProvider);
			ComponentFactory.register("test-fedcat-resolve-provider", () => mockFedCatProvider);

			// Register mock trust components for provider resolver tests
			ComponentFactory.register("test-trust-resolve-provider", () => createMockTrustComponent());
			ComponentFactory.register("test-trust-resolve-provider-as-provider", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			// Mock ContextIdStore to return test organization ID
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
				[ContextIdKeys.User]: "did:iota:test-user"
			});
		});

		afterEach(() => {
			try {
				ComponentFactory.unregister("test-pap-resolve-provider");
				ComponentFactory.unregister("test-fedcat-resolve-provider");
				ComponentFactory.unregister("test-trust-resolve-provider");
				ComponentFactory.unregister("test-trust-resolve-provider-as-provider");
			} catch {
				// Ignore errors if already unregistered
			}
			vi.restoreAllMocks();
		});

		test("should resolve providerPid to Transfer Context with Agreement", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-001",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push-123",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push-001",
					agreementId: "agreement-push-001",
					format: "Http-Push-Activity-Stream-Format",
					callbackAddress: "https://consumer.example.com/callback",
					dataAddress: {
						"@type": "DataAddress",
						endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
						endpoint: "https://consumer.example.com/dataspace/inbox"
					}
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;

				// Start the transfer as the provider (startTransfer requires provider identity)
				const providerService = new DataspaceControlPlaneService({
					policyAdministrationPointComponentType: "test-pap-resolve-provider",
					policyNegotiationPointComponentType: "test-pnp",
					federatedCatalogueComponentType: "test-fedcat-resolve-provider",
					trustComponentType: "test-trust-resolve-provider-as-provider",
					transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
				});
				await providerService.startTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferStartMessage",
						consumerPid: transferProcess.consumerPid,
						providerPid: transferProcess.providerPid
					},
					"https://test-origin.com",
					"valid-trust-payload"
				);
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Verify the entity was stored
			const storedEntity = await transferProcessStorage.get("consumer-pid-push-001");
			expect(storedEntity).toBeDefined();
			if (!storedEntity) {
				throw new Error("Entity not found");
			}

			// Pass a valid trust payload (trust verification handles authentication)
			const context = await service.resolveProviderPid(providerPid, "valid-trust-payload");

			expect(context).toBeDefined();
			expect(context.consumerPid).toBe("consumer-pid-push-001");
			expect(context.providerPid).toBe(providerPid);
			// datasetId is now the full URN (DCAT-compliant, not parsed)
			expect(context.datasetId).toBe("urn:uuid:dataset-push-123");
			expect(context.agreement).toBeDefined();
			expect(context.agreement["@id"]).toBe("agreement-push-001");
			expect(context.agreement["@type"]).toBe("Agreement");
			expect(context.providerIdentity).toBe("did:iota:provider-node-xyz");
			expect(context.consumerIdentity).toBe("did:iota:consumer-node-abc");
			expect(context.dataAddress).toBeDefined();
			expect(context.dataAddress?.endpoint).toBe("https://consumer.example.com/dataspace/inbox");
			expect(context.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
		});

		test("should throw NotFoundError for non-existent providerPid", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			await expect(
				service.resolveProviderPid("non-existent-provider-pid", "some-token")
			).rejects.toThrow(NotFoundError);
		});

		test("should throw UnauthorizedError when trust verification fails", async () => {
			// Register a failing trust component for provider tests
			ComponentFactory.register("test-trust-failing-provider", () =>
				createFailingMockTrustComponent()
			);

			// First create a transfer with a working trust service
			const workingService = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-trust-fail",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Create transfer process
			const requestResponse = await workingService.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push-trust-fail",
					agreementId: "agreement-push-trust-fail",
					format: "Http-Push-Activity-Stream-Format",
					callbackAddress: "https://consumer.example.com/callback"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;

				// Start the transfer as provider (startTransfer requires provider identity)
				const providerStartService = new DataspaceControlPlaneService({
					policyAdministrationPointComponentType: "test-pap-resolve-provider",
					policyNegotiationPointComponentType: "test-pnp",
					federatedCatalogueComponentType: "test-fedcat-resolve-provider",
					trustComponentType: "test-trust-resolve-provider-as-provider",
					transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
				});
				await providerStartService.startTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferStartMessage",
						consumerPid: transferProcess.consumerPid,
						providerPid: transferProcess.providerPid
					},
					"https://test-origin.com",
					"valid-trust-payload"
				);
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Now create service with failing trust component
			const failingService = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-failing-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// TrustHelper.verifyTrust should throw UnauthorizedError when verified: false
			await expect(failingService.resolveProviderPid(providerPid, "any-token")).rejects.toThrow(
				UnauthorizedError
			);

			// Cleanup
			ComponentFactory.unregister("test-trust-failing-provider");
		});

		test("should throw GeneralError if Transfer Process is TERMINATED", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-terminate",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push-terminate",
					agreementId: "agreement-push-terminate",
					format: "Http-Push-Activity-Stream-Format",
					callbackAddress: "https://consumer.example.com/callback"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Verify the entity was stored
			const storedEntity = await transferProcessStorage.get("consumer-pid-push-terminate");
			expect(storedEntity).toBeDefined();
			if (!storedEntity) {
				throw new Error("Entity not found");
			}

			// Terminate the process
			await service.terminateTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferTerminationMessage",
					consumerPid: "consumer-pid-push-terminate",
					providerPid
				},
				"valid-trust-payload"
			);

			// Then try to resolve it - pass valid trust payload to test TERMINATED state check
			await expect(service.resolveProviderPid(providerPid, "valid-trust-payload")).rejects.toThrow(
				GeneralError
			);
		});

		test("should throw UnauthorizedError when organization context is missing", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement for the test
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-no-org",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Create transfer process first
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push-no-org",
					agreementId: "agreement-push-no-org",
					format: "Http-Push-Activity-Stream-Format",
					callbackAddress: "https://consumer.example.com/callback"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Mock ContextIdStore to return undefined organization
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant"
				// Organization is missing
			});

			// Pass the correct token format
			await expect(
				service.resolveProviderPid(providerPid, "mock-jwt-consumer-pid-push-no-org")
			).rejects.toThrow(UnauthorizedError);
		});

		test("should throw UnauthorizedError when Agreement assigner doesn't match organization", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement with VALID assigner (matching mocked org) for requestTransfer
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-mismatch",
				assigner: "did:iota:provider-node-xyz", // Matches mocked org for requestTransfer
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Create transfer process first (with valid assigner)
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push-mismatch",
					agreementId: "agreement-push-mismatch",
					format: "Http-Push-Activity-Stream-Format",
					callbackAddress: "https://consumer.example.com/callback"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Now change context to a different organization to trigger the mismatch
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant",
				[ContextIdKeys.Organization]: "did:iota:different-provider", // Different from Agreement assigner
				[ContextIdKeys.User]: "did:iota:test-user"
			});

			// Pass the correct token format
			await expect(
				service.resolveProviderPid(providerPid, "mock-jwt-consumer-pid-push-mismatch")
			).rejects.toThrow(UnauthorizedError);
		});

		test("should throw UnauthorizedError when Agreement assignee doesn't match consumer identity", async () => {
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-resolve-provider",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-resolve-provider",
				trustComponentType: "test-trust-resolve-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Add agreement - this will set consumerIdentity to "did:iota:consumer-node-abc"
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-assignee",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Create transfer process - this stores consumerIdentity from Agreement
			const requestResponse = await service.requestTransfer(
				{
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "TransferRequestMessage",
					consumerPid: "consumer-pid-push-assignee",
					agreementId: "agreement-push-assignee",
					format: "Http-Push-Activity-Stream-Format",
					callbackAddress: "https://consumer.example.com/callback"
				},
				"valid-trust-payload"
			);

			let providerPid: string;
			if (requestResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = requestResponse;
				providerPid = transferProcess.providerPid;

				// Start the transfer as provider (startTransfer requires provider identity)
				const providerStartService = new DataspaceControlPlaneService({
					policyAdministrationPointComponentType: "test-pap-resolve-provider",
					policyNegotiationPointComponentType: "test-pnp",
					federatedCatalogueComponentType: "test-fedcat-resolve-provider",
					trustComponentType: "test-trust-resolve-provider-as-provider",
					transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
				});
				await providerStartService.startTransfer(
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": "TransferStartMessage",
						consumerPid: transferProcess.consumerPid,
						providerPid: transferProcess.providerPid
					},
					"https://test-origin.com",
					"valid-trust-payload"
				);
			} else {
				throw new Error("Failed to create transfer process");
			}

			// Now update the Agreement in PAP to have a different assignee
			// This simulates the case where Agreement assignee doesn't match stored consumerIdentity
			mockPapProvider.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-push-assignee",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:another-consumer", // Different from stored consumerIdentity
				target: "urn:uuid:dataset-push",
				permission: [{ action: "read" }]
			});

			// Pass the correct token format
			await expect(
				service.resolveProviderPid(providerPid, "mock-jwt-consumer-pid-push-assignee")
			).rejects.toThrow(UnauthorizedError);
		});
	});

	describe("Complete Workflow Test", () => {
		test("should handle complete Transfer Process lifecycle", async () => {
			// Setup PAP, FedCat, Trust and ContextIdStore for this test
			const workflowMockPap = new MockPolicyAdministrationPointComponent();
			const workflowMockFedCat = new MockFederatedCatalogueComponent();
			ComponentFactory.register("test-pap-workflow", () => workflowMockPap);
			ComponentFactory.register("test-fedcat-workflow", () => workflowMockFedCat);
			ComponentFactory.register("test-trust-workflow", () => createMockTrustComponent());
			ComponentFactory.register("test-trust-workflow-provider", () =>
				createMockTrustComponent("did:iota:provider-node-xyz")
			);

			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: "did:iota:test-node",
				[ContextIdKeys.Tenant]: "did:iota:test-tenant",
				[ContextIdKeys.Organization]: "did:iota:provider-node-xyz",
				[ContextIdKeys.User]: "did:iota:test-user"
			});

			// Add agreement for the workflow test
			workflowMockPap.addAgreement({
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "workflow-agreement-123",
				assigner: "did:iota:provider-node-xyz",
				assignee: "did:iota:consumer-node-abc",
				target: "urn:uuid:dataset-workflow-123",
				permission: [{ action: "read" }]
			});

			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-workflow",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-workflow",
				trustComponentType: "test-trust-workflow",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Initiate Transfer (Consumer side)
			const initiateRequest: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: "workflow-test-consumer-pid",
				agreementId: "workflow-agreement-123",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			};

			const initiateResponse = await service.requestTransfer(
				initiateRequest,
				"valid-trust-payload"
			);
			expect(initiateResponse["@type"]).not.toBe(
				DataspaceProtocolTransferProcessTypes.TransferError
			);
			const initiateProcess = initiateResponse;
			expect(initiateProcess.consumerPid).toBe("workflow-test-consumer-pid");

			// Get Transfer Process state
			const getResponse1 = await service.getTransferProcess(
				"workflow-test-consumer-pid",
				"valid-trust-payload"
			);
			expect(getResponse1.consumerPid).toBe("workflow-test-consumer-pid");

			// Start Transfer (Provider side — requires provider identity)
			const providerService = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "test-pap-workflow",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "test-fedcat-workflow",
				trustComponentType: "test-trust-workflow-provider",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});
			const startMessage: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: initiateResponse.consumerPid,
				providerPid: initiateResponse.providerPid
			};

			const startResponse = await providerService.startTransfer(
				startMessage,
				"https://test-origin.com",
				"valid-trust-payload"
			);
			if (startResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferStartMessage = startResponse;
				expect(transferStartMessage.consumerPid).toBe("workflow-test-consumer-pid");
				expect(transferStartMessage["@type"]).toBe(
					DataspaceProtocolTransferProcessTypes.TransferStartMessage
				);
			}

			// Resolve consumerPid (DSC internal API)
			// Verify the entity was stored
			const storedEntity = await transferProcessStorage.get("workflow-test-consumer-pid");
			expect(storedEntity).toBeDefined();
			if (!storedEntity) {
				throw new Error("Entity not found");
			}

			// Pass a valid trust payload (trust verification handles authentication)
			const context = await service.resolveConsumerPid(
				"workflow-test-consumer-pid",
				"valid-trust-payload"
			);
			expect(context.datasetId).toBeDefined();
			expect(context.agreement).toBeDefined();
			expect(context.agreement["@id"]).toBe("workflow-agreement-123");

			// Complete Transfer
			const completeMessage: IDataspaceProtocolTransferCompletionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferCompletionMessage",
				consumerPid: initiateResponse.consumerPid,
				providerPid: initiateResponse.providerPid
			};

			const completeResponse = await service.completeTransfer(
				completeMessage,
				"valid-trust-payload"
			);
			if (completeResponse["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = completeResponse;
				expect(transferProcess.consumerPid).toBe("workflow-test-consumer-pid");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.COMPLETED);
			}

			// Get final state
			const getResponse2 = await service.getTransferProcess(
				"workflow-test-consumer-pid",
				"valid-trust-payload"
			);
			if (getResponse2["@type"] !== DataspaceProtocolTransferProcessTypes.TransferError) {
				const transferProcess = getResponse2;
				expect(transferProcess.consumerPid).toBe("workflow-test-consumer-pid");
				expect(transferProcess.state).toBe(DataspaceProtocolTransferProcessStateType.COMPLETED);
			}

			// Cleanup
			ComponentFactory.unregister("test-pap-workflow");
			ComponentFactory.unregister("test-fedcat-workflow");
			ComponentFactory.unregister("test-trust-workflow");
			ComponentFactory.unregister("test-trust-workflow-provider");
		});
	});

	describe("Federated Catalogue Integration", () => {
		test("should validate dataset exists in catalog during transfer initiation", async () => {
			// Setup: Mock Federated Catalogue component
			// NOTE: Now expects full URN as datasetId (not short ID)
			const mockCatalog = {
				get: async (datasetId: string) => {
					if (datasetId === "urn:uuid:valid-dataset-123") {
						return {
							"@context": "https://www.w3.org/ns/dcat",
							"@id": "urn:uuid:valid-dataset-123",
							"@type": "dcat:Dataset",
							"dcterms:title": "Test Dataset",
							"odrl:hasPolicy": [
								{
									"@type": "odrl:Offer",
									"@id": "agreement-test-catalog",
									assigner: "urn:uuid:provider-123",
									permission: [
										{
											action: "use"
										}
									]
								}
							]
						};
					}
					// Return CatalogError instead of throwing
					return {
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": DataspaceProtocolCatalogTypes.CatalogError,
						code: "NotFoundError:datasetNotFound"
					} as IDataspaceProtocolCatalogError;
				},
				className: () => "MockFederatedCatalogue"
			};

			// Setup: Mock PAP component
			const mockPapCatalog = {
				getAgreement: async (agreementId: string) => {
					if (agreementId === "agreement-test-catalog") {
						return {
							"@type": "Agreement",
							"@id": "agreement-test-catalog",
							status: "active",
							assignee: "urn:uuid:consumer-123",
							assigner: "urn:uuid:provider-123",
							target: "urn:uuid:valid-dataset-123",
							permission: [
								{
									action: "use"
								}
							]
						};
					}
					throw new NotFoundError("MockPAP", "agreementNotFound", agreementId);
				},
				className: () => "MockPolicyAdministrationPoint"
			};

			// Register mocks with ComponentFactory (TWIN pattern)
			ComponentFactory.register("mock-pap-catalog-test", () => mockPapCatalog);
			ComponentFactory.register("mock-fedcat-test", () => mockCatalog);
			ComponentFactory.register("mock-trust-catalog-test", () =>
				createMockTrustComponent("urn:uuid:consumer-123")
			);

			// Create service with component types
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "mock-pap-catalog-test",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "mock-fedcat-test",
				trustComponentType: "mock-trust-catalog-test",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Initiate transfer
			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: "consumer-pid-catalog-test",
				agreementId: "agreement-test-catalog",
				callbackAddress: "https://callback.example.com",
				format: "application/json"
			};

			const response = await service.requestTransfer(request, "valid-trust-payload");

			// Verify transfer was created successfully
			expect(response["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const transferProcess = response;
			expect(transferProcess.consumerPid).toBe("consumer-pid-catalog-test");
			expect((transferProcess as IDataspaceProtocolTransferProcess).state).toBe(
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);

			// Cleanup
			ComponentFactory.unregister("mock-pap-catalog-test");
			ComponentFactory.unregister("mock-fedcat-test");
			ComponentFactory.unregister("mock-trust-catalog-test");
		});

		test("should throw NotFoundError if dataset not in catalog", async () => {
			// Setup: Mock Federated Catalogue that returns CatalogError
			const mockCatalog = {
				get: async (datasetId: string) =>
					// Return CatalogError instead of throwing
					({
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": DataspaceProtocolCatalogTypes.CatalogError,
						code: "NotFoundError:datasetNotFound"
					}) as IDataspaceProtocolCatalogError,
				className: () => "MockFederatedCatalogue"
			};

			// Setup: Mock PAP component
			const mockPapNotFound = {
				getAgreement: async (agreementId: string) => {
					if (agreementId === "agreement-missing-dataset") {
						return {
							"@type": "Agreement",
							"@id": "agreement-missing-dataset",
							status: "active",
							assignee: "urn:uuid:consumer-123",
							assigner: "urn:uuid:provider-123",
							target: "urn:uuid:missing-dataset-456",
							permission: [
								{
									action: "use"
								}
							]
						};
					}
					throw new NotFoundError("MockPAP", "agreementNotFound", agreementId);
				},
				className: () => "MockPolicyAdministrationPoint"
			};

			// Register mocks with ComponentFactory
			ComponentFactory.register("mock-pap-notfound-test", () => mockPapNotFound);
			ComponentFactory.register("mock-fedcat-notfound-test", () => mockCatalog);
			ComponentFactory.register("mock-trust-notfound-test", () =>
				createMockTrustComponent("urn:uuid:consumer-123")
			);

			// Create service with component types
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "mock-pap-notfound-test",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "mock-fedcat-notfound-test",
				trustComponentType: "mock-trust-notfound-test",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Initiate transfer
			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: "consumer-pid-missing-dataset",
				agreementId: "agreement-missing-dataset",
				callbackAddress: "https://callback.example.com",
				format: "application/json"
			};

			// Should return TransferError (DSP-compliant) instead of throwing
			const result = await service.requestTransfer(request, "valid-trust-payload");
			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const transferError = result as IDataspaceProtocolTransferError;
			// Semantic error code format: "ErrorName:message"
			expect(transferError.code).toMatch(/^NotFoundError:/);
			expect(transferError.consumerPid).toBe("consumer-pid-missing-dataset");
			expect(transferError.providerPid).toBeDefined();
			expect(transferError.reason).toBeDefined();
			expect(Is.array(transferError.reason)).toBe(true);
			// reason now contains flattened error objects (following Federated Catalogue pattern)
			if (transferError.reason && transferError.reason.length > 0) {
				const firstError = transferError.reason[0] as { name?: string; message?: string };
				expect(firstError.name).toBe("NotFoundError");
				expect(firstError.message).toContain("datasetNotInCatalog");
			}

			// Cleanup
			ComponentFactory.unregister("mock-pap-notfound-test");
			ComponentFactory.unregister("mock-fedcat-notfound-test");
			ComponentFactory.unregister("mock-trust-notfound-test");
		});

		test("should throw GeneralError if Agreement doesn't match any Catalog Offer", async () => {
			// Setup: Mock Federated Catalogue with different offer
			// NOTE: Now expects full URN as datasetId (not short ID)
			const mockCatalog = {
				get: async (datasetId: string) => {
					if (datasetId === "urn:uuid:dataset-mismatch-123") {
						return {
							"@context": "https://www.w3.org/ns/dcat",
							"@id": "urn:uuid:dataset-mismatch-123",
							"@type": "dcat:Dataset",
							"dcterms:title": "Test Dataset",
							"odrl:hasPolicy": [
								{
									"@type": "odrl:Offer",
									"@id": "offer-different-123",
									assigner: "urn:uuid:provider-123",
									permission: [
										{
											action: "use"
										}
									]
								}
							]
						};
					}
					// Return CatalogError instead of throwing
					return {
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@type": DataspaceProtocolCatalogTypes.CatalogError,
						code: "NotFoundError:datasetNotFound"
					} as IDataspaceProtocolCatalogError;
				},
				className: () => "MockFederatedCatalogue"
			};

			// Setup: Mock PAP with Agreement that doesn't match Offer
			const mockPapMismatch = {
				getAgreement: async (agreementId: string) => {
					if (agreementId === "agreement-mismatch-123") {
						return {
							"@type": "Agreement",
							"@id": "agreement-mismatch-123",
							status: "active",
							assignee: "urn:uuid:consumer-123",
							assigner: "urn:uuid:provider-different",
							target: "urn:uuid:dataset-mismatch-123",
							permission: [
								{
									action: "use"
								}
							]
						};
					}
					throw new NotFoundError("MockPAP", "agreementNotFound", agreementId);
				},
				className: () => "MockPolicyAdministrationPoint"
			};

			// Register mocks with ComponentFactory
			ComponentFactory.register("mock-pap-mismatch-test", () => mockPapMismatch);
			ComponentFactory.register("mock-fedcat-mismatch-test", () => mockCatalog);
			ComponentFactory.register("mock-trust-mismatch-test", () =>
				createMockTrustComponent("urn:uuid:consumer-123")
			);

			// Create service with component types
			const service = new DataspaceControlPlaneService({
				policyAdministrationPointComponentType: "mock-pap-mismatch-test",
				policyNegotiationPointComponentType: "test-pnp",
				federatedCatalogueComponentType: "mock-fedcat-mismatch-test",
				trustComponentType: "mock-trust-mismatch-test",
				transferProcessEntityStorageType: nameofKebabCase<TransferProcess>()
			});

			// Initiate transfer
			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: "consumer-pid-mismatch",
				agreementId: "agreement-mismatch-123",
				callbackAddress: "https://callback.example.com",
				format: "application/json"
			};

			// Should return TransferError with specific error key
			const result = await service.requestTransfer(request, "valid-trust-payload");

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			const transferError = result as IDataspaceProtocolTransferError;
			expect(transferError.code).toMatch(/GeneralError:/);
			expect(transferError.reason).toBeDefined();
			if (transferError.reason && transferError.reason.length > 0) {
				const firstError = transferError.reason[0] as { message?: string };
				expect(firstError.message).toContain("agreementNotMatchingOffer");
			}

			// Cleanup
			ComponentFactory.unregister("mock-pap-mismatch-test");
			ComponentFactory.unregister("mock-fedcat-mismatch-test");
			ComponentFactory.unregister("mock-trust-mismatch-test");
		});
	});

	describe("Contract Negotiation - Catalog Integration", () => {
		test("should throw NotFoundError when dataset not found in catalog", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(
				service.negotiateAgreement(
					"dataset-does-not-exist",
					"offer-does-not-exist",
					"http://provider.example.com",
					"http://consumer.example.com",
					"valid-trust-payload"
				)
			).rejects.toMatchObject({
				name: "NotFoundError",
				message: expect.stringContaining("datasetNotFoundInCatalog")
			});
		});

		test("should throw GeneralError when dataset has no offers", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(
				service.negotiateAgreement(
					"dataset-no-offers",
					"any-offer-id",
					"http://provider.example.com",
					"http://consumer.example.com",
					"valid-trust-payload"
				)
			).rejects.toMatchObject({
				name: "GeneralError",
				message: expect.stringContaining("datasetHasNoOffers")
			});
		});

		test("should throw NotFoundError when specific offer not found in dataset", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(
				service.negotiateAgreement(
					"urn:uuid:dataset-negotiation-valid",
					"offer-wrong-id",
					"http://provider.example.com",
					"http://consumer.example.com",
					"valid-trust-payload"
				)
			).rejects.toMatchObject({
				name: "NotFoundError",
				message: expect.stringContaining("offerNotFoundInDataset")
			});
		});

		test("should find offer in dataset with multiple offers", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp);

			const result = await service.negotiateAgreement(
				"dataset-multi-offers",
				"offer-multi-2",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			expect(result).toBeDefined();
			expect(result.negotiationId).toBe("test-negotiation-id");
			expect(mockPnp.sendRequestToProvider).toHaveBeenCalledWith(
				"http://provider.example.com",
				"dataspace-control-plane-requester",
				"offer-multi-2",
				"http://consumer.example.com"
			);
		});

		test("should successfully look up dataset by datasetId", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp);

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			expect(result).toBeDefined();
			expect(result.negotiationId).toBe("test-negotiation-id");
		});

		test("should successfully initiate negotiation with valid offer from catalog", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp);

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			expect(result).toBeDefined();
			expect(result.negotiationId).toBe("test-negotiation-id");
			expect(mockPnp.sendRequestToProvider).toHaveBeenCalledWith(
				"http://provider.example.com",
				"dataspace-control-plane-requester",
				"offer-negotiation-valid",
				"http://consumer.example.com"
			);
		});

		test("should always use hardcoded requester type", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp);

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			expect(mockPnp.sendRequestToProvider).toHaveBeenCalledWith(
				"http://provider.example.com",
				"dataspace-control-plane-requester",
				"offer-negotiation-valid",
				"http://consumer.example.com"
			);
		});
	});

	describe("Contract Negotiation - Callback Pattern", () => {
		test("should return negotiationId immediately without waiting for callbacks", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp, "my-negotiation-123");

			const result = await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			expect(result).toBeDefined();
			expect(result.negotiationId).toBe("my-negotiation-123");
		});

		test("should track negotiation in policy requester after initiation", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp, "tracked-negotiation-456");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			// Verify PNP sendRequestToProvider was called
			expect(mockPnp.sendRequestToProvider).toHaveBeenCalledWith(
				"http://provider.example.com",
				"dataspace-control-plane-requester",
				"offer-negotiation-valid",
				"http://consumer.example.com"
			);
		});
	});

	describe("Contract Negotiation - Callback Sequence", () => {
		test("should invoke onStateChanged with OFFERED when offer() fires", async () => {
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-001");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			// Simulate PNP calling offer() on the requester
			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			const mockOffer: IDataspaceProtocolOffer = {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Offer",
				"@id": "test-offer-uid",
				assigner: "did:iota:provider",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolOffer;

			const accepted = await requester.offer("cb-neg-001", mockOffer);

			expect(accepted).toBe(true);
			expect(callbackSpy.onStateChanged).toHaveBeenCalledWith(
				"cb-neg-001",
				DataspaceProtocolContractNegotiationStateType.OFFERED,
				{ offer: mockOffer }
			);
			expect(callbackSpy.onCompleted).not.toHaveBeenCalled();
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
		});

		test("should invoke onStateChanged with AGREED when agreement() fires", async () => {
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-002");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			const mockAgreement: IDataspaceProtocolAgreement = {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "test-agreement-uid",
				assigner: "did:iota:provider",
				assignee: "did:iota:consumer",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolAgreement;

			const accepted = await requester.agreement("cb-neg-002", mockAgreement);

			expect(accepted).toBe(true);
			expect(callbackSpy.onStateChanged).toHaveBeenCalledWith(
				"cb-neg-002",
				DataspaceProtocolContractNegotiationStateType.AGREED,
				{ agreement: mockAgreement }
			);
			expect(callbackSpy.onCompleted).not.toHaveBeenCalled();
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
		});

		test("should invoke onCompleted with agreementId when finalised() fires after agreement", async () => {
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-003");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			const mockAgreement: IDataspaceProtocolAgreement = {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "final-agreement-uid",
				assigner: "did:iota:provider",
				assignee: "did:iota:consumer",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolAgreement;

			// Simulate the full callback sequence: offer → agreement → finalised
			await requester.offer("cb-neg-003", {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Offer",
				"@id": "offer-uid",
				assigner: "did:iota:provider",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolOffer);

			await requester.agreement("cb-neg-003", mockAgreement);
			await requester.finalised("cb-neg-003");

			expect(callbackSpy.onCompleted).toHaveBeenCalledWith("cb-neg-003", "final-agreement-uid");
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
		});

		test("should invoke onFailed when terminated() fires", async () => {
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-004");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			await requester.terminated("cb-neg-004");

			expect(callbackSpy.onFailed).toHaveBeenCalledWith(
				"cb-neg-004",
				"negotiationTerminatedByProvider"
			);
			expect(callbackSpy.onCompleted).not.toHaveBeenCalled();
		});

		test("should invoke onFailed when finalised() fires without prior agreement", async () => {
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-005");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			// Skip agreement() and go straight to finalised()
			await requester.finalised("cb-neg-005");

			expect(callbackSpy.onFailed).toHaveBeenCalledWith(
				"cb-neg-005",
				"negotiationFinalizedNoAgreement"
			);
			expect(callbackSpy.onCompleted).not.toHaveBeenCalled();
		});

		test("should remove negotiation from tracking after finalised()", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-006");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			expect(requester.getActiveNegotiations().has("cb-neg-006")).toBe(true);

			await requester.agreement("cb-neg-006", {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "agreement-cleanup",
				assigner: "did:iota:provider",
				assignee: "did:iota:consumer",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolAgreement);

			await requester.finalised("cb-neg-006");

			expect(requester.getActiveNegotiations().has("cb-neg-006")).toBe(false);
		});

		test("should remove negotiation from tracking after terminated()", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-007");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			expect(requester.getActiveNegotiations().has("cb-neg-007")).toBe(true);

			await requester.terminated("cb-neg-007");

			expect(requester.getActiveNegotiations().has("cb-neg-007")).toBe(false);
		});

		test("should invoke full callback sequence in correct order", async () => {
			const callOrder: string[] = [];
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockImplementation(async (negId, state) => {
					callOrder.push(`stateChanged:${state}`);
				}),
				onCompleted: vi.fn().mockImplementation(async () => {
					callOrder.push("completed");
				}),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("test", callbackSpy);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-008");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			await requester.offer("cb-neg-008", {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Offer",
				"@id": "seq-offer",
				assigner: "did:iota:provider",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolOffer);

			await requester.agreement("cb-neg-008", {
				"@context": "http://www.w3.org/ns/odrl.jsonld",
				"@type": "Agreement",
				"@id": "seq-agreement",
				assigner: "did:iota:provider",
				assignee: "did:iota:consumer",
				permission: [{ action: "read" }]
			} as unknown as IDataspaceProtocolAgreement);

			await requester.finalised("cb-neg-008");

			expect(callOrder).toEqual(["stateChanged:OFFERED", "stateChanged:AGREED", "completed"]);
		});

		test("should fan out callbacks to multiple registered listeners", async () => {
			const callbackSpy1: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};
			const callbackSpy2: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("listener-a", callbackSpy1);
			service.registerNegotiationCallback("listener-b", callbackSpy2);

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-multi-001");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			await requester.terminated("cb-neg-multi-001");

			expect(callbackSpy1.onFailed).toHaveBeenCalledWith(
				"cb-neg-multi-001",
				"negotiationTerminatedByProvider"
			);
			expect(callbackSpy2.onFailed).toHaveBeenCalledWith(
				"cb-neg-multi-001",
				"negotiationTerminatedByProvider"
			);
		});

		test("should not invoke callback after unregisterNegotiationCallback", async () => {
			const callbackSpy: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("removable", callbackSpy);
			service.unregisterNegotiationCallback("removable");

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-unreg-001");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			await requester.terminated("cb-neg-unreg-001");

			expect(callbackSpy.onStateChanged).not.toHaveBeenCalled();
			expect(callbackSpy.onCompleted).not.toHaveBeenCalled();
			expect(callbackSpy.onFailed).not.toHaveBeenCalled();
		});

		test("should only unregister the specified key, leaving other callbacks active", async () => {
			const callbackSpy1: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};
			const callbackSpy2: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			service.registerNegotiationCallback("keep", callbackSpy1);
			service.registerNegotiationCallback("remove", callbackSpy2);
			service.unregisterNegotiationCallback("remove");

			mockPnpToReturnNegotiationId(mockPnp, "cb-neg-app-001");

			await service.negotiateAgreement(
				"urn:uuid:dataset-negotiation-valid",
				"offer-negotiation-valid",
				"http://provider.example.com",
				"http://consumer.example.com",
				"valid-trust-payload"
			);

			const requester = PolicyRequesterFactory.get<DataspaceControlPlanePolicyRequester>(
				"dataspace-control-plane-requester"
			);

			await requester.terminated("cb-neg-app-001");

			expect(callbackSpy1.onFailed).toHaveBeenCalledWith(
				"cb-neg-app-001",
				"negotiationTerminatedByProvider"
			);
			expect(callbackSpy2.onFailed).not.toHaveBeenCalled();
		});
	});

	describe("Negotiation History", () => {
		test("should retrieve negotiation history from PNAP", async () => {
			const mockPnapAdmin = new MockPolicyNegotiationAdminPointComponent();

			// Add sample negotiations
			mockPnapAdmin.addNegotiation(
				MockPolicyNegotiationAdminPointComponent.createSampleNegotiation({
					id: "neg-1",
					correlationId: "provider-1",
					state: "FINALIZED",
					dateCreated: "2026-02-05T10:00:00.000Z",
					offer: {
						"@context": "http://www.w3.org/ns/odrl.jsonld",
						"@type": "Offer",
						"@id": "offer-1",
						assigner: "did:iota:provider",
						permission: [{ action: "read" }]
					},
					agreement: {
						"@context": "http://www.w3.org/ns/odrl.jsonld",
						"@type": "Agreement",
						"@id": "agreement-1",
						assigner: "did:iota:provider",
						assignee: "did:iota:consumer",
						permission: [{ action: "read" }]
					}
				})
			);

			mockPnapAdmin.addNegotiation(
				MockPolicyNegotiationAdminPointComponent.createSampleNegotiation({
					id: "neg-2",
					correlationId: "provider-2",
					state: "REQUESTED",
					dateCreated: "2026-02-05T09:00:00.000Z",
					offer: {
						"@context": "http://www.w3.org/ns/odrl.jsonld",
						"@type": "Offer",
						"@id": "offer-2",
						assigner: "did:iota:provider",
						permission: [{ action: "write" }]
					}
				})
			);

			ComponentFactory.register("test-pnap-history", () => mockPnapAdmin);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				policyNegotiationAdminPointComponentType: "test-pnap-history"
			});

			const result = await service.getNegotiationHistory(undefined, undefined, "trust-payload");

			expect(result.count).toBe(2);
			expect(result.negotiations).toHaveLength(2);

			// Verify first negotiation (newest first)
			const firstNeg = result.negotiations[0];
			expect(firstNeg.negotiation["@type"]).toBe("ContractNegotiation");
			expect(firstNeg.negotiation.consumerPid).toBe("neg-1");
			expect(firstNeg.negotiation.providerPid).toBe("provider-1");
			if ("state" in firstNeg.negotiation) {
				expect(firstNeg.negotiation.state).toBe("FINALIZED");
			}
			expect(firstNeg.offerId).toBe("offer-1");
			expect(firstNeg.agreementId).toBe("agreement-1");

			// Verify second negotiation
			const secondNeg = result.negotiations[1];
			expect(secondNeg.negotiation.consumerPid).toBe("neg-2");
			if ("state" in secondNeg.negotiation) {
				expect(secondNeg.negotiation.state).toBe("REQUESTED");
			}
			expect(secondNeg.offerId).toBe("offer-2");
			expect(secondNeg.agreementId).toBeUndefined(); // No agreement yet

			ComponentFactory.unregister("test-pnap-history");
		});

		test("should filter negotiation history by state", async () => {
			const mockPnapAdmin = new MockPolicyNegotiationAdminPointComponent();

			// Add negotiations in different states
			mockPnapAdmin.addNegotiation(
				MockPolicyNegotiationAdminPointComponent.createSampleNegotiation({
					id: "neg-finalized",
					state: "FINALIZED",
					dateCreated: "2026-02-05T10:00:00.000Z"
				})
			);

			mockPnapAdmin.addNegotiation(
				MockPolicyNegotiationAdminPointComponent.createSampleNegotiation({
					id: "neg-requested",
					state: "REQUESTED",
					dateCreated: "2026-02-05T09:00:00.000Z"
				})
			);

			mockPnapAdmin.addNegotiation(
				MockPolicyNegotiationAdminPointComponent.createSampleNegotiation({
					id: "neg-terminated",
					state: "TERMINATED",
					dateCreated: "2026-02-05T08:00:00.000Z"
				})
			);

			ComponentFactory.register("test-pnap-filter", () => mockPnapAdmin);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				policyNegotiationAdminPointComponentType: "test-pnap-filter"
			});

			// Query only FINALIZED negotiations
			const result = await service.getNegotiationHistory("FINALIZED", undefined, "trust-payload");

			expect(result.count).toBe(1);
			expect(result.negotiations).toHaveLength(1);
			const firstNeg = result.negotiations[0].negotiation;
			if ("state" in firstNeg) {
				expect(firstNeg.state).toBe("FINALIZED");
			}
			expect(result.negotiations[0].negotiation.consumerPid).toBe("neg-finalized");

			ComponentFactory.unregister("test-pnap-filter");
		});

		test("should support pagination with cursor", async () => {
			const mockPnapAdmin = new MockPolicyNegotiationAdminPointComponent();

			// Add 15 negotiations (more than one page)
			for (let i = 0; i < 15; i++) {
				mockPnapAdmin.addNegotiation(
					MockPolicyNegotiationAdminPointComponent.createSampleNegotiation({
						id: `neg-${i}`,
						state: "FINALIZED",
						dateCreated: new Date((Date.now() - i) * 1000).toISOString()
					})
				);
			}

			ComponentFactory.register("test-pnap-pagination", () => mockPnapAdmin);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				policyNegotiationAdminPointComponentType: "test-pnap-pagination"
			});

			// First page
			const page1 = await service.getNegotiationHistory(undefined, undefined, "trust-payload");

			expect(page1.count).toBe(10); // First page has 10 items
			expect(page1.negotiations).toHaveLength(10);
			expect(page1.cursor).toBeDefined(); // Has more pages

			// Second page
			const page2 = await service.getNegotiationHistory(undefined, page1.cursor, "trust-payload");

			expect(page2.count).toBe(5); // Second page has remaining 5 items
			expect(page2.negotiations).toHaveLength(5);
			expect(page2.cursor).toBeUndefined(); // No more pages

			ComponentFactory.unregister("test-pnap-pagination");
		});

		test("should return empty history when no negotiations exist", async () => {
			const mockPnapAdmin = new MockPolicyNegotiationAdminPointComponent();

			ComponentFactory.register("test-pnap-empty", () => mockPnapAdmin);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				policyNegotiationAdminPointComponentType: "test-pnap-empty"
			});

			const result = await service.getNegotiationHistory(undefined, undefined, "trust-payload");

			expect(result.count).toBe(0);
			expect(result.negotiations).toHaveLength(0);
			expect(result.cursor).toBeUndefined();

			ComponentFactory.unregister("test-pnap-empty");
		});

		test("should throw error when PNAP not configured", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(
				service.getNegotiationHistory(undefined, undefined, "trust-payload")
			).rejects.toThrow();
		});
	});

	describe("Identity-based authorization", () => {
		test("requestTransfer should return TransferError when caller is not agreement assignee", async () => {
			ComponentFactory.register("test-trust-unauthorized", () =>
				createMockTrustComponent("did:iota:unauthorized-node")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-unauthorized"
			});

			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: `urn:uuid:${RandomHelper.generateUuidV7()}`,
				agreementId: "agreement-123",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			};

			const result = await service.requestTransfer(request, "valid-trust-payload");

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(result.code).toMatch(/^UnauthorizedError:/);
			}

			ComponentFactory.unregister("test-trust-unauthorized");
		});

		test("getTransferProcess should return TransferError when caller is neither consumer nor provider", async () => {
			const now = new Date().toISOString();
			await transferProcessStorage.set({
				consumerPid: "auth-test-consumer-pid",
				id: "auth-test-id",
				providerPid: "auth-test-provider-pid",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				agreementId: "agreement-123",
				datasetId: "urn:uuid:dataset-123",
				offerId: "agreement-123",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				dateCreated: now,
				dateModified: now
			});

			ComponentFactory.register("test-trust-unauthorized", () =>
				createMockTrustComponent("did:iota:unauthorized-node")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-unauthorized"
			});

			const result = await service.getTransferProcess(
				"auth-test-consumer-pid",
				"valid-trust-payload"
			);

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(result.code).toMatch(/^UnauthorizedError:/);
			}

			ComponentFactory.unregister("test-trust-unauthorized");
		});

		test("completeTransfer should return TransferError when caller is not the consumer", async () => {
			const now = new Date().toISOString();
			await transferProcessStorage.set({
				consumerPid: "auth-test-complete-pid",
				id: "auth-test-complete-id",
				providerPid: "auth-test-complete-provider",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				agreementId: "agreement-123",
				datasetId: "urn:uuid:dataset-123",
				offerId: "agreement-123",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				dateCreated: now,
				dateModified: now
			});

			ComponentFactory.register("test-trust-unauthorized", () =>
				createMockTrustComponent("did:iota:unauthorized-node")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-unauthorized"
			});

			const message: IDataspaceProtocolTransferCompletionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferCompletionMessage",
				consumerPid: "auth-test-complete-pid",
				providerPid: "auth-test-complete-provider"
			};

			const result = await service.completeTransfer(message, "valid-trust-payload");

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(result.code).toMatch(/^UnauthorizedError:/);
			}

			ComponentFactory.unregister("test-trust-unauthorized");
		});

		test("startTransfer should return TransferError when caller is not the provider", async () => {
			const now = new Date().toISOString();
			await transferProcessStorage.set({
				consumerPid: "auth-test-start-pid",
				id: "auth-test-start-id",
				providerPid: "auth-test-start-provider",
				state: DataspaceProtocolTransferProcessStateType.REQUESTED,
				agreementId: "agreement-123",
				datasetId: "urn:uuid:dataset-123",
				offerId: "agreement-123",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				dateCreated: now,
				dateModified: now
			});

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferStartMessage",
				consumerPid: "auth-test-start-pid",
				providerPid: "auth-test-start-provider"
			};

			const result = await service.startTransfer(
				message,
				"https://test-origin.com",
				"valid-trust-payload"
			);

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(result.code).toMatch(/^UnauthorizedError:/);
			}
		});

		test("completeTransfer should return TransferError when caller is the provider (not consumer)", async () => {
			const now = new Date().toISOString();
			await transferProcessStorage.set({
				consumerPid: "auth-test-complete-provider-pid",
				id: "auth-test-complete-provider-id",
				providerPid: "auth-test-complete-provider-ppid",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				agreementId: "agreement-123",
				datasetId: "urn:uuid:dataset-123",
				offerId: "agreement-123",
				consumerIdentity: "did:iota:other-consumer",
				providerIdentity: "did:iota:consumer-node-abc",
				dateCreated: now,
				dateModified: now
			});

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const message: IDataspaceProtocolTransferCompletionMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferCompletionMessage",
				consumerPid: "auth-test-complete-provider-pid",
				providerPid: "auth-test-complete-provider-ppid"
			};

			const result = await service.completeTransfer(message, "valid-trust-payload");

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
			if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
				expect(result.code).toMatch(/^UnauthorizedError:/);
			}
		});

		test("requestTransfer should succeed when caller matches one of multiple agreement assignees", async () => {
			ComponentFactory.register("test-trust-multi-assignee", () =>
				createMockTrustComponent("did:iota:consumer-node-abc")
			);

			const service = new DataspaceControlPlaneService({
				...DEFAULT_SERVICE_OPTIONS,
				trustComponentType: "test-trust-multi-assignee"
			});

			const request: IDataspaceProtocolTransferRequestMessage = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "TransferRequestMessage",
				consumerPid: `urn:uuid:${RandomHelper.generateUuidV7()}`,
				agreementId: "agreement-multi-assignee",
				callbackAddress: "https://consumer.example.com/callback",
				format: "application/json"
			};

			const result = await service.requestTransfer(request, "valid-trust-payload");

			expect(result["@type"]).not.toBe(DataspaceProtocolTransferProcessTypes.TransferError);

			ComponentFactory.unregister("test-trust-multi-assignee");
		});

		test("authorized consumer should successfully access transfer process", async () => {
			const now = new Date().toISOString();
			await transferProcessStorage.set({
				consumerPid: "auth-test-ok-pid",
				id: "auth-test-ok-id",
				providerPid: "auth-test-ok-provider",
				state: DataspaceProtocolTransferProcessStateType.STARTED,
				agreementId: "agreement-123",
				datasetId: "urn:uuid:dataset-123",
				offerId: "agreement-123",
				consumerIdentity: "did:iota:consumer-node-abc",
				providerIdentity: "did:iota:provider-node-xyz",
				dateCreated: now,
				dateModified: now
			});

			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const result = await service.getTransferProcess("auth-test-ok-pid", "valid-trust-payload");

			expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferProcess);
		});
	});

	describe("Dataset CRUD (tenant-scoped admin surface)", () => {
		const TEST_TENANT_A = "did:iota:test-tenant";
		const TEST_TENANT_B = "did:iota:other-tenant";
		const TEST_NODE_ID = "did:iota:test-node";
		const TEST_APP_ID = "https://twin.example.org/app1";

		// Register a minimal mock app under TEST_APP_ID so publishDataset's
		// DataspaceAppFactory.get lookup succeeds. The mock has no
		// `datasetsHandled` override so the default populate path is exercised.
		beforeEach(() => {
			DataspaceAppFactory.register(TEST_APP_ID, () => ({
				className: () => "MockDataspaceApp",
				activitiesHandled: () => [],
				supportedQueryTypes: () => []
			}));
		});

		afterEach(() => {
			try {
				DataspaceAppFactory.unregister(TEST_APP_ID);
			} catch {
				// Already gone, ignore.
			}
		});

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

		test("createAppDataset persists the entity with the calling tenant captured", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await service.createAppDataset(
				"ds-1",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/data-service-1") as never
			);

			const stored = await dataspaceAppDatasetStorage.get("ds-1");
			expect(stored).toBeDefined();
			expect(stored?.id).toBe("ds-1");
			expect(stored?.appId).toBe(TEST_APP_ID);
			expect(stored?.tenantId).toBe(TEST_TENANT_A);
			expect(stored?.nodeIdentity).toBe(TEST_NODE_ID);
			// `@id` is stripped from the stored blob — entity.id is the source of truth.
			expect((stored?.dataset as { "@id"?: string })["@id"]).toBeUndefined();
			expect(stored?.dataset?.["@type"]).toBe("Dataset");
		});

		test("createAppDataset rejects duplicate id with datasetAlreadyExists", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await service.createAppDataset(
				"ds-dup",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/data-service-dup") as never
			);

			await expect(
				service.createAppDataset(
					"ds-dup",
					TEST_APP_ID,
					buildDataset("https://twin.example.org/data-service-dup") as never
				)
			).rejects.toMatchObject({
				name: "GeneralError",
				message: expect.stringContaining("datasetAlreadyExists")
			});
		});

		test("createAppDataset publishes the dataset to fedcat in the calling tenant context", async () => {
			const setSpy = vi.spyOn(mockFedCat, "set");
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await service.createAppDataset(
				"https://twin.example.org/ds-publish",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-publish") as never
			);

			// fedcat.set was called once during the inline publish flow.
			expect(setSpy).toHaveBeenCalledTimes(1);
			const publishedDataset = setSpy.mock.calls[0][0] as { "@id"?: string };
			expect(publishedDataset["@id"]).toBe("https://twin.example.org/ds-publish");
		});

		test("getAppDataset returns the app when the calling tenant owns it", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await service.createAppDataset(
				"ds-get",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-get") as never
			);

			const result = await service.getAppDataset("ds-get");
			expect(result.id).toBe("ds-get");
			expect(result.appId).toBe(TEST_APP_ID);
		});

		test("getAppDataset throws NotFoundError for an id that does not exist", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(service.getAppDataset("does-not-exist")).rejects.toMatchObject({
				name: "NotFoundError",
				message: expect.stringContaining("datasetNotFound")
			});
		});

		test("getAppDataset rejects cross-tenant reads with datasetWrongTenant", async () => {
			// Create as Tenant A.
			const serviceA = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			await serviceA.createAppDataset(
				"ds-cross",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-cross") as never
			);

			// Switch context to Tenant B; same service instance.
			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: TEST_NODE_ID,
				[ContextIdKeys.Tenant]: TEST_TENANT_B,
				[ContextIdKeys.Organization]: "did:iota:other-org"
			});

			await expect(serviceA.getAppDataset("ds-cross")).rejects.toMatchObject({
				name: "UnauthorizedError",
				message: expect.stringContaining("datasetWrongTenant")
			});
		});

		test("listDatasets returns only the calling tenant's records", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Two records under Tenant A.
			await service.createAppDataset(
				"ds-a-1",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-a-1") as never
			);
			await service.createAppDataset(
				"ds-a-2",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-a-2") as never
			);

			// One record under Tenant B (seeded directly into storage to skip
			// the context switch dance).
			const now = new Date().toISOString();
			await dataspaceAppDatasetStorage.set({
				id: "ds-b-1",
				nodeIdentity: TEST_NODE_ID,
				tenantId: TEST_TENANT_B,
				appId: TEST_APP_ID,
				dataset: buildDataset("https://twin.example.org/ds-b-1") as never,
				dateCreated: now,
				dateModified: now
			});

			const page = await service.listAppDatasets();
			expect(page.entities.map(e => e.id).sort()).toEqual(["ds-a-1", "ds-a-2"]);
		});

		test("updateAppDataset rewrites the app dataset and re-publishes to fedcat", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await service.createAppDataset(
				"ds-upd",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-upd-v1") as never
			);

			const setSpy = vi.spyOn(mockFedCat, "set");
			await service.updateAppDataset(
				"ds-upd",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-upd-v2") as never
			);

			// updateAppDataset publishes once (the spy was attached AFTER the
			// initial create's publish).
			expect(setSpy).toHaveBeenCalledTimes(1);
			const stored = await dataspaceAppDatasetStorage.get("ds-upd");
			// `@id` is stripped from the stored blob; entity.id is the source of truth.
			expect((stored?.dataset as { "@id"?: string })["@id"]).toBeUndefined();
			expect(stored?.id).toBe("ds-upd");
		});

		test("updateAppDataset rejects cross-tenant writes with datasetWrongTenant", async () => {
			const serviceA = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			await serviceA.createAppDataset(
				"ds-upd-cross",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-upd-cross") as never
			);

			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: TEST_NODE_ID,
				[ContextIdKeys.Tenant]: TEST_TENANT_B,
				[ContextIdKeys.Organization]: "did:iota:other-org"
			});

			await expect(
				serviceA.updateAppDataset(
					"ds-upd-cross",
					TEST_APP_ID,
					buildDataset("https://twin.example.org/ds-upd-cross-hijack") as never
				)
			).rejects.toMatchObject({
				name: "UnauthorizedError",
				message: expect.stringContaining("datasetWrongTenant")
			});
		});

		test("deleteAppDataset removes the app dataset and the corresponding fedcat dataset", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const datasetId = "https://twin.example.org/ds-del";
			await service.createAppDataset(datasetId, TEST_APP_ID, buildDataset(datasetId) as never);

			const removeSpy = vi.spyOn(mockFedCat, "remove");
			await service.deleteAppDataset(datasetId);

			// Local storage removed.
			const stored = await dataspaceAppDatasetStorage.get(datasetId);
			expect(stored).toBeUndefined();
			// fedcat removal called with the dataset @id (which IS the entity id).
			expect(removeSpy).toHaveBeenCalledTimes(1);
			expect(removeSpy.mock.calls[0][0]).toBe(datasetId);
		});

		test("deleteAppDataset rejects cross-tenant deletes with datasetWrongTenant", async () => {
			const serviceA = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
			await serviceA.createAppDataset(
				"ds-del-cross",
				TEST_APP_ID,
				buildDataset("https://twin.example.org/ds-del-cross") as never
			);

			vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
				[ContextIdKeys.Node]: TEST_NODE_ID,
				[ContextIdKeys.Tenant]: TEST_TENANT_B,
				[ContextIdKeys.Organization]: "did:iota:other-org"
			});

			await expect(serviceA.deleteAppDataset("ds-del-cross")).rejects.toMatchObject({
				name: "UnauthorizedError",
				message: expect.stringContaining("datasetWrongTenant")
			});

			// The record must still be present — denied delete shouldn't side-effect.
			const stored = await dataspaceAppDatasetStorage.get("ds-del-cross");
			expect(stored).toBeDefined();
		});

		test("deleteAppDataset throws NotFoundError when the id does not exist", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			await expect(service.deleteAppDataset("does-not-exist")).rejects.toMatchObject({
				name: "NotFoundError",
				message: expect.stringContaining("datasetNotFound")
			});
		});

		test("publishDataset wraps fedcat.set in the app dataset's tenant context", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Spy on ContextIdStore.run so we can read the override map the
			// publish loop passes in. This is the load-bearing invariant of
			// when fedcat.set() runs inside the wrap, it must see
			// `Tenant = dataset.tenantId`, regardless of the request/engine
			// startup tenant.
			//
			// We assert on the run wrapper's arguments rather than the
			// `ContextIdStore.getContextIds()` value seen inside the wrapped
			// callback, because the test's beforeEach replaces
			// `getContextIds` with a fixed mock that doesn't honour the
			// AsyncLocalStorage-backed override.
			const runSpy = vi.spyOn(ContextIdStore, "run");

			const now = new Date().toISOString();
			const appDataset: DataspaceAppDataset = {
				id: "ds-publish-tenant",
				nodeIdentity: TEST_NODE_ID,
				tenantId: TEST_TENANT_B,
				appId: TEST_APP_ID,
				dataset: buildDataset("https://twin.example.org/ds-publish-tenant") as never,
				dateCreated: now,
				dateModified: now
			};
			await dataspaceAppDatasetStorage.set(appDataset);

			EngineCoreFactory.register("engine", () => createMockEngineCore(false));
			try {
				await service.start();
			} finally {
				EngineCoreFactory.unregister("engine");
			}

			// Filter out any unrelated `ContextIdStore.run` calls (e.g. inner
			// service plumbing); we only care about the publish wrap that
			// passed our app dataset's tenantId.
			const wrapWithTenantB = runSpy.mock.calls.find(
				([ids]) => (ids as { [key: string]: string })?.[ContextIdKeys.Tenant] === TEST_TENANT_B
			);
			expect(wrapWithTenantB).toBeDefined();
		});

		test("publishDataset calls populateDefaults even when app overrides datasetsHandled", async () => {
			// Register an app whose datasetsHandled returns a dataset WITHOUT
			// `dcterms:publisher`. The framework should stamp publisher from
			// the org context regardless of which path produced the dataset.
			const APP_WITH_OVERRIDE = "https://twin.example.org/app-with-override";
			DataspaceAppFactory.register(APP_WITH_OVERRIDE, () => ({
				className: () => "MockAppWithOverride",
				activitiesHandled: () => [],
				supportedQueryTypes: () => [],
				datasetsHandled: async () => [
					{
						"@context": [DataspaceProtocolContexts.JsonLdContext],
						"@id": "https://twin.example.org/from-override",
						"@type": "Dataset",
						hasPolicy: [],
						distribution: []
					} as never
				]
			}));

			try {
				const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);
				const setSpy = vi.spyOn(mockFedCat, "set");

				await service.createAppDataset(
					"https://twin.example.org/seed",
					APP_WITH_OVERRIDE,
					buildDataset("https://twin.example.org/seed") as never
				);

				expect(setSpy).toHaveBeenCalledTimes(1);
				const publishedDataset = setSpy.mock.calls[0][0] as { "dcterms:publisher"?: string };
				expect(publishedDataset["dcterms:publisher"]).toBe("did:iota:provider-node-xyz");
			} finally {
				DataspaceAppFactory.unregister(APP_WITH_OVERRIDE);
			}
		});

		test("createAppDataset uses dataset @id as storage key when no explicit id is provided", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const datasetId = "https://twin.example.org/derived-from-at-id";
			const resolvedId = await service.createAppDataset(
				undefined,
				TEST_APP_ID,
				buildDataset(datasetId) as never
			);

			expect(resolvedId).toBe(datasetId);
			const stored = await dataspaceAppDatasetStorage.get(datasetId);
			expect(stored?.id).toBe(datasetId);
			expect((stored?.dataset as { "@id"?: string })["@id"]).toBeUndefined();
		});

		test("createAppDataset auto-generates a UUID when neither id nor dataset @id is provided", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Build a dataset payload deliberately without `@id`.
			const datasetWithoutId = {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": "Dataset",
				hasPolicy: [],
				distribution: []
			};

			const resolvedId = await service.createAppDataset(
				undefined,
				TEST_APP_ID,
				datasetWithoutId as never
			);

			// UUID v7 (compact) is a 32-char lowercase hex string.
			expect(resolvedId).toMatch(/^[\da-f]{32}$/);
			const stored = await dataspaceAppDatasetStorage.get(resolvedId);
			expect(stored?.id).toBe(resolvedId);
		});

		test("createAppDataset: explicit id wins when explicit id and dataset @id differ", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const explicitId = "explicit-storage-id";
			const datasetAtId = "https://twin.example.org/payload-at-id";

			const resolvedId = await service.createAppDataset(
				explicitId,
				TEST_APP_ID,
				buildDataset(datasetAtId) as never
			);

			expect(resolvedId).toBe(explicitId);
			// Nothing stored under the payload's @id.
			const storedAtId = await dataspaceAppDatasetStorage.get(datasetAtId);
			expect(storedAtId).toBeUndefined();
			// Stored under the explicit id, with @id stripped.
			const stored = await dataspaceAppDatasetStorage.get(explicitId);
			expect(stored?.id).toBe(explicitId);
			expect((stored?.dataset as { "@id"?: string })["@id"]).toBeUndefined();
		});

		test("getAppDataset re-stamps @id from entity.id on read", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			// Seed storage directly with a app dataset blob that has no @id.
			const id = "ds-restamp";
			const now = new Date().toISOString();
			await dataspaceAppDatasetStorage.set({
				id,
				nodeIdentity: TEST_NODE_ID,
				tenantId: TEST_TENANT_A,
				appId: TEST_APP_ID,
				dataset: {
					"@context": [DataspaceProtocolContexts.JsonLdContext],
					"@type": "Dataset",
					hasPolicy: [],
					distribution: []
				},
				dateCreated: now,
				dateModified: now
			});

			const result = await service.getAppDataset(id);
			// @id on the returned dataset is re-stamped from entity.id.
			expect((result.dataset as { "@id"?: string })["@id"]).toBe(id);
		});

		test("updateAppDataset strips @id from new payload — path id stays authoritative", async () => {
			const service = new DataspaceControlPlaneService(DEFAULT_SERVICE_OPTIONS);

			const pathId = "ds-immutable-id";
			await service.createAppDataset(
				pathId,
				TEST_APP_ID,
				buildDataset("https://twin.example.org/initial") as never
			);

			// Update with a payload whose @id differs from the path id.
			await service.updateAppDataset(
				pathId,
				TEST_APP_ID,
				buildDataset("https://twin.example.org/different-at-id") as never
			);

			const stored = await dataspaceAppDatasetStorage.get(pathId);
			// The storage key did not change.
			expect(stored?.id).toBe(pathId);
			// @id was stripped from the stored blob.
			expect((stored?.dataset as { "@id"?: string })["@id"]).toBeUndefined();
			// And no entity was stored under the body's @id.
			const storedAtId = await dataspaceAppDatasetStorage.get(
				"https://twin.example.org/different-at-id"
			);
			expect(storedAtId).toBeUndefined();
		});
	});
});
