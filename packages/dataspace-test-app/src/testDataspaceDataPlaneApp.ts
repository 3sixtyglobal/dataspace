// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ContextIdHelper, ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory, Guards } from "@twin.org/core";
import { DataTypeHandlerFactory } from "@twin.org/data-core";
import type { IJsonLdDocument } from "@twin.org/data-json-ld";
import {
	DataRequestType,
	type IActivityQuery,
	type IDataRequest,
	type IDataspaceApp
} from "@twin.org/dataspace-models";
import type { ILoggingComponent } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import {
	DataspaceProtocolContexts,
	type IDataspaceProtocolDataset
} from "@twin.org/standards-dataspace-protocol";
import { DublinCoreContexts } from "@twin.org/standards-dublin-core";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
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
export class TestDataspaceDataPlaneApp implements IDataspaceApp {
	/**
	 * App Name.
	 */
	public static readonly APP_ID = "https://twin.example.org/app1";

	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<TestDataspaceDataPlaneApp>();

	/**
	 * Logging component.
	 * @internal
	 */
	private readonly _logging?: ILoggingComponent;

	/**
	 * Node Identity
	 * @internal
	 */
	private _nodeId?: string;

	/**
	 * Create a new instance of TestDataspaceDataPlaneApp.
	 * @param options The constructor options.
	 */
	constructor(options?: ITestAppConstructorOptions) {
		this._logging = ComponentFactory.getIfExists<ILoggingComponent>(
			options?.loggingComponentType ?? "logging"
		);
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return TestDataspaceDataPlaneApp.CLASS_NAME;
	}

	/**
	 * Datasets handled by the App.
	 * @returns Dataspace Protocol compliant datasets
	 */
	public async datasetsHandled(): Promise<IDataspaceProtocolDataset[]> {
		const contextIds = await ContextIdStore.getContextIds();
		const organizationId =
			contextIds?.[ContextIdKeys.Organization] ?? contextIds?.[ContextIdKeys.Node] ?? "";
		return [
			{
				"@context": [
					DataspaceProtocolContexts.Context,
					{
						dcterms: DublinCoreContexts.NamespaceTerms
					}
				],
				"@id": "https://twin.example.org/data-service-1",
				"@type": "Dataset",
				"dcterms:publisher": organizationId,
				hasPolicy: [
					{
						"@type": "Offer",
						uid: "urn:uuid:test-policy-offer-1",
						assigner: organizationId,
						permission: [
							{
								action: "read"
							}
						]
					}
				],
				distribution: {
					"@id": "https://twin.example.org/distribution-1",
					"@type": "Distribution",
					accessService: "https://twin.example.org/data-service-1",
					format: "Http-Pull-Query-Format"
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

		DataTypeHandlerFactory.register("https://twin.example.org/MyCreate", () => ({
			namespace: "https://twin.example.org/",
			type: "MyCreate",
			defaultValue: {},
			jsonSchema: async () => ({
				type: "object"
			})
		}));

		DataTypeHandlerFactory.register("https://vocabulary.uncefact.org/Consignment", () => ({
			namespace: "https://vocabulary.uncefact.org/",
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
		Guards.object<IActivityStreamsActivity>(
			TestDataspaceDataPlaneApp.CLASS_NAME,
			nameof(activity),
			activity
		);

		await this._logging?.log({
			level: "info",
			source: TestDataspaceDataPlaneApp.CLASS_NAME,
			message: `App Called: ${TestDataspaceDataPlaneApp.APP_ID}`
		});

		await this._logging?.log({
			level: "info",
			source: TestDataspaceDataPlaneApp.CLASS_NAME,
			message: `Node Identity: ${this._nodeId ?? ""}`
		});

		await new Promise(resolve => setTimeout(resolve, 500));
		return "1234" as T;
	}

	/**
	 * Handles the Data Request.
	 * @param dataRequest The data request
	 * @param cursor Cursor that points to the next item in the result set.
	 * @param limit Maximum number of entries retrieved or to be retrieved.
	 * @returns the Data.
	 */
	public async handleDataRequest(
		dataRequest: IDataRequest,
		cursor?: string,
		limit?: number
	): Promise<{ data: IJsonLdDocument; cursor?: string }> {
		Guards.object<IDataRequest>(
			TestDataspaceDataPlaneApp.CLASS_NAME,
			nameof(dataRequest),
			dataRequest
		);

		switch (dataRequest.type) {
			case DataRequestType.DataAssetEntities: {
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

			case DataRequestType.QueryDataAsset:
				return { data: entities };
		}
	}
}
