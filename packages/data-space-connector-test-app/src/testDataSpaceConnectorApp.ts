// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ComponentFactory } from "@twin.org/core";
import { DataTypeHandlerFactory } from "@twin.org/data-core";
import type { IJsonLdDocument } from "@twin.org/data-json-ld";
import type {
	IActivityQuery,
	IDataRequest,
	IDataAssetQuery,
	IDataSpaceConnector,
	IDataSpaceConnectorApp
} from "@twin.org/data-space-connector-models";
import type { ILoggingComponent } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import type { IActivity } from "@twin.org/standards-w3c-activity-streams";
import type { ITestAppConstructorOptions } from "./ITestAppConstructorOptions";

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
	private _nodeIdentity?: string;

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
	 * Data Services handled.
	 * @returns Ids.
	 */
	public dataServicesHandled(): IDataAssetQuery[] {
		return [{ serviceId: "https://twin.example.org/data-service-1" }];
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
	 * @param nodeIdentity the identity of the node where this application lives.
	 * @param nodeLoggingComponentType the logging component type of such a node.
	 */
	public async start(nodeIdentity?: string, nodeLoggingComponentType?: string): Promise<void> {
		this._nodeIdentity = nodeIdentity;

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
	public async handleActivity<T>(activity: IActivity): Promise<T> {
		await this._loggingService?.log({
			level: "info",
			source: TestDataSpaceConnectorApp.CLASS_NAME,
			message: `App Called: ${TestDataSpaceConnectorApp.APP_ID}`
		});

		await this._loggingService?.log({
			level: "info",
			source: TestDataSpaceConnectorApp.CLASS_NAME,
			message: `Node Identity: ${this._nodeIdentity ?? ""}`
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
