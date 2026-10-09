// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ComponentFactory } from "@3sixty/core";
import type { IPolicyInformationPointComponent } from "@3sixty/rights-management-models";
import { PolicyInformationPointService } from "@3sixty/rights-management-pip-service";

/**
 * Setup PIP (Policy Information Point) for integration tests.
 * Uses real PIP service for policy evaluation context.
 */
export async function setupPipIntegration(): Promise<void> {
	// Initialize PIP service with real implementation
	const pipService = new PolicyInformationPointService();

	// Register with ComponentFactory
	ComponentFactory.register<IPolicyInformationPointComponent>(
		"policy-information-point",
		() => pipService
	);
}
