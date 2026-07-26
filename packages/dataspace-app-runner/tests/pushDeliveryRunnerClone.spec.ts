// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Tests that pushDeliveryRunnerStart boots a worker engine from real clone data using
 * the constrained type/entity allowlist, and that the restricted clone still serves the
 * full delivery path: PEP policy enforcement and trust token generation.
 */

import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory } from "@twin.org/core";
import type { IPushDeliveryPayload } from "@twin.org/dataspace-models";
import { Engine } from "@twin.org/engine";
import { EngineCoreFactory, type IEngineCore } from "@twin.org/engine-models";
import {
	BlobStorageConnectorType,
	EntityStorageConnectorType,
	IdentityComponentType,
	IdentityConnectorType,
	LoggingComponentType,
	LoggingConnectorType,
	PlatformComponentType,
	RightsManagementPapComponentType,
	RightsManagementPdpComponentType,
	RightsManagementPepComponentType,
	RightsManagementPipComponentType,
	RightsManagementPmpComponentType,
	RightsManagementPolicyArbiterComponentType,
	RightsManagementPolicyEnforcementProcessorComponentType,
	RightsManagementPxpComponentType,
	TrustComponentType,
	TrustGeneratorComponentType,
	VaultConnectorType,
	type IEngineConfig
} from "@twin.org/engine-types";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import {
	EntityStorageIdentityConnector,
	type IdentityDocument,
	initSchema as initSchemaIdentity
} from "@twin.org/identity-connector-entity-storage";
import { IdentityConnectorFactory } from "@twin.org/identity-models";
import { LoggingConnectorFactory } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import type { IRightsManagementAgreement } from "@twin.org/rights-management-models";
import { TrustGeneratorFactory } from "@twin.org/trust-models";
import {
	EntityStorageVaultConnector,
	type VaultKey,
	type VaultSecret,
	initSchema as initSchemaVault
} from "@twin.org/vault-connector-entity-storage";
import { VaultConnectorFactory } from "@twin.org/vault-models";
import { FetchHelper, HeaderTypes } from "@twin.org/web";
import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import {
	pushDeliveryRunner,
	pushDeliveryRunnerEnd,
	pushDeliveryRunnerStart
} from "../src/pushDeliveryRunner.js";

const VERIFICATION_METHOD_ID = "push-delivery-assertion";

let nodeIdentity: string;

describe("pushDeliveryRunner - engine clone", () => {
	beforeAll(async () => {
		initSchemaVault();
		initSchemaIdentity();

		// The entity storages emulate the shared database that both the source engine
		// and the worker-thread clone connect back to.
		EntityStorageConnectorFactory.register(
			"vault-key",
			() =>
				new MemoryEntityStorageConnector<VaultKey>({
					entitySchema: nameof<VaultKey>(),
					config: { storageKey: "vault-key" }
				})
		);
		EntityStorageConnectorFactory.register(
			"vault-secret",
			() =>
				new MemoryEntityStorageConnector<VaultSecret>({
					entitySchema: nameof<VaultSecret>(),
					config: { storageKey: "vault-secret" }
				})
		);
		EntityStorageConnectorFactory.register(
			"identity-document",
			() =>
				new MemoryEntityStorageConnector<IdentityDocument>({
					entitySchema: nameof<IdentityDocument>(),
					config: { storageKey: "identity-document" }
				})
		);

		const vaultConnector = new EntityStorageVaultConnector();
		VaultConnectorFactory.register("vault", () => vaultConnector);

		const identityConnector = new EntityStorageIdentityConnector();
		IdentityConnectorFactory.register("identity", () => identityConnector);

		const didNode = await identityConnector.createDocument("test-node-identity");
		await identityConnector.addVerificationMethod(
			"test-node-identity",
			didNode.id,
			"assertionMethod",
			VERIFICATION_METHOD_ID
		);
		nodeIdentity = didNode.id;
	});

	afterAll(async () => {
		await pushDeliveryRunnerEnd();
		vi.restoreAllMocks();
		ComponentFactory.reset();
		IdentityConnectorFactory.reset();
		VaultConnectorFactory.reset();
		LoggingConnectorFactory.reset();
		TrustGeneratorFactory.reset();
		EntityStorageConnectorFactory.reset();
		EngineCoreFactory.reset();
	});

	it("delivers through PEP and trust from a constrained engine clone", async () => {
		// Build a source engine shaped like a production node: the components the
		// delivery path needs, plus a blob storage connector as a marker for a
		// component OUTSIDE the clone allowlist.
		const config: IEngineConfig = {
			debug: true,
			silent: true,
			types: {
				platformComponent: [{ type: PlatformComponentType.Service }],
				loggingConnector: [{ type: LoggingConnectorType.EntityStorage }],
				loggingComponent: [{ type: LoggingComponentType.Service }],
				entityStorageConnector: [{ type: EntityStorageConnectorType.Memory, options: {} }],
				blobStorageConnector: [{ type: BlobStorageConnectorType.Memory }],
				vaultConnector: [{ type: VaultConnectorType.EntityStorage }],
				identityConnector: [{ type: IdentityConnectorType.EntityStorage }],
				identityComponent: [{ type: IdentityComponentType.Service }],
				trustComponent: [{ type: TrustComponentType.Service }],
				trustGeneratorComponent: [
					{
						type: TrustGeneratorComponentType.JwtVerifiableCredential,
						options: { config: { verificationMethodId: VERIFICATION_METHOD_ID } }
					}
				],
				rightsManagementPapComponent: [{ type: RightsManagementPapComponentType.Service }],
				rightsManagementPmpComponent: [{ type: RightsManagementPmpComponentType.Service }],
				rightsManagementPipComponent: [{ type: RightsManagementPipComponentType.Service }],
				rightsManagementPxpComponent: [{ type: RightsManagementPxpComponentType.Service }],
				rightsManagementPdpComponent: [{ type: RightsManagementPdpComponentType.Service }],
				rightsManagementPepComponent: [{ type: RightsManagementPepComponentType.Service }],
				rightsManagementPolicyArbiterComponent: [
					{ type: RightsManagementPolicyArbiterComponentType.PassThrough }
				],
				rightsManagementPolicyEnforcementProcessorComponent: [
					{ type: RightsManagementPolicyEnforcementProcessorComponentType.PassThrough }
				]
			}
		};

		const sourceEngine = new Engine({ config });
		await sourceEngine.start();
		const engineCloneData = sourceEngine.getCloneData();
		await sourceEngine.stop();

		// The worker thread starts with empty factories; the entity storages stay
		// registered to emulate the shared database the clone connects back to.
		ComponentFactory.reset();
		IdentityConnectorFactory.reset();
		VaultConnectorFactory.reset();
		LoggingConnectorFactory.reset();
		TrustGeneratorFactory.reset();

		const fetchSpy = vi.spyOn(FetchHelper, "fetchJson").mockResolvedValue(undefined);

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
		const result = await ContextIdStore.run({ [ContextIdKeys.Node]: nodeIdentity }, async () => {
			await pushDeliveryRunnerStart(engineCloneData);
			return pushDeliveryRunner(engineCloneData, roundTrippedPayload);
		});

		expect(result).toEqual({ success: true });

		// The clone populated the factories itself, proving the type allowlist boots
		// the connectors the delivery path needs.
		expect(IdentityConnectorFactory.getIfExists("entity-storage")).toBeDefined();
		expect(VaultConnectorFactory.getIfExists("entity-storage")).toBeDefined();

		const cloneEngine = EngineCoreFactory.get<IEngineCore>("engine");
		expect(
			cloneEngine.getRegisteredInstanceTypeOptional("rightsManagementPepComponent")
		).toBeDefined();
		expect(cloneEngine.getRegisteredInstanceTypeOptional("trustComponent")).toBeDefined();
		// The marker component outside the allowlist was not instantiated in the clone.
		expect(cloneEngine.getRegisteredInstanceTypeOptional("blobStorageConnector")).toBeUndefined();

		// No pre-packaged auth token in the payload, so the trust chain generated a JWT
		// through identity and vault, and the PEP-processed data was delivered.
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [, endpoint, method, activity, fetchOptions] = fetchSpy.mock.calls[0];
		expect(endpoint).toEqual("https://consumer.example.com/inbox");
		expect(method).toEqual("POST");
		expect(activity).toEqual(
			expect.objectContaining({
				actor: nodeIdentity,
				to: payload.consumerPid,
				object: payload.data
			})
		);
		const authHeader = fetchOptions?.headers?.[HeaderTypes.Authorization];
		expect(authHeader).toEqual(expect.stringMatching(/^Bearer .+\..+\..+$/));
	});
});
