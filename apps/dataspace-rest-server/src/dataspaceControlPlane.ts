// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRoute } from "@twin.org/api-models";
import { ContextIdHelper, ContextIdKeys } from "@twin.org/context";
import { ComponentFactory, type IComponent } from "@twin.org/core";
import {
	DataspaceControlPlaneService,
	generateRestRoutesDataspaceControlPlane,
	type IDataspaceControlPlaneServiceConstructorOptions,
	initSchema as initSchemaDataspaceControlPlane
} from "@twin.org/dataspace-control-plane-service";

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
	nodeEngineConfig.types.dataspaceControlPlaneComponent ??= [
		{
			type: "Service",
			options: {
				config: {}
			},
			restPath: "dataspace-control-plane"
		}
	];
}

/**
 * Initialise the engine for the extension.
 * @param engineCore The engine core instance.
 */
export async function extensionInitialiseEngine(engineCore: IEngineCore): Promise<void> {
	engineCore.addTypeInitialiser(
		"dataspaceControlPlaneComponent",
		import.meta.url,
		"initialiseDataspaceControlPlaneComponent"
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
		"dataspaceControlPlaneComponent",
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
 * @param instanceConfig.type Type of instance.
 * @param instanceConfig.options Options.
 * @returns The instance created and the factory for it.
 */
export function initialiseDataspaceControlPlaneComponent(
	engineCore: IEngineCore<IEngineConfig>,
	context: IEngineCoreContext<IEngineConfig>,
	instanceConfig: {
		type: "service";
		options?: IDataspaceControlPlaneServiceConstructorOptions;
	}
): EngineTypeInitialiserReturn<typeof instanceConfig, typeof ComponentFactory> {
	let instanceTypeName: string | undefined;
	let createComponent;

	if (instanceConfig.type === "service") {
		createComponent = (createConfig: typeof instanceConfig) => {
			initSchemaDataspaceControlPlane();

			const serviceOptions = instanceConfig.options;

			const partitionContextIds = ContextIdHelper.pickKeysFromAvailable(
				engineCore.getContextIdKeys(),
				[ContextIdKeys.Node, ContextIdKeys.Tenant]
			);

			initialiseEntityStorageConnector(
				engineCore,
				context,
				serviceOptions?.transferProcessEntityStorageType,
				nameof<TransferProcess>(),
				partitionContextIds
			);

			return new DataspaceControlPlaneService(
				EngineTypeHelper.mergeConfig<IDataspaceControlPlaneServiceConstructorOptions>(
					{
						loggingComponentType: engineCore.getRegisteredInstanceType("loggingComponent"),
						trustComponentType: engineCore.getRegisteredInstanceType("trustComponent"),
						federatedCatalogueComponentType: engineCore.getRegisteredInstanceType(
							"federatedCatalogueComponent"
						),
						policyAdministrationPointComponentType: engineCore.getRegisteredInstanceType(
							"rightsManagementPapComponent"
						)
					},
					createConfig.options
				)
			);
		};
		instanceTypeName = nameofKebabCase(DataspaceControlPlaneService);
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
	return generateRestRoutesDataspaceControlPlane(baseRouteName, componentName);
}
