// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Test-specific JWT Verifier for integration tests.
 *
 * ⚠️ WARNING: This verifier is for TESTING ONLY and has intentional limitations:
 * - Does NOT perform cryptographic signature verification
 * - Does NOT resolve DIDs or verify DID documents
 * - Does NOT validate against blockchain/registry
 *
 * This simplified verifier is sufficient for integration tests because:
 * 1. We're testing the DataspaceControlPlaneService logic, not JWT crypto
 * 2. Full DID resolution requires complex IOTA infrastructure
 * 3. The real TrustService handles verification; we just need valid-looking tokens
 *
 * For production, use proper verifiers from @twin.org/trust-verifiers with full
 * DID resolution and signature validation.
 */

import { GeneralError, Is, type IError } from "@twin.org/core";
import type { ITrustVerificationInfo, ITrustVerifier } from "@twin.org/trust-models";
import { Jwt } from "@twin.org/web";

/**
 * Test JWT Verifier for integration tests.
 * Performs basic JWT structure validation and identity extraction.
 */
export class TestJwtVerifier implements ITrustVerifier {
	/**
	 * The class name for logging.
	 */
	public static readonly CLASS_NAME: string = "TestJwtVerifier";

	/**
	 * Verify a JWT token (test implementation).
	 * @param payload - JWT token to verify.
	 * @param info - Verification info object to mutate (sets info.identity).
	 * @param errors - Errors array to mutate if verification fails.
	 * @returns True if verified, false if failed, undefined if not processed.
	 *
	 * IMPORTANT: This follows the ITrustVerifier interface contract.
	 * - Returns: boolean (true if verified, false if failed, undefined if not processed)
	 * - Mutates the `info` parameter to set identity
	 * - Mutates the `errors` parameter to add errors
	 */
	public async verify(
		payload: unknown,
		info: ITrustVerificationInfo,
		errors: IError[]
	): Promise<boolean | undefined> {
		// Only process string payloads (JWT tokens)
		if (!Is.string(payload)) {
			return undefined; // Not our type, skip
		}

		const token = payload;

		try {
			// Decode JWT (no signature verification)
			// Jwt.decode is async and returns {header, payload, signature}
			const decoded = await Jwt.decode(token);

			if (!decoded?.payload) {
				const error: IError = new GeneralError(TestJwtVerifier.CLASS_NAME, "invalidToken", {
					message: "Failed to decode JWT token or missing payload"
				});
				errors.push(error);
				return false;
			}

			// Extract payload from decoded result
			const jwtPayload = decoded.payload as { [key: string]: unknown };

			// Check expiration (basic security check)
			if (jwtPayload.exp && Is.number(jwtPayload.exp)) {
				const expirationTime = jwtPayload.exp * 1000; // Convert to milliseconds
				if (Date.now() > expirationTime) {
					const error: IError = new GeneralError(TestJwtVerifier.CLASS_NAME, "tokenExpired", {
						message: "JWT token has expired"
					});
					errors.push(error);
					return false;
				}
			}

			// Extract identity from 'sub' claim (standard JWT format)
			// Expected format: { sub: "did:iota:..." }
			const identity = jwtPayload.sub as string | undefined;

			if (!identity || !Is.string(identity) || identity.length === 0) {
				const error: IError = new GeneralError(TestJwtVerifier.CLASS_NAME, "missingIdentity", {
					message: "JWT token missing or invalid 'sub' claim"
				});
				errors.push(error);
				return false;
			}

			// Verify identity is a valid DID format (basic check)
			if (!identity.startsWith("did:")) {
				const error: IError = new GeneralError(TestJwtVerifier.CLASS_NAME, "invalidIdentity", {
					message: "Identity must be a valid DID (did:...)"
				});
				errors.push(error);
				return false;
			}

			// ✅ MUTATE the info parameter (this is the correct ITrustVerifier pattern!)
			info.identity = identity;

			// ✅ Return true (boolean, not an object!)
			return true;
		} catch (error) {
			const err: IError = new GeneralError(TestJwtVerifier.CLASS_NAME, "verificationFailed", {
				message: `JWT verification failed: ${(error as Error).message}`
			});
			errors.push(err);
			return false;
		}
	}

	/**
	 * Get the class name.
	 * @returns Class name.
	 */
	public className(): string {
		return TestJwtVerifier.CLASS_NAME;
	}
}

/**
 * Create a test JWT verifier instance.
 * @returns Test JWT verifier.
 */
export function createTestJwtVerifier(): TestJwtVerifier {
	return new TestJwtVerifier();
}
