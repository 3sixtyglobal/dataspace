// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Tests that pushDeliveryRunner forwards the agreement's trustData to the PEP so
 * trust-subject constraints can be evaluated for push deliveries. The payload is
 * passed through a JSON round trip to mirror the background-task serialisation
 * boundary the real payload crosses.
 */

import { ContextIdStore } from "@twin.org/context";
import { ComponentFactory } from "@twin.org/core";
import type { IPushDeliveryPayload } from "@twin.org/dataspace-models";
import { EngineCore } from "@twin.org/engine-core";
import { EngineCoreFactory } from "@twin.org/engine-models";
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

describe("pushDeliveryRunner - policy enforcement", () => {
	beforeEach(() => {
		ComponentFactory.clear();
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({});
		vi.spyOn(EngineCoreFactory, "register").mockReturnValue(undefined);
		vi.spyOn(EngineCore.prototype, "populateClone").mockReturnValue(undefined);
		vi.spyOn(EngineCore.prototype, "stop").mockResolvedValue(undefined);
		vi.spyOn(FetchHelper, "fetchJson").mockResolvedValue(undefined);
	});

	afterEach(async () => {
		await pushDeliveryRunnerEnd();
		vi.restoreAllMocks();
		ComponentFactory.clear();
	});

	it("forwards the agreement's trustData to the PEP", async () => {
		const interceptSpy = vi.fn().mockImplementation(async (...args) => args[1]);
		vi.spyOn(EngineCore.prototype, "start").mockImplementation(async () => {
			ComponentFactory.register("trust", () => MOCK_TRUST as never);
			ComponentFactory.register("policy-enforcement-point", () => ({
				className: () => "MockPolicyEnforcementPoint",
				interceptWithPolicy: interceptSpy
			}));
		});
		const registeredInstanceTypes: { [component: string]: string } = {
			rightsManagementPepComponent: "policy-enforcement-point"
		};
		vi.spyOn(EngineCore.prototype, "getRegisteredInstanceTypeOptional").mockImplementation(
			component => registeredInstanceTypes[component]
		);

		const trustData = { subject: { role: "BorderAgency", location: "GB" } };
		const agreement: IRightsManagementAgreement = {
			"@context": "http://www.w3.org/ns/odrl.jsonld",
			"@type": "Agreement",
			"@id": "urn:policy:push-trust-test",
			assigner: "did:iota:testnet:provider",
			assignee: "did:iota:testnet:consumer",
			permission: [{ action: "read" }],
			trustData
		};
		const payload: IPushDeliveryPayload = {
			consumerPid: "urn:uuid:consumer-push-trust-test",
			providerPid: "urn:uuid:provider-push-trust-test",
			generatorPid: "did:iota:testnet:provider",
			consumerEndpoint: "https://consumer.example.com/inbox",
			consumerAuthToken: "pre-packaged-token",
			agreement,
			data: { "@context": "https://schema.org" },
			entityType: "https://schema.org/Document"
		};
		// Background tasks serialise payloads to JSON; mirror that boundary.
		const roundTrippedPayload = JSON.parse(JSON.stringify(payload)) as IPushDeliveryPayload;

		await pushDeliveryRunnerStart(MOCK_CLONE);
		await expect(pushDeliveryRunner(MOCK_CLONE, roundTrippedPayload)).resolves.toEqual({
			success: true
		});

		expect(interceptSpy).toHaveBeenCalledTimes(1);
		const callArgs = interceptSpy.mock.calls[0];
		expect(callArgs[0]["@id"]).toBe("urn:policy:push-trust-test");
		expect(callArgs[3]).toEqual(trustData);
	});
});
