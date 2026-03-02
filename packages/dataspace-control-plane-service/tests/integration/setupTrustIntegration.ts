// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Integration test setup for Trust Service.
 *
 * This module provides helpers to set up and clean up a real TrustService
 * with a test-specific JWT verifier for integration tests.
 *
 * Unlike PAP and FederatedCatalogue, TrustService doesn't need storage
 * (it's stateless), so setup is simpler.
 */

import { ComponentFactory } from "@twin.org/core";
import type { ITrustComponent } from "@twin.org/trust-models";
import { TrustVerifierFactory } from "@twin.org/trust-models";
import { TrustService } from "@twin.org/trust-service";
import { createTestJwtVerifier } from "./testJwtVerifier.js";

/**
 * Create a real Trust Service with test JWT verifier.
 * @returns Real Trust Service instance.
 */
export function createRealTrustService(): TrustService {
	// Register test JWT verifier globally with TrustVerifierFactory
	TrustVerifierFactory.register("test-jwt-verifier", () => createTestJwtVerifier());

	// Create TrustService
	// Verifiers are registered globally with TrustVerifierFactory, not passed to service
	const trustService = new TrustService();

	return trustService;
}

/**
 * Set up Trust Service integration for tests.
 * Registers the Trust Service with ComponentFactory using the provided component name.
 * @param componentName Component name to register (e.g., "test-trust").
 * @returns Trust Service instance.
 */
export function setupTrustIntegration(componentName: string = "test-trust"): {
	trust: ITrustComponent;
} {
	// Create real Trust Service
	const trust = createRealTrustService();

	// Register with ComponentFactory
	ComponentFactory.register(componentName, () => trust);

	return { trust };
}

/**
 * Clean up Trust Service integration after tests.
 * Unregisters the Trust Service from ComponentFactory.
 * @param componentName - Component name to unregister (e.g., "test-trust").
 */
export function cleanupTrustIntegration(componentName: string = "test-trust"): void {
	ComponentFactory.unregister(componentName);
}
