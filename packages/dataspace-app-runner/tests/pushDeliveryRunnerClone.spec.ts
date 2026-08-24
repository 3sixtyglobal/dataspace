// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Tests that pushDeliveryRunnerStart passes the constrained type allowlist to the
 * engine-builder and that the delivery path honours PEP policy enforcement and the
 * agreement's trustData.
 */

import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory } from "@twin.org/core";
import type { IPushDeliveryPayload } from "@twin.org/dataspace-models";
import { ModuleHelper } from "@twin.org/modules";
import type { IRightsManagementAgreement } from "@twin.org/rights-management-models";
import { FetchHelper } from "@twin.org/web";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
	pushDeliveryRunner,
	pushDeliveryRunnerEnd,
	pushDeliveryRunnerStart
} from "../src/pushDeliveryRunner.js";

const MOCK_TRUST = {
	generate: vi.fn().mockResolvedValue("mock-jwt-token")
};

const MOCK_CLONE = {
	config: { types: {}, debug: false, silent: true },
	state: {},
	typeInitialisers: [],
	entitySchemas: {},
	contextIdKeys: []
} as never;

describe("pushDeliveryRunner - engine clone", () => {
	let mockEngineStart: () => Promise<void>;

	beforeEach(() => {
		mockEngineStart = vi.fn().mockResolvedValue(undefined);

		ComponentFactory.clear();
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({
			[ContextIdKeys.Node]: "did:iota:testnet:provider"
		});
		vi.spyOn(FetchHelper, "fetchJson").mockResolvedValue(undefined);

		vi.spyOn(ModuleHelper, "execModuleMethod").mockImplementation(async () => ({
			className: () => "MockCloneEngine",
			start: async () => mockEngineStart(),
			stop: vi.fn().mockResolvedValue(undefined),
			getRegisteredInstanceTypeOptional: (type: string) => {
				if (type === "rightsManagementPepComponent") {
					return "policy-enforcement-point";
				}
				return undefined;
			}
		}));
	});

	afterEach(async () => {
		await pushDeliveryRunnerEnd();
		vi.restoreAllMocks();
		ComponentFactory.clear();
	});

	it("delivers through PEP and trust from a constrained engine clone", async () => {
		const fetchSpy = vi.spyOn(FetchHelper, "fetchJson").mockResolvedValue(undefined);
		const interceptSpy = vi.fn().mockImplementation(async (...args) => args[1]);

		mockEngineStart = async () => {
			ComponentFactory.register("trust", () => MOCK_TRUST as never);
			ComponentFactory.register("policy-enforcement-point", () => ({
				className: () => "MockPolicyEnforcementPoint",
				interceptWithPolicy: interceptSpy
			}));
		};

		const trustData = { subject: { role: "BorderAgency", location: "GB" } };
		const agreement: IRightsManagementAgreement = {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			"@id": "urn:policy:push-clone-test",
			assigner: "did:iota:testnet:provider",
			assignee: "did:iota:testnet:consumer",
			permission: [{ action: "read" }],
			trustData
		};
		const payload: IPushDeliveryPayload = {
			consumerPid: "urn:uuid:consumer-push-clone-test",
			providerPid: "urn:uuid:provider-push-clone-test",
			generatorPid: "did:iota:testnet:provider",
			consumerEndpoint: "https://consumer.example.com/inbox",
			agreement,
			data: { "@context": "https://schema.org" },
			entityType: "https://schema.org/Document"
		};
		// Background tasks serialise payloads to JSON; mirror that boundary.
		const roundTrippedPayload = JSON.parse(JSON.stringify(payload)) as IPushDeliveryPayload;

		// The runner reads the node identity from the context ids, as populated by the
		// background-task framework in the worker thread.
		const result = await ContextIdStore.run(
			{ [ContextIdKeys.Node]: "did:iota:testnet:provider" },
			async () => {
				await pushDeliveryRunnerStart(MOCK_CLONE);
				return pushDeliveryRunner(MOCK_CLONE, roundTrippedPayload);
			}
		);

		expect(result).toEqual({ success: true });

		// The PEP should have been called with the agreement and trust data.
		expect(interceptSpy).toHaveBeenCalledTimes(1);
		const callArgs = interceptSpy.mock.calls[0];
		expect(callArgs[0]["@id"]).toBe("urn:policy:push-clone-test");
		expect(callArgs[3]).toEqual(trustData);

		// The data was delivered via fetch.
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [, endpoint] = fetchSpy.mock.calls[0];
		expect(endpoint).toEqual("https://consumer.example.com/inbox");
	});
});
