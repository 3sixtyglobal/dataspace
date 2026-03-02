// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IBaseRestClientConfig, IRestRoute } from "@twin.org/api-models";
import { ContextIdHelper, ContextIdKeys } from "@twin.org/context";
import { ComponentFactory, type IComponent } from "@twin.org/core";
import { DataspaceDataPlaneRestClient } from "@twin.org/dataspace-data-plane-rest-client";
import {
	type ActivityLogDetails,
	type ActivityTask,
	DataspaceDataPlaneService,
	generateRestRoutesDataspaceDataPlane,
	type IDataspaceDataPlaneServiceConstructorOptions,
	initSchema as initSchemaDataspaceDataPlane
} from "@twin.org/dataspace-data-plane-service";
import {
	DataspaceDataPlaneSocketClient,
	type IDataspaceDataPlaneSocketClientConstructorOptions
} from "@twin.org/dataspace-data-plane-socket-client";
import type { TransferProcess } from "@twin.org/dataspace-models";
import type {
	EngineTypeInitialiserReturn,
	IEngineCore,
	IEngineCoreContext,
	IEngineServer
} from "@twin.org/engine-models";
import {
	type IEngineConfig,
	initialiseEntityStorageConnector,
	EngineTypeHelper
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
	nodeEngineConfig.types.dataspaceDataPlaneComponent ??= [
		{
			type: "Service",
			options: {
				config: {}
			},
			restPath: "dataspace-data-plane"
		}
	];
}

/**
 * Initialise the engine for the extension.
 * @param engineCore The engine core instance.
 */
export async function extensionInitialiseEngine(engineCore: IEngineCore): Promise<void> {
	engineCore.addTypeInitialiser(
		"dataspaceDataPlaneComponent",
		import.meta.url,
		"initialiseDataspaceDataPlaneComponent"
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
		"dataspaceDataPlaneComponent",
		import.meta.url,
		"generateRestRoutes"
	);
}

/**
 * Shutdown the extension.
 */
export async function extensionShutdown(): Promise<void> {}

/**
 * Initialise the dataspace data plane component.
 * @param engineCore The engine core.
 * @param context The context for the engine.
 * @param instanceConfig The instance config.
 * @returns The instance created and the factory for it.
 */
export function initialiseDataspaceDataPlaneComponent(
	engineCore: IEngineCore<IEngineConfig>,
	context: IEngineCoreContext<IEngineConfig>,
	instanceConfig:
		| {
				type: "service";
				options?: IDataspaceDataPlaneServiceConstructorOptions;
		  }
		| {
				type: "rest-client";
				options: IBaseRestClientConfig;
		  }
		| {
				type: "socket-client";
				options: IDataspaceDataPlaneSocketClientConstructorOptions;
		  }
): EngineTypeInitialiserReturn<typeof instanceConfig, typeof ComponentFactory> {
	let instanceTypeName: string | undefined;
	let createComponent;

	if (instanceConfig.type === "service") {
		createComponent = (createConfig: typeof instanceConfig) => {
			initSchemaDataspaceDataPlane();

			const partitionContextIds = ContextIdHelper.pickKeysFromAvailable(
				engineCore.getContextIdKeys(),
				[ContextIdKeys.Node, ContextIdKeys.Tenant]
			);

			const serviceOptions = instanceConfig.options;
			initialiseEntityStorageConnector(
				engineCore,
				context,
				serviceOptions?.activityLogEntityStorageType,
				nameof<ActivityLogDetails>(),
				partitionContextIds
			);
			initialiseEntityStorageConnector(
				engineCore,
				context,
				serviceOptions?.activityTaskEntityStorageType,
				nameof<ActivityTask>(),
				partitionContextIds
			);
			initialiseEntityStorageConnector(
				engineCore,
				context,
				serviceOptions?.transferProcessEntityStorageType,
				nameof<TransferProcess>(),
				partitionContextIds
			);

			return new DataspaceDataPlaneService(
				EngineTypeHelper.mergeConfig<IDataspaceDataPlaneServiceConstructorOptions>(
					{
						loggingComponentType: engineCore.getRegisteredInstanceType("loggingComponent"),
						backgroundTaskComponentType:
							engineCore.getRegisteredInstanceType("backgroundTaskComponent"),
						taskSchedulerComponentType:
							engineCore.getRegisteredInstanceType("taskSchedulerComponent"),
						trustComponentType: engineCore.getRegisteredInstanceType("trustComponent"),
						pepComponentType: engineCore.getRegisteredInstanceTypeOptional(
							"rightsManagementPepComponent"
						)
					},
					createConfig.options
				)
			);
		};

		instanceTypeName = nameofKebabCase(DataspaceDataPlaneService);
	} else if (instanceConfig.type === "rest-client") {
		createComponent = (createConfig: typeof instanceConfig) =>
			new DataspaceDataPlaneRestClient(createConfig.options);
		instanceTypeName = nameofKebabCase(DataspaceDataPlaneRestClient);
	} else if (instanceConfig.type === "socket-client") {
		createComponent = (createConfig: typeof instanceConfig) =>
			new DataspaceDataPlaneSocketClient(
				EngineTypeHelper.mergeConfig<IDataspaceDataPlaneSocketClientConstructorOptions>(
					{
						loggingComponentType: engineCore.getRegisteredInstanceType("loggingComponent")
					},
					createConfig.options
				)
			);
		instanceTypeName = nameofKebabCase(DataspaceDataPlaneSocketClient);
	}

	return {
		createComponent: createComponent as (createConfig: typeof instanceConfig) => IComponent,
		instanceTypeName,
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
	return generateRestRoutesDataspaceDataPlane(baseRouteName, componentName);
}
