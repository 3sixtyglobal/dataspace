// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { GuardError, NotSupportedError } from "@twin.org/core";
import type { INegotiationCallback, ITransferCallback } from "@twin.org/dataspace-models";
import {
	DataspaceProtocolCatalogTypes,
	DataspaceProtocolContexts,
	DataspaceProtocolTransferProcessStateType,
	DataspaceProtocolTransferProcessTypes,
	DataspaceProtocolVersionBindingType
} from "@twin.org/standards-dataspace-protocol";
import type {
	IDataspaceProtocolDataset,
	IDataspaceProtocolTransferCompletionMessage,
	IDataspaceProtocolTransferProcess,
	IDataspaceProtocolTransferRequestMessage,
	IDataspaceProtocolTransferStartMessage,
	IDataspaceProtocolTransferSuspensionMessage,
	IDataspaceProtocolTransferTerminationMessage,
	IDataspaceProtocolVersionResponse
} from "@twin.org/standards-dataspace-protocol";
import { HttpMethod } from "@twin.org/web";
import { DataspaceControlPlaneRestClient } from "../src/dataspaceControlPlaneRestClient.js";
import {
	createdResponse,
	jsonResponse,
	noContentResponse,
	setupFetchMock,
	teardownFetchMock
} from "./helpers/restClientTestHelpers.js";

const ENDPOINT = "http://localhost:8080";
const PREFIX = "dataspace-control-plane";

const TEST_TRUST_PAYLOAD = "test-bearer-token";

const TEST_CONSUMER_PID = "urn:uuid:consumer-pid-123";
const TEST_PROVIDER_PID = "urn:uuid:provider-pid-456";
const TEST_DATASET_ID = "dataset-001";
const TEST_APP_ID = "app-123";
const TEST_AGREEMENT_ID = "agreement-789";

const LOCATION = `${ENDPOINT}/${PREFIX}/app-datasets/${TEST_DATASET_ID}`;

const TEST_DATASET: IDataspaceProtocolDataset = {
	"@context": DataspaceProtocolContexts.Context,
	"@type": DataspaceProtocolCatalogTypes.Dataset,
	"@id": TEST_DATASET_ID,
	hasPolicy: [
		{
			"@id": "offer-001",
			"@type": "Offer",
			assigner: "urn:example:provider"
		}
	],
	distribution: [
		{
			"@type": DataspaceProtocolCatalogTypes.Distribution,
			format: "HttpData-PULL",
			accessService: "https://provider.example/dsp"
		}
	]
};

const TEST_TRANSFER_REQUEST: IDataspaceProtocolTransferRequestMessage = {
	"@context": DataspaceProtocolContexts.Context,
	"@type": DataspaceProtocolTransferProcessTypes.TransferRequestMessage,
	agreementId: TEST_AGREEMENT_ID,
	callbackAddress: "https://consumer.example/callback",
	consumerPid: TEST_CONSUMER_PID,
	format: "HttpData-PULL"
};

const TEST_TRANSFER_START: IDataspaceProtocolTransferStartMessage = {
	"@context": DataspaceProtocolContexts.Context,
	"@type": DataspaceProtocolTransferProcessTypes.TransferStartMessage,
	consumerPid: TEST_CONSUMER_PID,
	providerPid: TEST_PROVIDER_PID
};

const TEST_TRANSFER_COMPLETION: IDataspaceProtocolTransferCompletionMessage = {
	"@context": DataspaceProtocolContexts.Context,
	"@type": DataspaceProtocolTransferProcessTypes.TransferCompletionMessage,
	consumerPid: TEST_CONSUMER_PID,
	providerPid: TEST_PROVIDER_PID
};

const TEST_TRANSFER_SUSPENSION: IDataspaceProtocolTransferSuspensionMessage = {
	"@context": DataspaceProtocolContexts.Context,
	"@type": DataspaceProtocolTransferProcessTypes.TransferSuspensionMessage,
	consumerPid: TEST_CONSUMER_PID,
	providerPid: TEST_PROVIDER_PID
};

const TEST_TRANSFER_TERMINATION: IDataspaceProtocolTransferTerminationMessage = {
	"@context": DataspaceProtocolContexts.Context,
	"@type": DataspaceProtocolTransferProcessTypes.TransferTerminationMessage,
	consumerPid: TEST_CONSUMER_PID,
	providerPid: TEST_PROVIDER_PID
};

const TEST_TRANSFER_PROCESS: IDataspaceProtocolTransferProcess = {
	"@context": DataspaceProtocolContexts.Context,
	"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
	consumerPid: TEST_CONSUMER_PID,
	providerPid: TEST_PROVIDER_PID,
	state: DataspaceProtocolTransferProcessStateType.REQUESTED
};

const TEST_APP_DATASET = {
	id: TEST_DATASET_ID,
	appId: TEST_APP_ID,
	dataset: TEST_DATASET,
	dateCreated: "2026-01-01T00:00:00.000Z",
	dateModified: "2026-01-02T00:00:00.000Z"
};

const TEST_VERSION_RESPONSE: IDataspaceProtocolVersionResponse = {
	protocolVersions: [
		{
			version: "2025-1",
			path: "/dsp/2025-1",
			binding: DataspaceProtocolVersionBindingType.HTTPS
		}
	]
};

const fetchMock = vi.fn();

describe("DataspaceControlPlaneRestClient", () => {
	let client: DataspaceControlPlaneRestClient;

	beforeEach(() => {
		setupFetchMock(fetchMock);
		client = new DataspaceControlPlaneRestClient({ endpoint: ENDPOINT });
	});

	afterEach(() => {
		teardownFetchMock(fetchMock);
	});

	describe("registerNegotiationCallback", () => {
		test("throws NotSupportedError", () => {
			const callback: INegotiationCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onFinalized: vi.fn().mockResolvedValue(undefined),
				onFailed: vi.fn().mockResolvedValue(undefined)
			};

			expect(() => client.registerNegotiationCallback("test", callback)).toThrow(NotSupportedError);
		});
	});

	describe("unregisterNegotiationCallback", () => {
		test("throws NotSupportedError", () => {
			expect(() => client.unregisterNegotiationCallback("test")).toThrow(NotSupportedError);
		});
	});

	describe("negotiateAgreement", () => {
		test("rejects with NotSupportedError", async () => {
			await expect(
				client.negotiateAgreement(
					"dataset-123",
					"offer-123",
					"https://consumer.example",
					TEST_TRUST_PAYLOAD
				)
			).rejects.toThrow(NotSupportedError);
		});
	});

	describe("getNegotiation", () => {
		test("rejects with NotSupportedError", async () => {
			await expect(client.getNegotiation("negotiation-123", TEST_TRUST_PAYLOAD)).rejects.toThrow(
				NotSupportedError
			);
		});
	});

	describe("getNegotiationHistory", () => {
		test("rejects with NotSupportedError", async () => {
			await expect(
				client.getNegotiationHistory(undefined, undefined, TEST_TRUST_PAYLOAD)
			).rejects.toThrow(NotSupportedError);
		});
	});

	describe("registerTransferCallback", () => {
		test("throws NotSupportedError", () => {
			const callback: ITransferCallback = {
				onStateChanged: vi.fn().mockResolvedValue(undefined),
				onStarted: vi.fn().mockResolvedValue(undefined),
				onCompleted: vi.fn().mockResolvedValue(undefined),
				onSuspended: vi.fn().mockResolvedValue(undefined),
				onTerminated: vi.fn().mockResolvedValue(undefined)
			};

			expect(() => client.registerTransferCallback("test", callback)).toThrow(NotSupportedError);
		});
	});

	describe("unregisterTransferCallback", () => {
		test("throws NotSupportedError", () => {
			expect(() => client.unregisterTransferCallback("test")).toThrow(NotSupportedError);
		});
	});

	describe("prepareTransfer", () => {
		test("rejects with NotSupportedError", async () => {
			await expect(
				client.prepareTransfer(
					TEST_AGREEMENT_ID,
					"https://provider.example",
					"HttpData-PULL",
					TEST_TRUST_PAYLOAD
				)
			).rejects.toThrow(NotSupportedError);
		});
	});

	describe("transferStarted", () => {
		test("rejects with NotSupportedError", async () => {
			await expect(client.transferStarted(TEST_CONSUMER_PID, TEST_TRUST_PAYLOAD)).rejects.toThrow(
				NotSupportedError
			);
		});
	});

	describe("requestTransfer", () => {
		test("throws guard error when request is undefined", async () => {
			await expect(
				client.requestTransfer(undefined as never, TEST_TRUST_PAYLOAD)
			).rejects.toMatchObject({ name: GuardError.CLASS_NAME, message: "guard.objectUndefined" });
		});

		test("throws guard error when trustPayload is empty", async () => {
			await expect(client.requestTransfer(TEST_TRANSFER_REQUEST, "")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends POST to /dataspace-control-plane/transfers/request", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_PROCESS));

			await client.requestTransfer(TEST_TRANSFER_REQUEST, TEST_TRUST_PAYLOAD);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/transfers/request`);
			expect(options.method).toBe(HttpMethod.POST);
		});

		test("sends request body fields", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_PROCESS));

			await client.requestTransfer(TEST_TRANSFER_REQUEST, TEST_TRUST_PAYLOAD);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.agreementId).toBe(TEST_AGREEMENT_ID);
			expect(body.consumerPid).toBe(TEST_CONSUMER_PID);
			expect(body.format).toBe("HttpData-PULL");
		});

		test("includes Authorization header", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_PROCESS));

			await client.requestTransfer(TEST_TRANSFER_REQUEST, TEST_TRUST_PAYLOAD);

			const [, options] = fetchMock.mock.calls[0];
			expect(options.headers.authorization).toContain("Bearer");
		});

		test("returns the transfer process from response body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_PROCESS));

			const result = await client.requestTransfer(TEST_TRANSFER_REQUEST, TEST_TRUST_PAYLOAD);

			expect(result).toEqual(TEST_TRANSFER_PROCESS);
		});
	});

	describe("startTransfer", () => {
		test("throws guard error when message is undefined", async () => {
			await expect(
				client.startTransfer(undefined as never, TEST_TRUST_PAYLOAD)
			).rejects.toMatchObject({ name: GuardError.CLASS_NAME, message: "guard.objectUndefined" });
		});

		test("throws guard error when trustPayload is empty", async () => {
			await expect(client.startTransfer(TEST_TRANSFER_START, "")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends POST to /dataspace-control-plane/transfers/:consumerPid/start", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_START));

			await client.startTransfer(TEST_TRANSFER_START, TEST_TRUST_PAYLOAD);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/transfers/${TEST_CONSUMER_PID}/start`);
			expect(options.method).toBe(HttpMethod.POST);
		});

		test("sends message body fields", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_START));

			await client.startTransfer(TEST_TRANSFER_START, TEST_TRUST_PAYLOAD);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.consumerPid).toBe(TEST_CONSUMER_PID);
			expect(body.providerPid).toBe(TEST_PROVIDER_PID);
		});

		test("returns the transfer start message from response body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_START));

			const result = await client.startTransfer(TEST_TRANSFER_START, TEST_TRUST_PAYLOAD);

			expect(result).toEqual(TEST_TRANSFER_START);
		});
	});

	describe("completeTransfer", () => {
		test("throws guard error when message is undefined", async () => {
			await expect(
				client.completeTransfer(undefined as never, TEST_TRUST_PAYLOAD)
			).rejects.toMatchObject({ name: GuardError.CLASS_NAME, message: "guard.objectUndefined" });
		});

		test("throws guard error when trustPayload is empty", async () => {
			await expect(client.completeTransfer(TEST_TRANSFER_COMPLETION, "")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends POST to /dataspace-control-plane/transfers/:consumerPid/complete", async () => {
			const completedProcess: IDataspaceProtocolTransferProcess = {
				...TEST_TRANSFER_PROCESS,
				state: DataspaceProtocolTransferProcessStateType.COMPLETED
			};
			fetchMock.mockResolvedValueOnce(jsonResponse(completedProcess));

			await client.completeTransfer(TEST_TRANSFER_COMPLETION, TEST_TRUST_PAYLOAD);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/transfers/${TEST_CONSUMER_PID}/complete`);
			expect(options.method).toBe(HttpMethod.POST);
		});

		test("sends message body fields", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_PROCESS));

			await client.completeTransfer(TEST_TRANSFER_COMPLETION, TEST_TRUST_PAYLOAD);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.consumerPid).toBe(TEST_CONSUMER_PID);
			expect(body.providerPid).toBe(TEST_PROVIDER_PID);
		});

		test("returns the transfer process from response body", async () => {
			const completedProcess: IDataspaceProtocolTransferProcess = {
				...TEST_TRANSFER_PROCESS,
				state: DataspaceProtocolTransferProcessStateType.COMPLETED
			};
			fetchMock.mockResolvedValueOnce(jsonResponse(completedProcess));

			const result = await client.completeTransfer(TEST_TRANSFER_COMPLETION, TEST_TRUST_PAYLOAD);

			expect(result).toEqual(completedProcess);
		});
	});

	describe("suspendTransfer", () => {
		test("throws guard error when message is undefined", async () => {
			await expect(
				client.suspendTransfer(undefined as never, TEST_TRUST_PAYLOAD)
			).rejects.toMatchObject({ name: GuardError.CLASS_NAME, message: "guard.objectUndefined" });
		});

		test("throws guard error when trustPayload is empty", async () => {
			await expect(client.suspendTransfer(TEST_TRANSFER_SUSPENSION, "")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends POST to /dataspace-control-plane/transfers/:consumerPid/suspend", async () => {
			const suspendedProcess: IDataspaceProtocolTransferProcess = {
				...TEST_TRANSFER_PROCESS,
				state: DataspaceProtocolTransferProcessStateType.SUSPENDED
			};
			fetchMock.mockResolvedValueOnce(jsonResponse(suspendedProcess));

			await client.suspendTransfer(TEST_TRANSFER_SUSPENSION, TEST_TRUST_PAYLOAD);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/transfers/${TEST_CONSUMER_PID}/suspend`);
			expect(options.method).toBe(HttpMethod.POST);
		});

		test("sends message body fields", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_PROCESS));

			await client.suspendTransfer(TEST_TRANSFER_SUSPENSION, TEST_TRUST_PAYLOAD);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.consumerPid).toBe(TEST_CONSUMER_PID);
			expect(body.providerPid).toBe(TEST_PROVIDER_PID);
		});

		test("returns the transfer process from response body", async () => {
			const suspendedProcess: IDataspaceProtocolTransferProcess = {
				...TEST_TRANSFER_PROCESS,
				state: DataspaceProtocolTransferProcessStateType.SUSPENDED
			};
			fetchMock.mockResolvedValueOnce(jsonResponse(suspendedProcess));

			const result = await client.suspendTransfer(TEST_TRANSFER_SUSPENSION, TEST_TRUST_PAYLOAD);

			expect(result).toEqual(suspendedProcess);
		});
	});

	describe("terminateTransfer", () => {
		test("throws guard error when message is undefined", async () => {
			await expect(
				client.terminateTransfer(undefined as never, TEST_TRUST_PAYLOAD)
			).rejects.toMatchObject({ name: GuardError.CLASS_NAME, message: "guard.objectUndefined" });
		});

		test("throws guard error when trustPayload is empty", async () => {
			await expect(client.terminateTransfer(TEST_TRANSFER_TERMINATION, "")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends POST to /dataspace-control-plane/transfers/:consumerPid/terminate", async () => {
			const terminatedProcess: IDataspaceProtocolTransferProcess = {
				...TEST_TRANSFER_PROCESS,
				state: DataspaceProtocolTransferProcessStateType.TERMINATED
			};
			fetchMock.mockResolvedValueOnce(jsonResponse(terminatedProcess));

			await client.terminateTransfer(TEST_TRANSFER_TERMINATION, TEST_TRUST_PAYLOAD);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/transfers/${TEST_CONSUMER_PID}/terminate`);
			expect(options.method).toBe(HttpMethod.POST);
		});

		test("sends message body fields", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_PROCESS));

			await client.terminateTransfer(TEST_TRANSFER_TERMINATION, TEST_TRUST_PAYLOAD);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.consumerPid).toBe(TEST_CONSUMER_PID);
			expect(body.providerPid).toBe(TEST_PROVIDER_PID);
		});

		test("returns the transfer process from response body", async () => {
			const terminatedProcess: IDataspaceProtocolTransferProcess = {
				...TEST_TRANSFER_PROCESS,
				state: DataspaceProtocolTransferProcessStateType.TERMINATED
			};
			fetchMock.mockResolvedValueOnce(jsonResponse(terminatedProcess));

			const result = await client.terminateTransfer(TEST_TRANSFER_TERMINATION, TEST_TRUST_PAYLOAD);

			expect(result).toEqual(terminatedProcess);
		});
	});

	describe("getTransferProcess", () => {
		test("throws guard error when pid is empty", async () => {
			await expect(client.getTransferProcess("", TEST_TRUST_PAYLOAD)).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("throws guard error when trustPayload is empty", async () => {
			await expect(client.getTransferProcess(TEST_CONSUMER_PID, "")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends GET to /dataspace-control-plane/transfers/:pid", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_PROCESS));

			await client.getTransferProcess(TEST_CONSUMER_PID, TEST_TRUST_PAYLOAD);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/transfers/${TEST_CONSUMER_PID}`);
			expect(options.method).toBe(HttpMethod.GET);
		});

		test("includes Authorization header", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_PROCESS));

			await client.getTransferProcess(TEST_CONSUMER_PID, TEST_TRUST_PAYLOAD);

			const [, options] = fetchMock.mock.calls[0];
			expect(options.headers.authorization).toContain("Bearer");
		});

		test("returns the transfer process from response body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_TRANSFER_PROCESS));

			const result = await client.getTransferProcess(TEST_CONSUMER_PID, TEST_TRUST_PAYLOAD);

			expect(result).toEqual(TEST_TRANSFER_PROCESS);
		});
	});

	describe("queryDataTransfer", () => {
		test("rejects with NotSupportedError", async () => {
			await expect(
				client.queryDataTransfer(TEST_AGREEMENT_ID, undefined, undefined, TEST_TRUST_PAYLOAD)
			).rejects.toThrow(NotSupportedError);
		});
	});

	describe("createAppDataset", () => {
		test("throws guard error when appId is empty", async () => {
			await expect(client.createAppDataset(undefined, "", TEST_DATASET)).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("throws guard error when dataset is undefined", async () => {
			await expect(
				client.createAppDataset(undefined, TEST_APP_ID, undefined as never)
			).rejects.toMatchObject({ name: GuardError.CLASS_NAME, message: "guard.objectUndefined" });
		});

		test("sends POST to /dataspace-control-plane/app-datasets", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(LOCATION));

			await client.createAppDataset(undefined, TEST_APP_ID, TEST_DATASET);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/app-datasets`);
			expect(options.method).toBe(HttpMethod.POST);
		});

		test("sends appId and dataset in request body", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(LOCATION));

			await client.createAppDataset(undefined, TEST_APP_ID, TEST_DATASET);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.appId).toBe(TEST_APP_ID);
			expect(body.dataset["@id"]).toBe(TEST_DATASET_ID);
		});

		test("sends explicit id in request body when provided", async () => {
			fetchMock.mockResolvedValueOnce(
				createdResponse(`${ENDPOINT}/${PREFIX}/app-datasets/explicit-id`)
			);

			await client.createAppDataset("explicit-id", TEST_APP_ID, TEST_DATASET);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.id).toBe("explicit-id");
		});

		test("returns the dataset id from the Location header", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(LOCATION));

			const result = await client.createAppDataset(undefined, TEST_APP_ID, TEST_DATASET);

			expect(result).toBe(TEST_DATASET_ID);
		});
	});

	describe("getAppDataset", () => {
		test("throws guard error when id is empty", async () => {
			await expect(client.getAppDataset("")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends GET to /dataspace-control-plane/app-datasets/:id", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_APP_DATASET));

			await client.getAppDataset(TEST_DATASET_ID);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/app-datasets/${TEST_DATASET_ID}`);
			expect(options.method).toBe(HttpMethod.GET);
		});

		test("returns the app dataset from response body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_APP_DATASET));

			const result = await client.getAppDataset(TEST_DATASET_ID);

			expect(result).toEqual(TEST_APP_DATASET);
		});
	});

	describe("listAppDatasets", () => {
		test("sends GET to /dataspace-control-plane/app-datasets", async () => {
			const listResponse = { entities: [TEST_APP_DATASET] };
			fetchMock.mockResolvedValueOnce(jsonResponse(listResponse));

			await client.listAppDatasets();

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toContain(`${ENDPOINT}/${PREFIX}/app-datasets`);
			expect(options.method).toBe(HttpMethod.GET);
		});

		test("appends cursor query param when provided", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse({ entities: [] }));

			await client.listAppDatasets("page2");

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("cursor=page2");
		});

		test("appends limit query param when provided", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse({ entities: [] }));

			await client.listAppDatasets(undefined, 10);

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("limit=10");
		});

		test("returns entities and cursor from response body", async () => {
			const listResponse = { entities: [TEST_APP_DATASET], cursor: "next-page" };
			fetchMock.mockResolvedValueOnce(jsonResponse(listResponse));

			const result = await client.listAppDatasets();

			expect(result.entities).toEqual([TEST_APP_DATASET]);
			expect(result.cursor).toBe("next-page");
		});

		test("returns undefined cursor when no cursor in response body", async () => {
			const listResponse = { entities: [TEST_APP_DATASET] };
			fetchMock.mockResolvedValueOnce(jsonResponse(listResponse));

			const result = await client.listAppDatasets();

			expect(result.cursor).toBeUndefined();
		});
	});

	describe("updateAppDataset", () => {
		test("throws guard error when id is empty", async () => {
			await expect(client.updateAppDataset("", TEST_APP_ID, TEST_DATASET)).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("throws guard error when appId is empty", async () => {
			await expect(
				client.updateAppDataset(TEST_DATASET_ID, "", TEST_DATASET)
			).rejects.toMatchObject({ name: GuardError.CLASS_NAME, message: "guard.stringEmpty" });
		});

		test("throws guard error when dataset is undefined", async () => {
			await expect(
				client.updateAppDataset(TEST_DATASET_ID, TEST_APP_ID, undefined as never)
			).rejects.toMatchObject({ name: GuardError.CLASS_NAME, message: "guard.objectUndefined" });
		});

		test("sends PUT to /dataspace-control-plane/app-datasets/:id", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await client.updateAppDataset(TEST_DATASET_ID, TEST_APP_ID, TEST_DATASET);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/app-datasets/${TEST_DATASET_ID}`);
			expect(options.method).toBe(HttpMethod.PUT);
		});

		test("sends appId and dataset in request body", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await client.updateAppDataset(TEST_DATASET_ID, TEST_APP_ID, TEST_DATASET);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.appId).toBe(TEST_APP_ID);
			expect(body.dataset["@id"]).toBe(TEST_DATASET_ID);
		});
	});

	describe("deleteAppDataset", () => {
		test("throws guard error when id is empty", async () => {
			await expect(client.deleteAppDataset("")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends DELETE to /dataspace-control-plane/app-datasets/:id", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await client.deleteAppDataset(TEST_DATASET_ID);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/app-datasets/${TEST_DATASET_ID}`);
			expect(options.method).toBe(HttpMethod.DELETE);
		});

		test("resolves without error when deletion succeeds", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await expect(client.deleteAppDataset(TEST_DATASET_ID)).resolves.toBeUndefined();
		});
	});

	describe("getProtocolVersions", () => {
		test("sends GET to /.well-known/dspace-version (no prefix)", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_VERSION_RESPONSE));

			await client.getProtocolVersions();

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/.well-known/dspace-version`);
			expect(options.method).toBe(HttpMethod.GET);
		});

		test("returns the version response from response body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_VERSION_RESPONSE));

			const result = await client.getProtocolVersions();

			expect(result).toEqual(TEST_VERSION_RESPONSE);
		});
	});
});
