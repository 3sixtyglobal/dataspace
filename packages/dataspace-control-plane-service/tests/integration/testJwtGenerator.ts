// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Test JWT Token Generator for integration tests.
 *
 * Generates JWT tokens for testing purposes. These tokens are NOT
 * cryptographically signed (or use a test key), since our test verifier
 * doesn't validate signatures.
 *
 * ⚠️ WARNING: These tokens are for TESTING ONLY.
 */

import { Converter } from "@twin.org/core";
import type { ITrustGenerator } from "@twin.org/trust-models";
import { Jwt } from "@twin.org/web";

const TEST_JWT_KEY = Converter.utf8ToBytes("test-secret-key-for-integration-tests-min-32-chars");

/**
 * Test JWT Generator implementing ITrustGenerator.
 * Generates test JWTs that TestJwtVerifier can verify.
 */
export class TestJwtGenerator implements ITrustGenerator {
	public static readonly CLASS_NAME: string = "TestJwtGenerator";

	public className(): string {
		return TestJwtGenerator.CLASS_NAME;
	}

	public async generate(
		identity: string,
		info?: { [key: string]: unknown },
		tenantIdHash?: string,
		organizationId?: string
	): Promise<unknown> {
		const now = Math.floor(Date.now() / 1000);
		const payload: { [key: string]: unknown } = {
			sub: identity,
			iat: now,
			exp: now + 3600,
			iss: "test-generator",
			...info
		};
		if (tenantIdHash) {
			payload.tid = tenantIdHash;
		}
		return Jwt.encode({ alg: "HS256", typ: "JWT" }, payload, TEST_JWT_KEY);
	}
}

/**
 * Generate a test JWT token with specified identity and expiration.
 *
 * Creates a simple JWT token using HS256 algorithm with a test secret.
 * Since our test verifier doesn't validate signatures, any key works.
 *
 * @param identity DID identity to include in token (e.g., "did:iota:consumer-node-abc").
 * @param expiresInSeconds Token expiration time in seconds (default: 1 hour).
 * @returns JWT token string.
 */
export async function generateTestJwt(
	identity: string,
	expiresInSeconds: number = 3600
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);

	// JWT header
	const header = {
		alg: "HS256",
		typ: "JWT"
	};

	// JWT payload with standard claims
	// Note: 'sub' should be a string (the DID) per JWT spec
	const payload = {
		sub: identity, // Subject (DID identity as string)
		iat: now, // Issued at
		exp: now + expiresInSeconds, // Expiration
		iss: "test-issuer", // Issuer
		aud: "test-audience" // Audience
	};

	// Encode JWT using the Jwt utility
	// Key must be Uint8Array for HS256
	const key = TEST_JWT_KEY;
	const token = await Jwt.encode(header, payload, key);

	return token;
}

/**
 * Generate an expired test JWT token (for testing expiration handling).
 * @param identity DID identity to include in token.
 * @returns Expired JWT token string.
 */
export async function generateExpiredTestJwt(identity: string): Promise<string> {
	const now = Math.floor(Date.now() / 1000);

	const header = { alg: "HS256", typ: "JWT" };
	const payload = {
		sub: identity, // Subject (DID identity as string)
		iat: now - 7200, // Issued 2 hours ago
		exp: now - 3600, // Expired 1 hour ago
		iss: "test-issuer",
		aud: "test-audience"
	};

	const key = TEST_JWT_KEY;
	const token = await Jwt.encode(header, payload, key);

	return token;
}

/**
 * Generate a test JWT token without identity (for testing validation).
 * @returns JWT token without identity claim.
 */
export async function generateTestJwtWithoutIdentity(): Promise<string> {
	const now = Math.floor(Date.now() / 1000);

	const header = { alg: "HS256", typ: "JWT" };
	const payload = {
		sub: "", // Empty subject (invalid)
		iat: now,
		exp: now + 3600,
		iss: "test-issuer",
		aud: "test-audience"
	};

	const key = TEST_JWT_KEY;
	const token = await Jwt.encode(header, payload, key);

	return token;
}
