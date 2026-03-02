// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ComponentFactory } from "@twin.org/core";
import type { IPolicyNegotiationPointComponent } from "@twin.org/rights-management-models";
import { PolicyNegotiationPointService } from "@twin.org/rights-management-pnp-service";

/**
 * Setup PNP (Policy Negotiation Point) for integration tests.
 * Uses real PNP service. The PNP service will use ComponentFactory
 * to get its dependencies (PAP, PDP, PIP, PNAP, TrustService).
 */
export async function setupPnpIntegration(): Promise<void> {
	// Register remote PNP component factory for tests
	// In real usage, this would create HTTP client to remote node
	// For integration tests, we return self-reference to test in single instance
	ComponentFactory.register<IPolicyNegotiationPointComponent>(
		"policy-negotiation-point-remote",
		() => ComponentFactory.get<IPolicyNegotiationPointComponent>("policy-negotiation-point")
	);

	// Initialize PNP service - it will get dependencies from ComponentFactory
	const pnpService = new PolicyNegotiationPointService({
		// Use default component types - they should already be registered
		// by other setup functions (PAP, PDP, PIP, etc.)
		policyNegotiationPointRemoteComponentType: "policy-negotiation-point-remote",
		config: {
			callbackPath: "/negotiations/callback"
		}
	});

	// Register PNP service with ComponentFactory
	ComponentFactory.register<IPolicyNegotiationPointComponent>(
		"policy-negotiation-point",
		() => pnpService
	);
}
