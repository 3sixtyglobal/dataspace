// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IBaseRestClientConfig, IRestRoute } from "@twin.org/api-models";
import { ComponentFactory, type IComponent } from "@twin.org/core";
import type { IDataSpaceConnector } from "@twin.org/data-space-connector-models";
import { DataSpaceConnectorRestClient } from "@twin.org/data-space-connector-rest-client";
import {
	type ActivityLogDetails,
	type ActivityTask,
	type IDataSpaceConnectorServiceConstructorOptions,
	DataSpaceConnectorService,
	generateRestRoutesDataSpaceConnector,
	initSchema as initSchemaDataSpaceConnector
} from "@twin.org/data-space-connector-service";
import {
	DataSpaceConnectorSocketClient,
	type IDataSpaceConnectorSocketClientConstructorOptions
} from "@twin.org/data-space-connector-socket-client";
import type { IEngineCore, IEngineCoreContext, IEngineServer } from "@twin.org/engine-models";
import {
	DataSpaceConnectorComponentType,
	type IEngineConfig,
	initialiseEntityStorageConnector
} from "@twin.org/engine-types";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import type { INodeEngineConfig, INodeEnvironmentVariables } from "@twin.org/node-core";

/**
 * Initialise the extension.
 * @param envVars The environment variables for the node.
 * @param nodeEngineConfig The node engine config.
 */
export async function extensionInitialise(
	envVars: INodeEnvironmentVariables,
	nodeEngineConfig: INodeEngineConfig
): Promise<void> {
	nodeEngineConfig.types.dataSpaceConnectorComponent ??= [
		{
			type: DataSpaceConnectorComponentType.Service,
			options: {
				config: {}
			},
			restPath: "data-space-connector"
		}
	];
}

/**
 * Initialise the engine for the extension.
 * @param engineCore The engine core instance.
 */
export async function extensionInitialiseEngine(engineCore: IEngineCore): Promise<void> {
	engineCore.addTypeInitialiser(
		"dataSpaceConnectorComponent",
		import.meta.url,
		"initialiseDataSpaceConnectorComponent"
	);
}

/**
 * Initialise the engine server for the extension.
 * @param engineCore The engine core instance.
 * @param engineServer The engine server instance.
 */
export async function extensionInitialiseEngineServer(
	engineCore: IEngineCore,
	engineServer: IEngineServer
): Promise<void> {
	engineServer.addRestRouteGenerator(
		"dataSpaceConnectorComponent",
		import.meta.url,
		"generateRestRoutes"
	);
}

/**
 * Shutdown the extension.
 */
export async function extensionShutdown(): Promise<void> {}

/**
 * Initialise the data space connector component.
 * @param engineCore The engine core.
 * @param context The context for the engine.
 * @param instanceConfig The instance config.
 * @returns The instance created and the factory for it.
 */
export async function initialiseDataSpaceConnectorComponent(
	engineCore: IEngineCore<IEngineConfig>,
	context: IEngineCoreContext<IEngineConfig>,
	instanceConfig:
		| {
				type: typeof DataSpaceConnectorComponentType.Service;
				options?: IDataSpaceConnectorServiceConstructorOptions;
		  }
		| {
				type: typeof DataSpaceConnectorComponentType.RestClient;
				options: IBaseRestClientConfig;
		  }
		| {
				type: typeof DataSpaceConnectorComponentType.SocketClient;
				options: IDataSpaceConnectorSocketClientConstructorOptions;
		  }
): Promise<{
	instanceType?: string;
	factory?: typeof ComponentFactory;
	component?: IComponent;
}> {
	let component: IDataSpaceConnector | undefined;
	let instanceType: string | undefined;

	if (instanceConfig.type === DataSpaceConnectorComponentType.Service) {
		initSchemaDataSpaceConnector();

		initialiseEntityStorageConnector(
			engineCore,
			context,
			instanceConfig.options?.activityLogEntityStorageType,
			nameof<ActivityLogDetails>()
		);
		initialiseEntityStorageConnector(
			engineCore,
			context,
			instanceConfig.options?.activityTaskEntityStorageType,
			nameof<ActivityTask>()
		);
		component = new DataSpaceConnectorService({
			loggingComponentType: engineCore.getRegisteredInstanceType("loggingComponent"),
			backgroundTaskConnectorType: engineCore.getRegisteredInstanceType("backgroundTaskConnector"),
			taskSchedulerComponentType: engineCore.getRegisteredInstanceType("taskSchedulerComponent"),
			federatedCatalogueComponentType: engineCore.getRegisteredInstanceType(
				"federatedCatalogueComponent"
			),
			...instanceConfig.options
		});
		instanceType = nameofKebabCase(DataSpaceConnectorService);
	} else if (instanceConfig.type === DataSpaceConnectorComponentType.RestClient) {
		component = new DataSpaceConnectorRestClient(instanceConfig.options);
		instanceType = nameofKebabCase(DataSpaceConnectorRestClient);
	} else if (instanceConfig.type === DataSpaceConnectorComponentType.SocketClient) {
		component = new DataSpaceConnectorSocketClient({
			loggingComponentType: engineCore.getRegisteredInstanceType("loggingComponent"),
			...instanceConfig.options
		});
		instanceType = nameofKebabCase(DataSpaceConnectorSocketClient);
	}

	return {
		component,
		instanceType,
		factory: ComponentFactory
	};
}

/**
 * Generate the rest routes for the component.
 * @param baseRouteName The base route name.
 * @param componentName The component name.
 * @returns The rest routes.
 */
export function generateRestRoutes(baseRouteName: string, componentName: string): IRestRoute[] {
	return generateRestRoutesDataSpaceConnector(baseRouteName, componentName);
}
