// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { setupPipIntegration } from "./setupPipIntegration.js";
import { setupPnpIntegration } from "./setupPnpIntegration.js";

/**
 * Setup all Rights Management components for integration tests.
 * This includes PAP, PIP, and PNP services.
 *
 * Note: PAP setup is handled separately in the main test setup.
 *
 * PDP and PMP are not needed for consumer-side negotiation.
 * They are only required when the service acts as a provider
 * and needs to evaluate incoming policy requests.
 */
export async function setupRightsManagement(): Promise<void> {
	// Setup rights management components for consumer-side negotiation
	await setupPipIntegration(); // PIP for policy evaluation context (used by PNP)
	await setupPnpIntegration(); // PNP manages negotiation protocol
}
