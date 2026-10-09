// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError } from "@3sixty/core";
import { DataspaceTransferFormat } from "@3sixty/dataspace-models";
import {
	DataspaceProtocolEndpointType,
	DataspaceProtocolTransferProcessStateType,
	DataspaceProtocolTransferProcessTypes
} from "@3sixty/standards-dataspace-protocol";
import { TransferHandlerFactory } from "../../src/factories/transferHandlerFactory.js";
import { HttpDataPostTransferHandler } from "../../src/handlers/httpDataPostTransferHandler.js";
import { HttpDataPullTransferHandler } from "../../src/handlers/httpDataPullTransferHandler.js";
import { HttpDataPushTransferHandler } from "../../src/handlers/httpDataPushTransferHandler.js";
import { EndpointProperties } from "../../src/models/endpointProperties.js";
import {
	createMockDataspaceDataPlaneComponent,
	createMockTrustComponent
} from "../setupTestEnv.js";

/**
 * Minimal ITransferProcess stub for handler tests.
 * @param overrides Field overrides - use `"field" in overrides` pattern for explicit undefined.
 * @returns A partial ITransferProcess suitable for handler unit tests.
 */
function makeEntity(
	overrides: Partial<{
		consumerPid: string;
		providerPid: string;
		agreementId: string;
		datasetId: string;
		providerIdentity: string;
		dataAddress: { "@type": string; endpointType: string; endpoint: string } | undefined;
	}> = {}
): Parameters<HttpDataPullTransferHandler["buildProviderStartDataAddress"]>[0]["entity"] {
	return {
		consumerPid: overrides.consumerPid ?? "consumer-pid-1",
		providerPid: overrides.providerPid ?? "provider-pid-1",
		agreementId: overrides.agreementId ?? "agreement-id-1",
		datasetId: overrides.datasetId ?? "dataset-id-1",
		providerIdentity:
			"providerIdentity" in overrides ? overrides.providerIdentity : "did:iota:provider",
		dataAddress: overrides.dataAddress
	} as Parameters<HttpDataPullTransferHandler["buildProviderStartDataAddress"]>[0]["entity"];
}

/**
 * Minimal start context stub.
 * @param entity The entity to use in the context.
 * @param overrides Optional overrides. Use `{ dataPlanePath: undefined }` to test missing path.
 * @param overrides.dataPlanePath Override for dataPlanePath; explicit undefined passes through.
 * @param overrides.organizationIdentity Override for organizationIdentity.
 * @returns An ITransferHandlerStartContext for use in handler tests.
 */
function makeStartCtx(
	entity: ReturnType<typeof makeEntity>,
	overrides: { dataPlanePath?: string; organizationIdentity?: string } = {}
): Parameters<HttpDataPullTransferHandler["buildProviderStartDataAddress"]>[0] {
	return {
		entity,
		publicOrigin: "https://provider.example.com",
		dataPlanePath: "dataPlanePath" in overrides ? overrides.dataPlanePath : "data-plane/data",
		organizationIdentity: overrides.organizationIdentity ?? "org-123",
		trustComponent: createMockTrustComponent("did:iota:provider"),
		overrideTrustGeneratorType: undefined
	};
}

describe("TransferHandlerFactory", () => {
	it("get() returns the registered handler for each format", () => {
		// Handlers are registered by DataspaceControlPlaneService constructor.
		// Re-register here for isolated factory testing.
		const pullHandler = new HttpDataPullTransferHandler();
		const pushHandler = new HttpDataPushTransferHandler();
		const postHandler = new HttpDataPostTransferHandler();

		TransferHandlerFactory.register(DataspaceTransferFormat.HttpDataPull, () => pullHandler);
		TransferHandlerFactory.register(DataspaceTransferFormat.HttpDataPush, () => pushHandler);
		TransferHandlerFactory.register(DataspaceTransferFormat.HttpDataPost, () => postHandler);

		expect(TransferHandlerFactory.get(DataspaceTransferFormat.HttpDataPull)).toBe(pullHandler);
		expect(TransferHandlerFactory.get(DataspaceTransferFormat.HttpDataPush)).toBe(pushHandler);
		expect(TransferHandlerFactory.get(DataspaceTransferFormat.HttpDataPost)).toBe(postHandler);
	});

	it("get() throws GeneralError for an unknown format string", () => {
		expect(() => TransferHandlerFactory.get("HttpData-UNKNOWN")).toThrow(GeneralError);
	});
});

describe("HttpDataPullTransferHandler", () => {
	let handler: HttpDataPullTransferHandler;

	beforeEach(() => {
		handler = new HttpDataPullTransferHandler();
	});

	describe("buildConsumerDataAddress", () => {
		it("returns undefined - PULL consumers do not supply a dataAddress", () => {
			const result = handler.buildConsumerDataAddress({
				consumerPid: "cpid",
				origin: "https://consumer.example.com",
				dataPlanePath: "data-plane/data",
				organizationIdentity: "org-1"
			});
			expect(result).toBeUndefined();
		});
	});

	describe("buildProviderStartDataAddress", () => {
		it("returns a PULL dataAddress with bearer token and query endpoint", async () => {
			const entity = makeEntity();
			const ctx = makeStartCtx(entity);

			const result = await handler.buildProviderStartDataAddress(ctx);

			expect(result).toBeDefined();
			expect(result?.["@type"]).toBe(DataspaceProtocolTransferProcessTypes.DataAddress);
			expect(result?.endpointType).toBe(DataspaceProtocolEndpointType.HttpsQueryEndpoint);
			expect(result?.endpoint).toContain("https://provider.example.com/data-plane/data");
			expect(result?.endpoint).toContain("organization=org-123");

			const authProp = result?.endpointProperties?.find(
				p => p.name === EndpointProperties.Authorization
			);
			expect(authProp).toBeDefined();
			const authTypeProp = result?.endpointProperties?.find(
				p => p.name === EndpointProperties.AuthType
			);
			expect(authTypeProp?.value).toBe("bearer");
		});

		it("throws GeneralError when dataPlanePath is not configured", async () => {
			const entity = makeEntity();
			const ctx = makeStartCtx(entity, { dataPlanePath: undefined });

			await expect(handler.buildProviderStartDataAddress(ctx)).rejects.toThrow(GeneralError);
		});

		it("throws GeneralError when providerIdentity is missing", async () => {
			const entity = makeEntity({ providerIdentity: undefined as unknown as string });
			const ctx = makeStartCtx(entity);

			await expect(handler.buildProviderStartDataAddress(ctx)).rejects.toThrow(GeneralError);
		});
	});

	describe("lifecycle hooks", () => {
		it("onProviderStart is a no-op", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onProviderStart(
				dataPlane,
				"cpid",
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);
			expect(dataPlane.setupPushSubscription).not.toHaveBeenCalled();
			expect(dataPlane.resumePushSubscription).not.toHaveBeenCalled();
		});

		it("onComplete is a no-op", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onComplete(dataPlane, "cpid");
			expect(dataPlane.teardownPushSubscription).not.toHaveBeenCalled();
		});

		it("onSuspend is a no-op", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onSuspend(dataPlane, "cpid");
			expect(dataPlane.suspendPushSubscription).not.toHaveBeenCalled();
		});

		it("onTerminate is a no-op", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onTerminate(dataPlane, "cpid");
			expect(dataPlane.teardownPushSubscription).not.toHaveBeenCalled();
		});
	});
});

describe("HttpDataPushTransferHandler", () => {
	let handler: HttpDataPushTransferHandler;

	beforeEach(() => {
		handler = new HttpDataPushTransferHandler();
	});

	describe("buildConsumerDataAddress", () => {
		it("returns an ActivityStream inbox dataAddress for the consumer", () => {
			const result = handler.buildConsumerDataAddress({
				consumerPid: "cpid",
				origin: "https://consumer.example.com",
				dataPlanePath: "data-plane/data",
				organizationIdentity: "org-1"
			});

			expect(result?.["@type"]).toBe(DataspaceProtocolTransferProcessTypes.DataAddress);
			expect(result?.endpointType).toBe(DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint);
			expect(result?.endpoint).toContain("/data-plane/data/inbox");
			expect(result?.endpoint).toContain("organization=org-1");
		});

		it("throws GeneralError when dataPlanePath is not configured", () => {
			expect(() =>
				handler.buildConsumerDataAddress({
					consumerPid: "cpid",
					origin: "https://consumer.example.com",
					dataPlanePath: undefined,
					organizationIdentity: "org-1"
				})
			).toThrow(GeneralError);
		});
	});

	describe("buildProviderStartDataAddress", () => {
		it("returns provider inbox dataAddress without a bearer token", async () => {
			const entity = makeEntity({
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: "https://consumer.example.com/data-plane/data/inbox"
				}
			});
			const ctx = makeStartCtx(entity);

			const result = await handler.buildProviderStartDataAddress(ctx);

			expect(result?.["@type"]).toBe(DataspaceProtocolTransferProcessTypes.DataAddress);
			expect(result?.endpointType).toBe(DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint);
			expect(result?.endpoint).toContain("/data-plane/data/inbox");
			expect(result?.endpointProperties).toBeUndefined();
		});

		it("throws GeneralError when consumer dataAddress endpoint is missing", async () => {
			const entity = makeEntity({
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: ""
				}
			});
			const ctx = makeStartCtx(entity);

			await expect(handler.buildProviderStartDataAddress(ctx)).rejects.toThrow(GeneralError);
		});

		it("throws GeneralError when dataPlanePath is not configured", async () => {
			const entity = makeEntity({
				dataAddress: {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: "https://consumer.example.com/inbox"
				}
			});
			const ctx = makeStartCtx(entity, { dataPlanePath: undefined });

			await expect(handler.buildProviderStartDataAddress(ctx)).rejects.toThrow(GeneralError);
		});
	});

	describe("onProviderStart", () => {
		it("calls setupPushSubscription when previous state is REQUESTED", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onProviderStart(
				dataPlane,
				"cpid",
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);
			expect(dataPlane.setupPushSubscription).toHaveBeenCalledWith("cpid");
			expect(dataPlane.resumePushSubscription).not.toHaveBeenCalled();
		});

		it("calls resumePushSubscription when previous state is SUSPENDED", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onProviderStart(
				dataPlane,
				"cpid",
				DataspaceProtocolTransferProcessStateType.SUSPENDED
			);
			expect(dataPlane.resumePushSubscription).toHaveBeenCalledWith("cpid");
			expect(dataPlane.setupPushSubscription).not.toHaveBeenCalled();
		});

		it("does not call data plane for other states", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onProviderStart(
				dataPlane,
				"cpid",
				DataspaceProtocolTransferProcessStateType.STARTED
			);
			expect(dataPlane.setupPushSubscription).not.toHaveBeenCalled();
			expect(dataPlane.resumePushSubscription).not.toHaveBeenCalled();
		});
	});

	describe("lifecycle hooks", () => {
		it("onComplete calls teardownPushSubscription", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onComplete(dataPlane, "cpid");
			expect(dataPlane.teardownPushSubscription).toHaveBeenCalledWith("cpid");
		});

		it("onSuspend calls suspendPushSubscription", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onSuspend(dataPlane, "cpid");
			expect(dataPlane.suspendPushSubscription).toHaveBeenCalledWith("cpid");
		});

		it("onTerminate calls teardownPushSubscription", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onTerminate(dataPlane, "cpid");
			expect(dataPlane.teardownPushSubscription).toHaveBeenCalledWith("cpid");
		});
	});
});

describe("HttpDataPostTransferHandler", () => {
	let handler: HttpDataPostTransferHandler;

	beforeEach(() => {
		handler = new HttpDataPostTransferHandler();
	});

	describe("buildConsumerDataAddress", () => {
		it("returns undefined - POST consumers do not supply a dataAddress", () => {
			const result = handler.buildConsumerDataAddress({
				consumerPid: "cpid",
				origin: "https://consumer.example.com",
				dataPlanePath: "data-plane/data",
				organizationIdentity: "org-1"
			});
			expect(result).toBeUndefined();
		});
	});

	describe("buildProviderStartDataAddress", () => {
		it("returns provider inbox dataAddress with a bearer token", async () => {
			const entity = makeEntity({ dataAddress: undefined });
			const ctx = makeStartCtx(entity);

			const result = await handler.buildProviderStartDataAddress(ctx);

			expect(result?.["@type"]).toBe(DataspaceProtocolTransferProcessTypes.DataAddress);
			expect(result?.endpointType).toBe(DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint);
			expect(result?.endpoint).toContain("/data-plane/data/inbox");

			const authProp = result?.endpointProperties?.find(
				p => p.name === EndpointProperties.Authorization
			);
			expect(authProp).toBeDefined();
			const authTypeProp = result?.endpointProperties?.find(
				p => p.name === EndpointProperties.AuthType
			);
			expect(authTypeProp?.value).toBe("bearer");
		});

		it("throws GeneralError when dataPlanePath is not configured", async () => {
			const entity = makeEntity({ dataAddress: undefined });
			const ctx = makeStartCtx(entity, { dataPlanePath: undefined });

			await expect(handler.buildProviderStartDataAddress(ctx)).rejects.toThrow(GeneralError);
		});

		it("throws GeneralError when providerIdentity is missing", async () => {
			const entity = makeEntity({
				providerIdentity: undefined as unknown as string,
				dataAddress: undefined
			});
			const ctx = makeStartCtx(entity);

			await expect(handler.buildProviderStartDataAddress(ctx)).rejects.toThrow(GeneralError);
		});
	});

	describe("onProviderStart", () => {
		it("is a no-op - POST does not set up a provider-side push subscription", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onProviderStart(
				dataPlane,
				"cpid",
				DataspaceProtocolTransferProcessStateType.REQUESTED
			);
			expect(dataPlane.setupPushSubscription).not.toHaveBeenCalled();
			expect(dataPlane.resumePushSubscription).not.toHaveBeenCalled();
		});
	});

	describe("lifecycle hooks", () => {
		it("onComplete calls teardownPushSubscription", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onComplete(dataPlane, "cpid");
			expect(dataPlane.teardownPushSubscription).toHaveBeenCalledWith("cpid");
		});

		it("onSuspend calls suspendPushSubscription", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onSuspend(dataPlane, "cpid");
			expect(dataPlane.suspendPushSubscription).toHaveBeenCalledWith("cpid");
		});

		it("onTerminate calls teardownPushSubscription", async () => {
			const dataPlane = createMockDataspaceDataPlaneComponent();
			await handler.onTerminate(dataPlane, "cpid");
			expect(dataPlane.teardownPushSubscription).toHaveBeenCalledWith("cpid");
		});
	});
});
