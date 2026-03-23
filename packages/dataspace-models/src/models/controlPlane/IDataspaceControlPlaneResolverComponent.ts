// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type { ITransferContext } from "./ITransferContext.js";

/**
 * Dataspace Control Plane Resolver Component interface.
 * Provides methods for resolving transfer process information.
 * Used by dataspace-data-plane to retrieve dataset and policy information for data access.
 *
 * These methods are NOT part of the Eclipse Dataspace Protocol specification.
 * They are TWIN-specific extensions for internal service communication.
 *
 * IMPORTANT: This interface has NO REST client implementation - methods are only
 * accessible via ComponentFactory.get() for local, in-process service access.
 */
export interface IDataspaceControlPlaneResolverComponent extends IComponent {
	/**
	 * Resolve consumerPid to Transfer Context.
	 * Returns Transfer Context with Agreement, datasetId, and Transfer Process metadata.
	 * Validates that Agreement assigner matches current organization ID for security.
	 * This method is called by the dataspace-data-plane to resolve a consumerPid
	 * to the corresponding Agreement and dataset information for data retrieval (pull mode).
	 *
	 * This method is only available via ComponentFactory.get().
	 * There is no REST client implementation.
	 *
	 * @param consumerPid Consumer Process ID from the transfer request.
	 * @param trustPayload Trust payload containing authorization information (JWT, VC, etc.).
	 * The trust service handles verification and extracts identity and token.
	 * @returns Transfer Context with Agreement, datasetId, and Transfer Process metadata.
	 * @throws NotFoundError if Transfer Process not found.
	 * @throws UnauthorizedError if trust verification fails or Agreement assigner doesn't match current organization.
	 * @throws GeneralError if Transfer Process is terminated or Agreement lookup fails.
	 */
	resolveConsumerPid(consumerPid: string, trustPayload: unknown): Promise<ITransferContext>;

	/**
	 * Resolve providerPid to Transfer Context.
	 * Returns Transfer Context with Agreement, datasetId, and Transfer Process metadata.
	 * Used for push mode data transfer where Provider needs to push data to Consumer via Activity Stream.
	 * Validates that Agreement assigner matches current organization ID and assignee matches expected consumer for security.
	 *
	 * This method is called by the Provider's dataspace-data-plane when it receives an Activity
	 * referencing a providerPid and needs to resolve it to get Agreement, dataset, and consumer's dataAddress.
	 *
	 * This method is only available via ComponentFactory.get().
	 * There is no REST client implementation.
	 *
	 * @param providerPid Provider Process ID from the transfer process.
	 * @param trustPayload Trust payload containing authorization information (JWT, VC, etc.).
	 * The trust service handles verification and extracts identity and token.
	 * @returns Transfer Context with Agreement, datasetId, and Transfer Process metadata.
	 * @throws NotFoundError if Transfer Process not found.
	 * @throws UnauthorizedError if trust verification fails, Agreement assigner doesn't match current organization, or assignee doesn't match expected consumer.
	 * @throws GeneralError if Transfer Process is terminated or Agreement lookup fails.
	 */
	resolveProviderPid(providerPid: string, trustPayload: unknown): Promise<ITransferContext>;
}
