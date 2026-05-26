// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceControlPlaneServiceConfig } from "./IDataspaceControlPlaneServiceConfig.js";

/**
 * Dataspace Control Plane service constructor options.
 */
export interface IDataspaceControlPlaneServiceConstructorOptions {
	/**
	 * Policy Administration Point component type.
	 * Used for Agreement lookup and validation during Transfer Process initiation.
	 * @default policy-administration-point
	 */
	policyAdministrationPointComponentType?: string;

	/**
	 * Policy Negotiation Point component type.
	 * Used for contract negotiation to create agreements before transfer processes.
	 * @default policy-negotiation-point
	 */
	policyNegotiationPointComponentType?: string;

	/**
	 * Policy Negotiation Admin Point component type.
	 * Used for querying negotiation history.
	 * Optional - if not provided, negotiation history will not be available.
	 * @default policy-negotiation-admin-point
	 */
	policyNegotiationAdminPointComponentType?: string;

	/**
	 * Federated Catalogue component type.
	 * Used for dataset validation during Transfer Process initiation.
	 * Validates that Agreements reference valid catalog datasets.
	 * @default federated-catalogue
	 */
	federatedCatalogueComponentType?: string;

	/**
	 * Logging component type.
	 * @default logging
	 */
	loggingComponentType?: string;

	/**
	 * Identity component type (for token signing/verification).
	 * @default identity
	 */
	identityComponentType?: string;

	/**
	 * Identity Authentication component type (for token validation).
	 * @default identity-authentication
	 */
	identityAuthenticationComponentType?: string;

	/**
	 * Trust component type for trust verification.
	 * Used to verify JWT/VC tokens and extract identity information.
	 * @default trust
	 */
	trustComponentType?: string;

	/**
	 * Entity storage type for Transfer Process entities.
	 * Used to persist transfer state for the consumerPid flow.
	 * Must match the Data Plane's transferProcessEntityStorageType for shared storage.
	 * @default transfer-process
	 */
	transferProcessEntityStorageType?: string;

	/**
	 * Entity storage type for Dataspace App Dataset entities.
	 * @default dataspace-app-dataset
	 */
	dataspaceAppDatasetEntityStorageType?: string;

	/**
	 * Task scheduler component type for periodic cleanup of stalled negotiations.
	 * @default task-scheduler
	 */
	taskSchedulerComponentType?: string;

	/**
	 * Data Plane component type, used to invoke push subscription lifecycle methods.
	 * @default dataspace-data-plane
	 */
	dataPlaneComponentType?: string;

	/**
	 * URL Transformer component type used to encrypt the tenant token into the data-plane.
	 * @default url-transformer
	 */
	urlTransformerComponentType?: string;

	/**
	 * The configuration of the Dataspace Control Plane Service.
	 */
	config?: IDataspaceControlPlaneServiceConfig;
}
