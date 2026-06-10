// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { NotSupportedError } from "@twin.org/core";
import type { INegotiationCallback, ITransferCallback } from "@twin.org/dataspace-models";
import { DataspaceControlPlaneRestClient } from "../src/dataspaceControlPlaneRestClient.js";

describe("dataspace-control-plane-rest-client", () => {
	let client: DataspaceControlPlaneRestClient;

	beforeAll(() => {
		client = new DataspaceControlPlaneRestClient({ endpoint: "http://localhost" });
	});

	test("registerNegotiationCallback throws a not supported error", () => {
		const callback: INegotiationCallback = {
			onStateChanged: vi.fn().mockResolvedValue(undefined),
			onFinalized: vi.fn().mockResolvedValue(undefined),
			onFailed: vi.fn().mockResolvedValue(undefined)
		};

		expect(() => client.registerNegotiationCallback("test", callback)).toThrow(NotSupportedError);
	});

	test("unregisterNegotiationCallback throws a not supported error", () => {
		expect(() => client.unregisterNegotiationCallback("test")).toThrow(NotSupportedError);
	});

	test("negotiateAgreement rejects with a not supported error", async () => {
		await expect(
			client.negotiateAgreement(
				"dataset-123",
				"offer-123",
				"https://provider.example",
				"https://consumer.example",
				"trust-payload"
			)
		).rejects.toThrow(NotSupportedError);
	});

	test("getNegotiation rejects with a not supported error", async () => {
		await expect(client.getNegotiation("negotiation-123", "trust-payload")).rejects.toThrow(
			NotSupportedError
		);
	});

	test("getNegotiationHistory rejects with a not supported error", async () => {
		await expect(
			client.getNegotiationHistory(undefined, undefined, "trust-payload")
		).rejects.toThrow(NotSupportedError);
	});

	test("registerTransferCallback throws a not supported error", () => {
		const callback: ITransferCallback = {
			onStateChanged: vi.fn().mockResolvedValue(undefined),
			onStarted: vi.fn().mockResolvedValue(undefined),
			onCompleted: vi.fn().mockResolvedValue(undefined),
			onSuspended: vi.fn().mockResolvedValue(undefined),
			onTerminated: vi.fn().mockResolvedValue(undefined)
		};

		expect(() => client.registerTransferCallback("test", callback)).toThrow(NotSupportedError);
	});

	test("unregisterTransferCallback throws a not supported error", () => {
		expect(() => client.unregisterTransferCallback("test")).toThrow(NotSupportedError);
	});

	test("startDataTransfer rejects with a not supported error", async () => {
		await expect(
			client.startDataTransfer(
				"agreement-123",
				"https://provider.example",
				"https://consumer.example",
				"HttpData-PULL",
				"trust-payload"
			)
		).rejects.toThrow(NotSupportedError);
	});
});
