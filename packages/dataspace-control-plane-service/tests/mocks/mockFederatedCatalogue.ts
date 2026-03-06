// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Is } from "@twin.org/core";
import type { IFederatedCatalogueComponent } from "@twin.org/federated-catalogue-models";
import { nameof } from "@twin.org/nameof";
import {
	DataspaceProtocolCatalogTypes,
	DataspaceProtocolContexts
} from "@twin.org/standards-dataspace-protocol";
import type {
	IDataspaceProtocolCatalog,
	IDataspaceProtocolCatalogError,
	IDataspaceProtocolDataset
} from "@twin.org/standards-dataspace-protocol";
import type { IDcatDataset } from "@twin.org/standards-w3c-dcat";

/**
 * Mock Federated Catalogue component for testing.
 * Pre-populated with test datasets for various scenarios.
 *
 * Note: IComponent lifecycle methods (bootstrap, start, stop) are optional
 * per IComponent interface and not implemented in this mock as they are
 * not required for testing the control plane service.
 *
 * TODO: Replace with real FederatedCatalogueService once stable.
 */
export class MockFederatedCatalogueComponent implements IFederatedCatalogueComponent {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<MockFederatedCatalogueComponent>();

	/**
	 * In-memory storage for test datasets.
	 * @internal
	 */
	private readonly _datasets: Map<string, IDcatDataset>;

	/**
	 * Create a new instance of MockFederatedCatalogueComponent.
	 */
	constructor() {
		this._datasets = new Map<string, IDcatDataset>();
		this.initializeTestDatasets();
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return MockFederatedCatalogueComponent.CLASS_NAME;
	}

	/**
	 * Get a specific dataset by ID (dataset ID or offer ID).
	 * Supports lookup by both dataset ID and offer ID for convenience.
	 * @param datasetId The dataset ID or offer ID.
	 * @returns The dataset or error.
	 */
	public async get(datasetId: string): Promise<IDcatDataset | IDataspaceProtocolCatalogError> {
		// Try direct dataset ID lookup first
		let dataset = this._datasets.get(datasetId);

		// If not found, try searching by offer ID
		if (!dataset) {
			for (const ds of this._datasets.values()) {
				const offers = ds["odrl:hasPolicy"] ?? ("hasPolicy" in ds ? ds.hasPolicy : undefined);
				if (Is.arrayValue(offers)) {
					const matchingOffer = offers.find(
						(offer: unknown) =>
							Is.object(offer) && (offer as { "@id"?: string })["@id"] === datasetId
					);
					if (matchingOffer) {
						dataset = ds;
						break;
					}
				}
			}
		}

		if (!dataset) {
			return {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": DataspaceProtocolCatalogTypes.CatalogError,
				code: "NotFoundError:datasetNotFound"
			};
		}
		return dataset;
	}

	/**
	 * Set a dataset.
	 * @param dataSet The dataset to set.
	 */
	public async set(dataSet: IDcatDataset): Promise<void> {
		const id = dataSet["@id"];
		if (Is.string(id)) {
			this._datasets.set(id, dataSet);
		}
	}

	/**
	 * Query the catalog.
	 * @param _filter Optional filter (not used in mock - returns all datasets).
	 * @param _cursor Optional cursor for pagination (not used in mock).
	 * @param _limit Optional limit for pagination (not used in mock).
	 * @returns The catalog result with all datasets.
	 */
	public async query(
		_filter?: unknown[],
		_cursor?: string,
		_limit?: number
	): Promise<{
		result: IDataspaceProtocolCatalog | IDataspaceProtocolCatalogError;
		cursor?: string;
	}> {
		return {
			result: {
				"@context": [DataspaceProtocolContexts.JsonLdContext],
				"@type": DataspaceProtocolCatalogTypes.Catalog,
				"@id": "urn:uuid:mock-catalog",
				participantId: "did:iota:test-provider",
				dataset: [...this._datasets.values()] as unknown as IDataspaceProtocolDataset[]
			}
		};
	}

	/**
	 * Remove a dataset.
	 * @param dataSetId The dataset ID to remove.
	 */
	public async remove(dataSetId: string): Promise<void> {
		this._datasets.delete(dataSetId);
	}

	// ============================================================================
	// TEST HELPER METHODS
	// ============================================================================

	/**
	 * Add a test dataset.
	 * @param datasetId The dataset ID.
	 * @param dataset The dataset to add.
	 */
	public addDataset(datasetId: string, dataset: IDcatDataset): void {
		this._datasets.set(datasetId, dataset);
	}

	/**
	 * Clear all datasets.
	 */
	public clearDatasets(): void {
		this._datasets.clear();
	}

	/**
	 * Initialize test datasets for common scenarios.
	 * NOTE: Keys are now full URNs (not short IDs) to match DCAT standards
	 * and real FederatedCatalogueService behavior.
	 * @internal
	 */
	private initializeTestDatasets(): void {
		// Dataset for agreement-valid-urn
		// KEY CHANGE: Use full URN as key, not short ID
		this._datasets.set("urn:uuid:dataset-123", {
			"@context": [DataspaceProtocolContexts.JsonLdContext],
			"@type": "dcat:Dataset",
			"@id": "urn:uuid:dataset-123",
			"dcterms:title": "Test Dataset 123",
			"odrl:hasPolicy": [
				{
					"@type": "odrl:Offer",
					"@id": "offer-123",
					assigner: "did:iota:provider-node-xyz",
					target: "urn:uuid:dataset-123",
					permission: [
						{
							action: "read"
						}
					]
				}
			]
		} as unknown as IDcatDataset);

		// Dataset for agreement-456 and agreement-valid-path
		this._datasets.set("urn:uuid:dataset-456", {
			"@context": [DataspaceProtocolContexts.JsonLdContext],
			"@type": "dcat:Dataset",
			"@id": "urn:uuid:dataset-456",
			"dcterms:title": "Test Dataset 456",
			"odrl:hasPolicy": [
				{
					"@type": "odrl:Offer",
					"@id": "offer-456",
					assigner: "did:iota:provider-node-xyz",
					target: "urn:uuid:dataset-456",
					permission: [
						{
							action: "read"
						}
					]
				}
			]
		} as unknown as IDcatDataset);

		// Dataset for agreement-active
		this._datasets.set("urn:uuid:dataset-789", {
			"@context": [DataspaceProtocolContexts.JsonLdContext],
			"@type": "dcat:Dataset",
			"@id": "urn:uuid:dataset-789",
			"dcterms:title": "Test Dataset 789",
			"odrl:hasPolicy": [
				{
					"@type": "odrl:Offer",
					"@id": "offer-789",
					assigner: "did:iota:provider-node-xyz",
					target: "urn:uuid:dataset-789",
					permission: [
						{
							action: "read"
						}
					]
				}
			]
		} as unknown as IDcatDataset);

		// Dataset for routes test (agreement-new-test)
		this._datasets.set("urn:uuid:dataset-new-test", {
			"@context": [DataspaceProtocolContexts.JsonLdContext],
			"@type": "dcat:Dataset",
			"@id": "urn:uuid:dataset-new-test",
			"dcterms:title": "Test Dataset New Test",
			"odrl:hasPolicy": [
				{
					"@type": "odrl:Offer",
					"@id": "offer-new-test",
					assigner: "did:iota:provider-node-xyz",
					target: "urn:uuid:dataset-new-test",
					permission: [
						{
							action: "read"
						}
					]
				}
			]
		} as unknown as IDcatDataset);

		// Dataset for push mode tests
		this._datasets.set("urn:uuid:dataset-push", {
			"@context": [DataspaceProtocolContexts.JsonLdContext],
			"@type": "dcat:Dataset",
			"@id": "urn:uuid:dataset-push",
			"dcterms:title": "Test Dataset Push",
			"odrl:hasPolicy": [
				{
					"@type": "odrl:Offer",
					"@id": "offer-push",
					assigner: "did:iota:provider-node-xyz",
					target: "urn:uuid:dataset-push",
					permission: [
						{
							action: "read"
						}
					]
				}
			]
		} as unknown as IDcatDataset);

		// Dataset for push mode tests (provider PID)
		this._datasets.set("urn:uuid:dataset-push-123", {
			"@context": [DataspaceProtocolContexts.JsonLdContext],
			"@type": "dcat:Dataset",
			"@id": "urn:uuid:dataset-push-123",
			"dcterms:title": "Test Dataset Push 123",
			"odrl:hasPolicy": [
				{
					"@type": "odrl:Offer",
					"@id": "offer-push-123",
					assigner: "did:iota:provider-node-xyz",
					target: "urn:uuid:dataset-push-123",
					permission: [
						{
							action: "read"
						}
					]
				}
			]
		} as unknown as IDcatDataset);

		// Dataset for workflow tests
		this._datasets.set("urn:uuid:dataset-workflow-123", {
			"@context": [DataspaceProtocolContexts.JsonLdContext],
			"@type": "dcat:Dataset",
			"@id": "urn:uuid:dataset-workflow-123",
			"dcterms:title": "Test Dataset Workflow 123",
			"odrl:hasPolicy": [
				{
					"@type": "odrl:Offer",
					"@id": "offer-workflow-123",
					assigner: "did:iota:provider-node-xyz",
					target: "urn:uuid:dataset-workflow-123",
					permission: [
						{
							action: "read"
						}
					]
				}
			]
		} as unknown as IDcatDataset);

		// Dataset for negotiation tests - with valid offer
		this._datasets.set("offer-negotiation-valid", {
			"@context": [DataspaceProtocolContexts.JsonLdContext],
			"@type": "dcat:Dataset",
			"@id": "urn:uuid:dataset-negotiation-valid",
			"dcterms:title": "Test Dataset for Negotiation",
			"odrl:hasPolicy": [
				{
					"@type": "odrl:Offer",
					"@id": "offer-negotiation-valid",
					assigner: "did:iota:provider-node-xyz",
					target: "urn:uuid:dataset-negotiation-valid",
					permission: [
						{
							action: "read"
						}
					]
				}
			]
		} as unknown as IDcatDataset);

		// Dataset for negotiation tests - multiple offers
		this._datasets.set("dataset-multi-offers", {
			"@context": [DataspaceProtocolContexts.JsonLdContext],
			"@type": "dcat:Dataset",
			"@id": "urn:uuid:dataset-multi-offers",
			"dcterms:title": "Dataset with Multiple Offers",
			"odrl:hasPolicy": [
				{
					"@type": "odrl:Offer",
					"@id": "offer-multi-1",
					assigner: "did:iota:provider-node-xyz",
					target: "urn:uuid:dataset-multi-offers",
					permission: [
						{
							action: "read"
						}
					]
				},
				{
					"@type": "odrl:Offer",
					"@id": "offer-multi-2",
					assigner: "did:iota:provider-node-xyz",
					target: "urn:uuid:dataset-multi-offers",
					permission: [
						{
							action: "write"
						}
					]
				}
			]
		} as unknown as IDcatDataset);

		// Dataset for negotiation tests - no offers
		this._datasets.set("dataset-no-offers", {
			"@context": [DataspaceProtocolContexts.JsonLdContext],
			"@type": "dcat:Dataset",
			"@id": "urn:uuid:dataset-no-offers",
			"dcterms:title": "Dataset without Offers"
			// No odrl:hasPolicy
		} as unknown as IDcatDataset);
	}
}
