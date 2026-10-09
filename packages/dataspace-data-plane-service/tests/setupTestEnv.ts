// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import fs from "node:fs";
import path from "node:path";
import { EnvHelper, NotFoundError, RandomHelper } from "@3sixty/core";
import { nameof } from "@3sixty/nameof";
import type {
	IPolicyAdministrationPointComponent,
	IPolicyEnforcementPointComponent,
	IRightsManagementAgreement,
	IRightsManagementOffer,
	IRightsManagementPolicy,
	IRightsManagementSet
} from "@3sixty/rights-management-models";
import type { ITrustComponent } from "@3sixty/trust-models";
import * as dotenv from "dotenv";

console.debug("Setting up test environment from .env and .env.dev files");

dotenv.config({
	path: [path.join(__dirname, ".env-test"), path.join(__dirname, ".env.dev")],
	quiet: true
});

/**
 * Setup the test environment.
 * @returns the Clearing House Approver list.
 */
export async function setupTestEnv(): Promise<void> {
	await cleanupTestEnv();

	EnvHelper.envToJson(process.env, "DATASPACE_DATA_PLANE");

	RandomHelper.generate = vi
		.fn()
		.mockImplementationOnce(length => new Uint8Array(length).fill(99))
		.mockImplementation(length => new Uint8Array(length).fill(88));
}

/**
 * Cleanup the test environment.
 */
export async function cleanupTestEnv(): Promise<void> {
	try {
		fs.rmSync(path.join(__dirname, ".tmp"), { recursive: true });
	} catch {}
}

/**
 * Creates a mock policy enforcement point for testing.
 * @param interceptResult The result that interceptWithPolicy should return.
 * If undefined, the PEP returns the input data unchanged (granted).
 * @returns A mock IPolicyEnforcementPointComponent.
 */
export function createMockPolicyEnforcementPoint<D = unknown>(
	interceptResult?: D
): IPolicyEnforcementPointComponent {
	return {
		className: () => "MockPolicyEnforcementPoint",
		interceptWithPolicy: async <T = unknown>(agreement: unknown, data?: T): Promise<T> =>
			(interceptResult as T) ?? (data as T),
		interceptWithId: async <T = unknown>(uid: string, data?: T): Promise<T> =>
			(interceptResult as T) ?? (data as T),
		interceptWithLocator: async <T = unknown>(locator: unknown, data?: T): Promise<T> =>
			(interceptResult as T) ?? (data as T)
	} as unknown as IPolicyEnforcementPointComponent;
}

/**
 * Creates a simple in-memory mock PAP for testing.
 * Pre-seed agreements with addAgreement; remove them with removeAgreement to simulate revocation.
 * @returns A mock IPolicyAdministrationPointComponent with helper methods.
 */
export function createMockPolicyAdministrationPoint(): IPolicyAdministrationPointComponent & {
	addAgreement(agreement: IRightsManagementAgreement): void;
	removeAgreement(agreementId: string): void;
} {
	const policies = new Map<string, IRightsManagementPolicy>();
	const CLASS_NAME = "MockPolicyAdministrationPointComponent";

	const impl: unknown = {
		className: () => CLASS_NAME,
		bootstrap: async () => true,
		start: async () => {},
		stop: async () => {},
		create: async (policy: Omit<IRightsManagementPolicy, "uid"> & { uid?: string }) => {
			const uid = (policy as { uid?: string }).uid ?? `generated-${nameof(policy)}`;
			policies.set(uid, { ...policy, uid } as IRightsManagementPolicy);
			return uid;
		},
		get: async (policyId: string) => {
			const policy = policies.get(policyId);
			if (!policy) {
				throw new NotFoundError(CLASS_NAME, "policyNotFound", undefined, { policyId });
			}
			return policy;
		},
		getAgreement: async (agreementId: string) => {
			const agreement = policies.get(agreementId);
			if (!agreement) {
				throw new NotFoundError(CLASS_NAME, "policyNotFound", undefined, {
					policyId: agreementId
				});
			}
			return agreement as IRightsManagementAgreement;
		},
		getOffer: async (offerId: string) => {
			const offer = policies.get(offerId);
			if (!offer) {
				throw new NotFoundError(CLASS_NAME, "policyNotFound", undefined, { policyId: offerId });
			}
			return offer as IRightsManagementOffer;
		},
		getSet: async (setId: string) => {
			const set = policies.get(setId);
			if (!set) {
				throw new NotFoundError(CLASS_NAME, "policyNotFound", undefined, { policyId: setId });
			}
			return set as IRightsManagementSet;
		},
		update: async (policy: IRightsManagementPolicy) => {
			policies.set(policy["@id"], policy);
		},
		remove: async (policyId: string) => {
			policies.delete(policyId);
		},
		query: async () => ({ policies: [...policies.values()] }),
		addAgreement(agreement: IRightsManagementAgreement) {
			policies.set(agreement["@id"], agreement);
		},
		removeAgreement(agreementId: string) {
			policies.delete(agreementId);
		}
	};
	return impl as IPolicyAdministrationPointComponent & {
		addAgreement(agreement: IRightsManagementAgreement): void;
		removeAgreement(agreementId: string): void;
	};
}

/**
 * Creates a mock trust component for testing.
 * @param token The token value returned by verify. Defaults to "test-transfer-token".
 * @param identity The identity returned by verify. Defaults to "did:iota:testnet:consumer-node".
 * @returns A mock ITrustComponent.
 */
export function createMockTrustComponent(
	token: string = "test-transfer-token",
	identity: string = "did:iota:testnet:consumer-node"
): ITrustComponent {
	return {
		className: () => "MockTrustComponent",
		verify: async () => ({
			verified: true,
			info: {
				token,
				identity
			}
		})
	} as unknown as ITrustComponent;
}
