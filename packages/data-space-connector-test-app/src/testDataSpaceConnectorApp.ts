// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ComponentFactory } from "@twin.org/core";
import { DataTypeHandlerFactory } from "@twin.org/data-core";
import type {
	IActivityQuery,
	IDataSpaceConnector,
	IDataSpaceConnectorApp
} from "@twin.org/data-space-connector-models";
import type { ILoggingComponent } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import type { IActivity } from "@twin.org/standards-w3c-activity-streams";
import type { ITestAppConstructorOptions } from "./ITestAppConstructorOptions";

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
}
