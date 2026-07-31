// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { HttpContextIdKeys } from "@twin.org/api-models";
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory, Converter } from "@twin.org/core";
import {
	DataspaceTransferFormat,
	TransferTerminationCode,
	type DataspaceAppDataset,
	type IDataspaceControlPlaneComponent,
	type ITransferCallback,
	type TransferProcess,
	type TransferRetrieval
} from "@twin.org/dataspace-models";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import type { ILogEntry, ILoggingComponent } from "@twin.org/logging-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import {
	DataspaceProtocolContexts,
	DataspaceProtocolTransferProcessStateType,
	DataspaceProtocolTransferProcessTypes,
	type IDataspaceProtocolTransferStartMessage
} from "@twin.org/standards-dataspace-protocol";
import type { ITrustComponent } from "@twin.org/trust-models";
import { DataspaceControlPlaneService } from "../src/dataspaceControlPlaneService.js";
import { MockFederatedCatalogueComponent } from "./mocks/mockFederatedCatalogue.js";
import { MockPolicyAdministrationPointComponent } from "./mocks/mockPolicyAdministrationPoint.js";
import { MockPolicyNegotiationPointComponent } from "./mocks/mockPolicyNegotiationPoint.js";
import { setupTestEnv } from "./setupTestEnv.js";
import type { IDataspaceControlPlaneServiceConfig } from "../src/models/IDataspaceControlPlaneServiceConfig.js";

// Two-node identities. agreement-123 is pre-seeded in MockPolicyAdministrationPointComponent
// (assigner=PROVIDER_ORG, assignee=CONSUMER_ORG, target=urn:uuid:dataset-123) and reused as the shared
// agreement so both nodes resolve the same provider/consumer/dataset triple.
const PROVIDER_ORG = "did:iota:provider-node-xyz";
const CONSUMER_ORG = "did:iota:consumer-node-abc";
// A provider tenant-routing org DISTINCT from the agreement assigner (PROVIDER_ORG). Used to exercise the
// org != assigner identity-space split: the cross-node start token must be minted under the assigner DID,
// not this tenant org.
const PROVIDER_TENANT_ORG = "did:iota:provider-tenant-999";
const AGREEMENT_ID = "agreement-123";

const PROVIDER_ENDPOINT = "https://provider.example.com";
const CONSUMER_ORIGIN = "https://consumer.example.com";

// Component / storage type names. Each node gets its OWN transfer-process storage
// so the two services are genuinely separate "nodes".
const PROVIDER_TP_STORAGE = "provider-transfer-process";
const CONSUMER_TP_STORAGE = "consumer-transfer-process";
const SHARED_DATASET_STORAGE = nameofKebabCase<DataspaceAppDataset>();
const REMOTE_CP_TYPE = "loopback-remote-control-plane";

/**
 * Decode the `iss` claim embedded by createMockTrustComponent.generate().
 * generate() returns `mock-jwt.<base64(JSON)>.mock-signature` where the JSON
 * carries `iss: issuerIdentity`. This lets a token issued by one node verify
 * to the correct issuer identity on the other node, simulating cross-node
 * verifiable trust.
 * @param token The mock token string.
 * @returns The decoded issuer identity, or undefined if it cannot be decoded.
 */
function decodeIssuer(token: unknown): string | undefined {
	if (typeof token !== "string") {
		return undefined;
	}
	const parts = token.split(".");
	if (parts.length !== 3) {
		return undefined;
	}
	try {
		const json = Converter.bytesToUtf8(Converter.base64ToBytes(parts[1]));
		const payload = JSON.parse(json) as { iss?: string };
		return payload.iss;
	} catch {
		return undefined;
	}
}

/**
 * Creates a trust component that DECODES the identity encoded in the token, so a
 * provider-issued token verifies to PROVIDER_ORG on the consumer node and vice
 * versa. generate() reuses the encoding from createMockTrustComponent so it
 * round-trips through verify().
 * @returns A decoding ITrustComponent shared by both nodes.
 */
function createDecodingTrustComponent(): ITrustComponent {
	return {
		className: () => "DecodingTrustComponent",
		verify: async (payload: unknown) => {
			const identity = decodeIssuer(payload);
			return {
				verified: true,
				info: {
					token: payload as string,
					// Fallback only used by guard-payloads that are not generated tokens.
					identity: identity ?? CONSUMER_ORG
				}
			};
		},
		generate: async (
			issuerIdentity: string,
			generatorType?: string,
			options?: { subject?: unknown }
		) => {
			const payload = {
				iss: issuerIdentity,
				sub: options?.subject ?? {},
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 86400
			};
			const payloadBase64 = Converter.bytesToBase64(Converter.utf8ToBytes(JSON.stringify(payload)));
			return `mock-jwt.${payloadBase64}.mock-signature`;
		}
	};
}

describe("DataspaceControlPlaneService - two-node transfer start integration (auto-start and explicit)", () => {
	let providerService: DataspaceControlPlaneService;
	let consumerService: DataspaceControlPlaneService;
	let consumerStorage: MemoryEntityStorageConnector<TransferProcess>;
	let providerStorage: MemoryEntityStorageConnector<TransferProcess>;
	let transferRetrievalStorage: MemoryEntityStorageConnector<TransferRetrieval>;
	let consumerCallback: ITransferCallback;
	let loggingComponent: ILoggingComponent;

	beforeAll(async () => {
		await setupTestEnv();
	});

	/**
	 * Register the shared mock dependencies (PAP, FedCat, PNP, decoding trust),
	 * the two node storages, and the loopback remote control plane factory.
	 * The loopback routes outbound calls to the peer service, wrapping each in the peer's own organization context.
	 * @param autoStart When true, the provider node is configured with autoStartTransfers=true so it
	 * auto-starts a requested transfer (a provider-side decision; the consumer never requests it).
	 * Defaults to false (no auto-start).
	 * @param providerContextOrg The provider node's tenant-routing organization context. Defaults to
	 * PROVIDER_ORG (org == agreement assigner). Pass a distinct value to exercise the org != assigner split.
	 * @param providerExtraConfig Additional provider-node service config merged over the shared defaults.
	 */
	function arrangeTwoNodes(
		autoStart: boolean = false,
		providerContextOrg: string = PROVIDER_ORG,
		providerExtraConfig: Partial<IDataspaceControlPlaneServiceConfig> = {}
	): void {
		ComponentFactory.register("test-pap", () => new MockPolicyAdministrationPointComponent());
		ComponentFactory.register("test-fedcat", () => new MockFederatedCatalogueComponent());
		ComponentFactory.register("test-pnp", () => new MockPolicyNegotiationPointComponent());
		// A single shared decoding trust: it decodes whatever token it is given,
		// so it correctly resolves provider-issued tokens to PROVIDER_ORG and
		// consumer-issued tokens to CONSUMER_ORG on either node.
		ComponentFactory.register("test-trust", () => createDecodingTrustComponent());
		// Recording logging component shared by both nodes, so tests can assert log entries.
		loggingComponent = {
			className: () => "test-logging",
			log: vi.fn().mockResolvedValue(undefined),
			query: vi.fn().mockResolvedValue({ entities: [] })
		};
		ComponentFactory.register("test-logging", () => loggingComponent);

		// Each node has its own transfer-process storage. A distinct `storageKey` is REQUIRED to give two
		// connectors with the same entitySchema separate backing storage (per the connector's config), so
		// the provider and consumer nodes stay isolated.
		providerStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>(),
			config: { storageKey: PROVIDER_TP_STORAGE }
		});
		consumerStorage = new MemoryEntityStorageConnector<TransferProcess>({
			entitySchema: nameof<TransferProcess>(),
			config: { storageKey: CONSUMER_TP_STORAGE }
		});
		EntityStorageConnectorFactory.register(PROVIDER_TP_STORAGE, () => providerStorage);
		EntityStorageConnectorFactory.register(CONSUMER_TP_STORAGE, () => consumerStorage);
		transferRetrievalStorage = new MemoryEntityStorageConnector<TransferRetrieval>({
			entitySchema: nameof<TransferRetrieval>(),
			config: { storageKey: "transfer-retrieval" }
		});
		EntityStorageConnectorFactory.register(
			nameofKebabCase<TransferRetrieval>(),
			() => transferRetrievalStorage
		);
		EntityStorageConnectorFactory.register(
			SHARED_DATASET_STORAGE,
			() =>
				new MemoryEntityStorageConnector<DataspaceAppDataset>({
					entitySchema: nameof<DataspaceAppDataset>(),
					config: { storageKey: "dataspace-app-dataset" }
				})
		);

		const sharedDeps = {
			policyAdministrationPointComponentType: "test-pap",
			policyNegotiationPointComponentType: "test-pnp",
			federatedCatalogueComponentType: "test-fedcat",
			trustComponentType: "test-trust",
			loggingComponentType: "test-logging",
			dataspaceAppDatasetEntityStorageType: SHARED_DATASET_STORAGE,
			remoteControlPlaneComponentType: REMOTE_CP_TYPE,
			config: { dataPlanePath: "data-plane/data" }
		};

		// Provider node. Auto-start is a provider-side decision via the autoStartTransfers config
		// (the consumer cannot request it); the loopback calls requestTransfer with no consumer options.
		providerService = new DataspaceControlPlaneService({
			...sharedDeps,
			transferProcessEntityStorageType: PROVIDER_TP_STORAGE,
			config: { ...sharedDeps.config, autoStartTransfers: autoStart, ...providerExtraConfig }
		});

		// Consumer node (consumers never auto-start).
		consumerService = new DataspaceControlPlaneService({
			...sharedDeps,
			transferProcessEntityStorageType: CONSUMER_TP_STORAGE
		});

		consumerCallback = {
			onStateChanged: vi.fn().mockResolvedValue(undefined),
			onStarted: vi.fn().mockResolvedValue(undefined),
			onCompleted: vi.fn().mockResolvedValue(undefined),
			onSuspended: vi.fn().mockResolvedValue(undefined),
			onTerminated: vi.fn().mockResolvedValue(undefined)
		};
		consumerService.registerTransferCallback("consumer-listener", consumerCallback);

		// Loopback remote: ComponentFactory.create(REMOTE_CP_TYPE, { endpoint }) returns
		// a router whose method calls are forwarded to the peer service, each wrapped in
		// the peer node's own organization context (as that node's TenantProcessor would).
		ComponentFactory.register(REMOTE_CP_TYPE, (args?: unknown) => {
			const endpoint = (args as { endpoint?: string } | undefined)?.endpoint ?? "";
			const routesToProvider = endpoint.includes("provider");
			const target = routesToProvider ? providerService : consumerService;
			const targetOrigin = routesToProvider ? PROVIDER_ENDPOINT : CONSUMER_ORIGIN;
			// Node stays the node's own DID (keeps storage partitioning identical to the other tests);
			// only the provider's Organization can diverge, to model org != assigner.
			const targetContext = {
				[ContextIdKeys.Node]: routesToProvider ? PROVIDER_ORG : CONSUMER_ORG,
				[ContextIdKeys.Organization]: routesToProvider ? providerContextOrg : CONSUMER_ORG,
				[HttpContextIdKeys.PublicOrigin]: targetOrigin
			};

			// Only the outbound DSP methods are invoked through the remote; typing the literal as a Pick
			// gives the arrow params their contextual types (no implicit any) while staying a complete
			// implementation of that subset. Cast to the full component at return.
			const router: Pick<
				IDataspaceControlPlaneComponent,
				| "requestTransfer"
				| "startTransfer"
				| "completeTransfer"
				| "suspendTransfer"
				| "terminateTransfer"
			> = {
				requestTransfer: async (request, trustPayload) =>
					ContextIdStore.run(targetContext, async () =>
						target.requestTransfer(request, trustPayload)
					),
				startTransfer: async (message, trustPayload) =>
					ContextIdStore.run(targetContext, async () =>
						target.startTransfer(message, trustPayload)
					),
				completeTransfer: async (message, trustPayload) =>
					ContextIdStore.run(targetContext, async () =>
						target.completeTransfer(message, trustPayload)
					),
				suspendTransfer: async (message, trustPayload) =>
					ContextIdStore.run(targetContext, async () =>
						target.suspendTransfer(message, trustPayload)
					),
				terminateTransfer: async (message, trustPayload) =>
					ContextIdStore.run(targetContext, async () =>
						target.terminateTransfer(message, trustPayload)
					)
			};

			return router as unknown as IDataspaceControlPlaneComponent;
		});
	}

	afterEach(async () => {
		for (const type of [
			"test-pap",
			"test-fedcat",
			"test-pnp",
			"test-trust",
			"test-logging",
			REMOTE_CP_TYPE
		]) {
			try {
				ComponentFactory.unregister(type);
			} catch {
				// Ignore if not registered.
			}
		}
		for (const type of [
			PROVIDER_TP_STORAGE,
			CONSUMER_TP_STORAGE,
			SHARED_DATASET_STORAGE,
			nameofKebabCase<TransferRetrieval>()
		]) {
			try {
				EntityStorageConnectorFactory.unregister(type);
			} catch {
				// Ignore if not registered.
			}
		}
		vi.restoreAllMocks();
	});

	test("provider auto-starts and the consumer onStarted fires with the provider's dataAddress", async () => {
		arrangeTwoNodes(true);

		// Resolve when the consumer's onStarted spy fires; fail loudly if it never does.
		let resolveStarted: (message: IDataspaceProtocolTransferStartMessage) => void;
		const onStartedFired = new Promise<IDataspaceProtocolTransferStartMessage>(
			(resolve, reject) => {
				resolveStarted = resolve;
				setTimeout(() => reject(new Error("Timed out waiting for consumer onStarted")), 3000);
			}
		);
		vi.mocked(consumerCallback.onStarted).mockImplementation(
			async (consumerPid: string, message: IDataspaceProtocolTransferStartMessage) => {
				resolveStarted(message);
			}
		);

		// The consumer issues its own outbound token (encodes CONSUMER_ORG) and acts in
		// its own organization context. providerEndpoint contains "provider";
		// the publicOrigin (callback) contains "consumer".
		const consumerToken = await createDecodingTrustComponent().generate(CONSUMER_ORG);
		const { consumerPid } = await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: CONSUMER_ORG,
				[ContextIdKeys.Organization]: CONSUMER_ORG,
				[HttpContextIdKeys.PublicOrigin]: CONSUMER_ORIGIN
			},
			async () =>
				consumerService.prepareTransfer(
					AGREEMENT_ID,
					PROVIDER_ENDPOINT,
					DataspaceTransferFormat.HttpDataPull,
					consumerToken
				)
		);

		const startMessage = await onStartedFired;

		// The consumer's onStarted fired with the consumerPid and the provider's
		// PULL dataAddress endpoint.
		expect(consumerCallback.onStarted).toHaveBeenCalledWith(
			consumerPid,
			expect.objectContaining({
				consumerPid,
				dataAddress: expect.objectContaining({
					endpoint: expect.stringContaining(PROVIDER_ENDPOINT)
				})
			})
		);
		expect(startMessage.dataAddress?.endpoint).toContain(PROVIDER_ENDPOINT);

		// onStateChanged(STARTED) fired and the consumer's stored record reached STARTED.
		expect(consumerCallback.onStateChanged).toHaveBeenCalledWith(
			consumerPid,
			DataspaceProtocolTransferProcessStateType.STARTED
		);
		const storedConsumer = await consumerStorage.get(consumerPid, "consumerPid");
		expect(storedConsumer?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);

		// The provider-built PULL dataAddress was persisted on the consumer record and is
		// re-readable via queryDataTransfer without a new start.
		expect(storedConsumer?.dataAddress?.endpoint).toContain(PROVIDER_ENDPOINT);
		const queried = await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: CONSUMER_ORG,
				[ContextIdKeys.Organization]: CONSUMER_ORG,
				[HttpContextIdKeys.PublicOrigin]: CONSUMER_ORIGIN
			},
			async () =>
				consumerService.queryDataTransfer(
					AGREEMENT_ID,
					DataspaceProtocolTransferProcessStateType.STARTED,
					undefined,
					consumerToken
				)
		);
		expect(queried.transfers).toHaveLength(1);
		expect(queried.transfers[0].consumerPid).toBe(consumerPid);
		expect(queried.transfers[0].dataAddress?.endpoint).toContain(PROVIDER_ENDPOINT);

		// Provider-side record also reached STARTED (the auto-start really ran).
		const providerEntities = await providerStorage.query();
		const providerRecord = providerEntities.entities.find(
			e => (e as TransferProcess).consumerPid === consumerPid
		) as TransferProcess | undefined;
		expect(providerRecord?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
	});

	test("delivers the start under the assigner identity when the provider's org context differs (org != assigner)", async () => {
		// The provider node runs in a tenant org distinct from the agreement assigner. The cross-node start
		// token must be minted under the assigner DID the consumer's gate checks (providerIdentity), NOT the
		// tenant org — otherwise the consumer silently rejects every delivery and never reaches STARTED.
		arrangeTwoNodes(true, PROVIDER_TENANT_ORG);

		let resolveStarted: (message: IDataspaceProtocolTransferStartMessage) => void = () => {};
		const onStartedFired = new Promise<IDataspaceProtocolTransferStartMessage>(
			(resolve, reject) => {
				resolveStarted = resolve;
				setTimeout(() => reject(new Error("Timed out waiting for consumer onStarted")), 3000);
			}
		);
		vi.mocked(consumerCallback.onStarted).mockImplementation(async (consumerPid, message) => {
			resolveStarted(message);
		});

		const consumerToken = await createDecodingTrustComponent().generate(CONSUMER_ORG);
		const { consumerPid } = await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: CONSUMER_ORG,
				[ContextIdKeys.Organization]: CONSUMER_ORG,
				[HttpContextIdKeys.PublicOrigin]: CONSUMER_ORIGIN
			},
			async () =>
				consumerService.prepareTransfer(
					AGREEMENT_ID,
					PROVIDER_ENDPOINT,
					DataspaceTransferFormat.HttpDataPull,
					consumerToken
				)
		);

		// Rejects (times out) on the pre-fix code, where the token was minted under PROVIDER_TENANT_ORG and
		// the consumer's `=== providerIdentity` gate rejected it.
		await onStartedFired;

		expect(consumerCallback.onStarted).toHaveBeenCalledWith(consumerPid, expect.anything());
		const storedConsumer = await consumerStorage.get(consumerPid, "consumerPid");
		expect(storedConsumer?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);

		// Confirm the provider record genuinely carried a tenant org distinct from the assigner identity, so
		// the successful delivery above really exercised the org != assigner path.
		const providerEntities = await providerStorage.query();
		const providerRecord = providerEntities.entities.find(
			e => (e as TransferProcess).consumerPid === consumerPid
		) as TransferProcess | undefined;
		expect(providerRecord?.organizationIdentity).toBe(PROVIDER_TENANT_ORG);
		expect(providerRecord?.providerIdentity).toBe(PROVIDER_ORG);
	});

	test("logs the TransferError diagnostics when the auto-start fails with an error result", async () => {
		arrangeTwoNodes(true);

		// Fail verification of provider-issued tokens only, so the deferred auto-start's self-token is
		// rejected and transferStarted returns a TransferError result (the throwing paths are covered by
		// the catch branch). Consumer-issued tokens still verify, so the request leg succeeds.
		const trustComponent = ComponentFactory.get<ITrustComponent>("test-trust");
		const originalVerify = trustComponent.verify;
		vi.spyOn(trustComponent, "verify").mockImplementation(async payload => {
			if (decodeIssuer(payload) === PROVIDER_ORG) {
				return { verified: false };
			}
			return originalVerify(payload);
		});

		// Resolve when the provider's autoStartFailed log lands; fail loudly if it never does.
		let resolveFailed: (entry: ILogEntry) => void = () => {};
		const autoStartFailedLogged = new Promise<ILogEntry>((resolve, reject) => {
			resolveFailed = resolve;
			setTimeout(() => reject(new Error("Timed out waiting for the autoStartFailed log")), 3000);
		});
		vi.mocked(loggingComponent.log).mockImplementation(async entry => {
			if (entry.message === "autoStartFailed") {
				resolveFailed(entry);
			}
		});

		const consumerToken = await createDecodingTrustComponent().generate(CONSUMER_ORG);
		const { consumerPid } = await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: CONSUMER_ORG,
				[ContextIdKeys.Organization]: CONSUMER_ORG,
				[HttpContextIdKeys.PublicOrigin]: CONSUMER_ORIGIN
			},
			async () =>
				consumerService.prepareTransfer(
					AGREEMENT_ID,
					PROVIDER_ENDPOINT,
					DataspaceTransferFormat.HttpDataPull,
					consumerToken
				)
		);

		// The log entry carries the TransferError diagnostics, not just the consumerPid.
		const entry = await autoStartFailedLogged;
		expect(entry.data).toEqual(
			expect.objectContaining({
				consumerPid,
				code: expect.stringContaining("UnauthorizedError")
			})
		);
		expect(entry.error).toEqual(
			expect.objectContaining({
				name: "UnauthorizedError"
			})
		);

		// The start never happened: no consumer notification, provider record still REQUESTED.
		expect(consumerCallback.onStarted).not.toHaveBeenCalled();
		const providerEntities = await providerStorage.query();
		const providerRecord = providerEntities.entities.find(
			e => (e as TransferProcess).consumerPid === consumerPid
		) as TransferProcess | undefined;
		expect(providerRecord?.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);
	});

	test("does NOT auto-start when autoStart is not requested", async () => {
		arrangeTwoNodes(false);

		const consumerToken = await createDecodingTrustComponent().generate(CONSUMER_ORG);
		const { consumerPid } = await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: CONSUMER_ORG,
				[ContextIdKeys.Organization]: CONSUMER_ORG,
				[HttpContextIdKeys.PublicOrigin]: CONSUMER_ORIGIN
			},
			async () =>
				consumerService.prepareTransfer(
					AGREEMENT_ID,
					PROVIDER_ENDPOINT,
					DataspaceTransferFormat.HttpDataPull,
					consumerToken
				)
		);

		// Wait long enough for any auto-start setTimeout(0) + callback chain to have run (none should, since
		// autoStart was not requested), then prove the consumer was never started. This guardrail proves the
		// positive test is meaningful: it exercises the real auto-start path, not a hollow callback.
		await new Promise<void>(resolve => {
			setTimeout(resolve, 500);
		});

		expect(consumerCallback.onStarted).not.toHaveBeenCalled();
		expect(consumerCallback.onStateChanged).not.toHaveBeenCalled();

		// Both records remain REQUESTED (the transfer was prepared/requested but never started).
		const storedConsumer = await consumerStorage.get(consumerPid, "consumerPid");
		expect(storedConsumer?.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);
		const providerEntities = await providerStorage.query();
		const providerRecord = providerEntities.entities.find(
			e => (e as TransferProcess).consumerPid === consumerPid
		) as TransferProcess | undefined;
		expect(providerRecord?.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);
	});

	/**
	 * Drive a consumer prepareTransfer through the provider auto-start and resolve once the consumer's
	 * onStarted has fired (the transfer is STARTED on both nodes).
	 * @returns The consumer and provider pids of the started transfer.
	 */
	async function startedTransfer(): Promise<{ consumerPid: string; providerPid: string }> {
		let resolveStarted: (message: IDataspaceProtocolTransferStartMessage) => void = () => {};
		const fired = new Promise<IDataspaceProtocolTransferStartMessage>((resolve, reject) => {
			resolveStarted = resolve;
			setTimeout(() => reject(new Error("Timed out waiting for consumer onStarted")), 3000);
		});
		vi.mocked(consumerCallback.onStarted).mockImplementation(async (consumerPid, message) => {
			resolveStarted(message);
		});

		const consumerToken = await createDecodingTrustComponent().generate(CONSUMER_ORG);
		const { consumerPid } = await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: CONSUMER_ORG,
				[ContextIdKeys.Organization]: CONSUMER_ORG,
				[HttpContextIdKeys.PublicOrigin]: CONSUMER_ORIGIN
			},
			async () =>
				consumerService.prepareTransfer(
					AGREEMENT_ID,
					PROVIDER_ENDPOINT,
					DataspaceTransferFormat.HttpDataPull,
					consumerToken
				)
		);
		const startMessage = await fired;
		return { consumerPid, providerPid: startMessage.providerPid };
	}

	test("provider-initiated suspend is delivered to the consumer (onSuspended fires)", async () => {
		arrangeTwoNodes(true);
		const { consumerPid, providerPid } = await startedTransfer();

		const providerToken = await createDecodingTrustComponent().generate(PROVIDER_ORG);
		await ContextIdStore.run(
			{ [ContextIdKeys.Node]: PROVIDER_ORG, [ContextIdKeys.Organization]: PROVIDER_ORG },
			async () =>
				providerService.suspendTransfer(
					{
						"@context": [DataspaceProtocolContexts.Context],
						"@type": DataspaceProtocolTransferProcessTypes.TransferSuspensionMessage,
						consumerPid,
						providerPid,
						reason: ["maintenance"]
					},
					providerToken
				)
		);

		// The provider's suspension was POSTed cross-node to the consumer callback (either-party auth),
		// so the consumer's onSuspended fired (with the forwarded reason) and its record reached SUSPENDED.
		expect(consumerCallback.onSuspended).toHaveBeenCalledWith(consumerPid, "maintenance");
		const storedConsumer = await consumerStorage.get(consumerPid, "consumerPid");
		expect(storedConsumer?.state).toBe(DataspaceProtocolTransferProcessStateType.SUSPENDED);
	});

	test("provider-initiated terminate is delivered to the consumer (onTerminated fires)", async () => {
		arrangeTwoNodes(true);
		const { consumerPid, providerPid } = await startedTransfer();

		const providerToken = await createDecodingTrustComponent().generate(PROVIDER_ORG);
		await ContextIdStore.run(
			{ [ContextIdKeys.Node]: PROVIDER_ORG, [ContextIdKeys.Organization]: PROVIDER_ORG },
			async () =>
				providerService.terminateTransfer(
					{
						"@context": [DataspaceProtocolContexts.Context],
						"@type": DataspaceProtocolTransferProcessTypes.TransferTerminationMessage,
						consumerPid,
						providerPid,
						reason: ["policy"]
					},
					providerToken
				)
		);

		// The consumer's onTerminated fired with the forwarded reason and its record reached TERMINATED.
		expect(consumerCallback.onTerminated).toHaveBeenCalledWith(consumerPid, "policy");
		const storedConsumer = await consumerStorage.get(consumerPid, "consumerPid");
		expect(storedConsumer?.state).toBe(DataspaceProtocolTransferProcessStateType.TERMINATED);
	});

	test("idle policy sweep terminates an idle STARTED transfer and notifies the consumer node", async () => {
		// A negative window treats any STARTED transfer as immediately idle, so the assertion
		// does not depend on wall-clock timing.
		arrangeTwoNodes(true, PROVIDER_ORG, { providerTransferIdleTimeoutMs: -1 });
		const { consumerPid } = await startedTransfer();

		await (
			providerService as unknown as { applyProviderTransferPolicies(): Promise<void> }
		).applyProviderTransferPolicies();

		// The sweep terminated the provider-side record and delivered the termination cross-node:
		// both records reached TERMINATED and the consumer's onTerminated fired with the policy reason.
		expect(consumerCallback.onTerminated).toHaveBeenCalledWith(
			consumerPid,
			TransferTerminationCode.IdleTimeout
		);
		const storedConsumer = await consumerStorage.get(consumerPid, "consumerPid");
		expect(storedConsumer?.state).toBe(DataspaceProtocolTransferProcessStateType.TERMINATED);
		const providerEntities = await providerStorage.query();
		const providerRecord = providerEntities.entities.find(
			e => (e as TransferProcess).consumerPid === consumerPid
		) as TransferProcess | undefined;
		expect(providerRecord?.state).toBe(DataspaceProtocolTransferProcessStateType.TERMINATED);
	});

	/**
	 * Prepare a consumer transfer WITHOUT auto-start, so both nodes hold a REQUESTED record and the provider
	 * start must be triggered explicitly via transferStarted (the #154 use case).
	 * @returns The consumer and provider pids of the requested (not yet started) transfer.
	 */
	async function requestedTransfer(): Promise<{ consumerPid: string; providerPid: string }> {
		const consumerToken = await createDecodingTrustComponent().generate(CONSUMER_ORG);
		const { consumerPid } = await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: CONSUMER_ORG,
				[ContextIdKeys.Organization]: CONSUMER_ORG,
				[HttpContextIdKeys.PublicOrigin]: CONSUMER_ORIGIN
			},
			async () =>
				consumerService.prepareTransfer(
					AGREEMENT_ID,
					PROVIDER_ENDPOINT,
					DataspaceTransferFormat.HttpDataPull,
					consumerToken
				)
		);
		const providerEntities = await providerStorage.query();
		const providerRecord = providerEntities.entities.find(
			e => (e as TransferProcess).consumerPid === consumerPid
		) as TransferProcess | undefined;
		if (providerRecord === undefined) {
			throw new Error("Provider record not found after prepareTransfer");
		}
		return { consumerPid, providerPid: providerRecord.providerPid };
	}

	test("provider explicitly starts a requested transfer via transferStarted (onStarted fires, both nodes STARTED)", async () => {
		arrangeTwoNodes(false);

		let resolveStarted: (message: IDataspaceProtocolTransferStartMessage) => void = () => {};
		const onStartedFired = new Promise<IDataspaceProtocolTransferStartMessage>(
			(resolve, reject) => {
				resolveStarted = resolve;
				setTimeout(() => reject(new Error("Timed out waiting for consumer onStarted")), 3000);
			}
		);
		vi.mocked(consumerCallback.onStarted).mockImplementation(async (consumerPid, message) => {
			resolveStarted(message);
		});

		const { consumerPid, providerPid } = await requestedTransfer();

		// Nothing has started yet: autoStart was false.
		const beforeConsumer = await consumerStorage.get(consumerPid, "consumerPid");
		expect(beforeConsumer?.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);

		// Provider explicitly starts, authenticated as the provider (agreement assigner) identity.
		const providerToken = await createDecodingTrustComponent().generate(PROVIDER_ORG);
		const result = await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: PROVIDER_ORG,
				[ContextIdKeys.Organization]: PROVIDER_ORG,
				[HttpContextIdKeys.PublicOrigin]: PROVIDER_ENDPOINT
			},
			async () => providerService.transferStarted(providerPid, providerToken)
		);

		// The call returned the TransferStartMessage (not an error) carrying the PULL dataAddress.
		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferStartMessage);
		const startResult = result as IDataspaceProtocolTransferStartMessage;
		expect(startResult.dataAddress?.endpoint).toContain(PROVIDER_ENDPOINT);

		// The start was delivered cross-node: consumer onStarted fired and both records reached STARTED.
		await onStartedFired;
		expect(consumerCallback.onStarted).toHaveBeenCalledWith(
			consumerPid,
			expect.objectContaining({ consumerPid })
		);
		expect(consumerCallback.onStateChanged).toHaveBeenCalledWith(
			consumerPid,
			DataspaceProtocolTransferProcessStateType.STARTED
		);
		const storedConsumer = await consumerStorage.get(consumerPid, "consumerPid");
		expect(storedConsumer?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
		const providerEntities = await providerStorage.query();
		const providerRecord = providerEntities.entities.find(
			e => (e as TransferProcess).consumerPid === consumerPid
		) as TransferProcess | undefined;
		expect(providerRecord?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
	});

	test("transferStarted returns a TransferError when the pid is unknown", async () => {
		arrangeTwoNodes(false);

		const providerToken = await createDecodingTrustComponent().generate(PROVIDER_ORG);
		const result = await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: PROVIDER_ORG,
				[ContextIdKeys.Organization]: PROVIDER_ORG,
				[HttpContextIdKeys.PublicOrigin]: PROVIDER_ENDPOINT
			},
			async () => providerService.transferStarted("urn:uuid:does-not-exist", providerToken)
		);

		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
			expect(result.code).toMatch(/^NotFoundError:/);
		}
	});

	test("transferStarted is rejected on a consumer-role record (transferStartNotProvider)", async () => {
		arrangeTwoNodes(false);
		const { consumerPid } = await requestedTransfer();

		// The consumer node holds a consumer-role record for consumerPid. Asking ITS service to start it must
		// be rejected: only the provider initiates a start.
		const consumerToken = await createDecodingTrustComponent().generate(CONSUMER_ORG);
		const result = await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: CONSUMER_ORG,
				[ContextIdKeys.Organization]: CONSUMER_ORG,
				[HttpContextIdKeys.PublicOrigin]: CONSUMER_ORIGIN
			},
			async () => consumerService.transferStarted(consumerPid, consumerToken)
		);

		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
			expect(result.code).toMatch(/transferStartNotProvider/);
		}
		// The consumer record is untouched.
		const storedConsumer = await consumerStorage.get(consumerPid, "consumerPid");
		expect(storedConsumer?.state).toBe(DataspaceProtocolTransferProcessStateType.REQUESTED);
	});

	test("transferStarted is rejected when the caller is not the provider (callerNotAuthorizedAsProvider)", async () => {
		arrangeTwoNodes(false);
		const { providerPid } = await requestedTransfer();

		// A token that decodes to the CONSUMER identity, not the provider/assigner: startTransfer's
		// provider-auth gate must reject it.
		const wrongToken = await createDecodingTrustComponent().generate(CONSUMER_ORG);
		const result = await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: PROVIDER_ORG,
				[ContextIdKeys.Organization]: PROVIDER_ORG,
				[HttpContextIdKeys.PublicOrigin]: PROVIDER_ENDPOINT
			},
			async () => providerService.transferStarted(providerPid, wrongToken)
		);

		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferError);
		if (result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError) {
			expect(result.code).toMatch(/callerNotAuthorizedAsProvider/);
		}
	});

	test("provider resumes a SUSPENDED transfer via transferStarted", async () => {
		arrangeTwoNodes(true);
		const { consumerPid, providerPid } = await startedTransfer();

		// Provider suspends the started transfer; both nodes reach SUSPENDED.
		const providerToken = await createDecodingTrustComponent().generate(PROVIDER_ORG);
		await ContextIdStore.run(
			{ [ContextIdKeys.Node]: PROVIDER_ORG, [ContextIdKeys.Organization]: PROVIDER_ORG },
			async () =>
				providerService.suspendTransfer(
					{
						"@context": [DataspaceProtocolContexts.Context],
						"@type": DataspaceProtocolTransferProcessTypes.TransferSuspensionMessage,
						consumerPid,
						providerPid,
						reason: ["pause"]
					},
					providerToken
				)
		);
		const suspended = await consumerStorage.get(consumerPid, "consumerPid");
		expect(suspended?.state).toBe(DataspaceProtocolTransferProcessStateType.SUSPENDED);

		// Provider resumes via the explicit start; the consumer's onStarted fires again and both reach STARTED.
		let resolveResumed: () => void = () => {};
		const resumedFired = new Promise<void>((resolve, reject) => {
			resolveResumed = resolve;
			setTimeout(
				() => reject(new Error("Timed out waiting for consumer onStarted (resume)")),
				3000
			);
		});
		vi.mocked(consumerCallback.onStarted).mockImplementation(async () => {
			resolveResumed();
		});

		const result = await ContextIdStore.run(
			{
				[ContextIdKeys.Node]: PROVIDER_ORG,
				[ContextIdKeys.Organization]: PROVIDER_ORG,
				[HttpContextIdKeys.PublicOrigin]: PROVIDER_ENDPOINT
			},
			async () => providerService.transferStarted(providerPid, providerToken)
		);

		expect(result["@type"]).toBe(DataspaceProtocolTransferProcessTypes.TransferStartMessage);
		await resumedFired;
		const resumedConsumer = await consumerStorage.get(consumerPid, "consumerPid");
		expect(resumedConsumer?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
		const providerEntities = await providerStorage.query();
		const providerRecord = providerEntities.entities.find(
			e => (e as TransferProcess).consumerPid === consumerPid
		) as TransferProcess | undefined;
		expect(providerRecord?.state).toBe(DataspaceProtocolTransferProcessStateType.STARTED);
	});
});
