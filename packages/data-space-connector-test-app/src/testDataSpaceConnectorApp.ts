// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ContextIdHelper, ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory } from "@twin.org/core";
import { DataTypeHandlerFactory } from "@twin.org/data-core";
import type { IJsonLdDocument } from "@twin.org/data-json-ld";
import type {
	IActivityQuery,
	IDataRequest,
	IDataSpaceConnector,
	IDataSpaceConnectorApp,
	IDsProtocolDataset
} from "@twin.org/data-space-connector-models";
import type { ILoggingComponent } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
import { DcatClasses } from "@twin.org/standards-w3c-dcat";
import type { ITestAppConstructorOptions } from "./ITestAppConstructorOptions.js";

// Dummy Data
const id = "urn:ucr:24PLP051219453I002610799053311";
const entities = [
	{
		"@context": "https://vocabulary.uncefact.org/unece-context-D23B.jsonld",
		type: "Consignment",
		id,
		destinationCountry: {
			type: "Country",
			countryId: "unece:CountryId#GB"
		}
	},
	{
		"@context": "https://vocabulary.uncefact.org/unece-context-D23B.jsonld",
		type: "Document",
		id: "urn:document:a3456fddaa56",
		documentTypeCode: "unece:DocumentCodeList#853"
	}
];

/**
 * Test App Activity Handler.
 */
export class TestDataSpaceConnectorApp implements IDataSpaceConnectorApp {
	/**
	 * App Name.
	 */
	public static readonly APP_ID = "https://twin.example.org/app1";

	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<TestDataSpaceConnectorApp>();

	/**
	 * Data space connector component.
	 * @internal
	 */
	private readonly _dataSpaceConnectorComponent: IDataSpaceConnector;

	/**
	 * Logging service.
	 * @internal
	 */
	private readonly _loggingService?: ILoggingComponent;

	/**
	 * Node Identity
	 * @internal
	 */
	private _nodeId?: string;

	/**
	 * Create a new instance of TestDataSpaceConnectorApp.
	 * @param options The constructor options.
	 */
	constructor(options?: ITestAppConstructorOptions) {
		this._dataSpaceConnectorComponent = ComponentFactory.get<IDataSpaceConnector>(
			options?.dataSpaceConnectorComponentType ?? "data-space-connector"
		);
		this._loggingService = ComponentFactory.getIfExists<ILoggingComponent>(
			options?.loggingComponentType ?? "logging"
		);
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return TestDataSpaceConnectorApp.CLASS_NAME;
	}

	/**
	 * Datasets handled by the App.
	 * @returns DS Protocol compliant datasets
	 */
	public datasetsHandled(): IDsProtocolDataset[] {
		return [
			{
				"@id": "https://twin.example.org/data-service-1",
				"@type": DcatClasses.Dataset,
				"odrl:hasPolicy": [
					{
						"@context": "http://www.w3.org/ns/odrl.jsonld",
						"@type": "Offer",
						"@id": "urn:uuid:test-policy-offer-1",
						uid: "urn:uuid:test-policy-offer-1",
						assigner: "https://twin.example.org",
						permission: []
					}
				],
				"dcat:distribution": {
					"@id": "https://twin.example.org/distribution-1",
					"@type": "Distribution",
					"dcat:accessService": "https://twin.example.org/data-service-1",
					"dcterms:format": "Http-Pull-Query-Format"
				},
				"dcterms:type": "https://vocabulary.uncefact.org/Consignment"
			}
		];
	}

	/**
	 * Supported query types.
	 * @returns Types.
	 */
	public supportedQueryTypes(): string[] {
		return ["TestQueryType"];
	}

	/**
	 * Start method.
	 * @param nodeLoggingComponentType the logging component type of such a node.
	 */
	public async start(nodeLoggingComponentType?: string): Promise<void> {
		const contextIds = await ContextIdStore.getContextIds();
		ContextIdHelper.guard(contextIds, ContextIdKeys.Node);
		this._nodeId = contextIds[ContextIdKeys.Node];

		await this._dataSpaceConnectorComponent.registerApp(TestDataSpaceConnectorApp.APP_ID, this);

		DataTypeHandlerFactory.register("https://twin.example.org/MyCreate", () => ({
			context: "https://twin.example.org/",
			type: "MyCreate",
			defaultValue: {},
			jsonSchema: async () => ({
				type: "object"
			})
		}));

		DataTypeHandlerFactory.register("https://vocabulary.uncefact.org/Consignment", () => ({
			context: "https://vocabulary.uncefact.org/",
			type: "Consignment",
			defaultValue: {},
			jsonSchema: async () => ({
				type: "object"
			})
		}));
	}

	/**
	 * The activities handled by the App.
	 * @returns The activities handled by the App.
	 */
	public activitiesHandled(): IActivityQuery[] {
		return [{ objectType: "https://vocabulary.uncefact.org/Consignment" }];
	}

	/**
	 * Handle Activity.
	 * @param activity Activity
	 * @returns Activity processing result
	 */
	public async handleActivity<T>(activity: IActivityStreamsActivity): Promise<T> {
		await this._loggingService?.log({
			level: "info",
			source: TestDataSpaceConnectorApp.CLASS_NAME,
			message: `App Called: ${TestDataSpaceConnectorApp.APP_ID}`
		});

		await this._loggingService?.log({
			level: "info",
			source: TestDataSpaceConnectorApp.CLASS_NAME,
			message: `Node Identity: ${this._nodeId ?? ""}`
		});

		await new Promise(resolve => setTimeout(resolve, 500));
		return "1234" as T;
	}

	/**
	 * Handles the Data Request.
	 * @param dataRequest The data request
	 * @returns the Data.
	 */
	public async handleDataRequest(
		dataRequest: IDataRequest
	): Promise<{ data: IJsonLdDocument; cursor?: string }> {
		switch (dataRequest.type) {
			case "DataAssetEntities": {
				if (dataRequest.entitySet.entityType === "https://vocabulary.uncefact.org/Consignment") {
					return {
						data: [entities[0]]
					};
				}

				if (dataRequest.entitySet.entityId?.includes(id)) {
					return {
						data: entities[0]
					};
				}
				return { data: [] };
			}

			case "QueryDataAsset":
				return { data: entities };
		}
	}
}
