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
	 */
	loggingComponentType?: string;

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
	 * Entity storage type for Transfer Retrieval entities; when not registered the one-shot
	 * policy is inactive. Must match the Data Plane's setting.
	 * @default transfer-retrieval
	 */
	transferRetrievalEntityStorageType?: string;

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
	 * Remote control plane component type used to make outbound DSP transfer requests.
	 * Created dynamically via ComponentFactory.create() with the provider endpoint as config.
	 * @default dataspace-control-plane-rest-client
	 */
	remoteControlPlaneComponentType?: string;

	/**
	 * Platform component type, used to retrieve public origin for constructing data plane URLs.
	 * @default platform
	 */
	platformComponentType?: string;

	/**
	 * The component type for the optional telemetry component used for metrics, defaults to no telemetry.
	 */
	telemetryComponentType?: string;

	/**
	 * The configuration of the Dataspace Control Plane Service.
	 */
	config?: IDataspaceControlPlaneServiceConfig;
}
