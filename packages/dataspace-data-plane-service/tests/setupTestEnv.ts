// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import fs from "node:fs";
import path from "node:path";
import { EnvHelper, RandomHelper } from "@twin.org/core";
import type { IPolicyEnforcementPointComponent } from "@twin.org/rights-management-models";
import type { ITrustComponent } from "@twin.org/trust-models";
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
