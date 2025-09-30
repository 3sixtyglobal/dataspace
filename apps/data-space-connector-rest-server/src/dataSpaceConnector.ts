// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IBaseRestClientConfig, IRestRoute, ISocketRoute } from "@twin.org/api-models";
import { ComponentFactory, GeneralError, I18n } from "@twin.org/core";
import type { IDataSpaceConnector } from "@twin.org/data-space-connector-models";
import { DataSpaceConnectorClient } from "@twin.org/data-space-connector-rest-client";
import {
	type ActivityLogDetails,
	type ActivityTask,
	DataSpaceConnectorService,
	generateRestRoutesDataSpaceConnector,
	generateSocketRoutesDataSpaceConnector,
	type IDataSpaceConnectorServiceConstructorOptions,
	initSchema as initSchemaDataSpaceConnector
} from "@twin.org/data-space-connector-service";
import {
	DataSpaceConnectorSocketClient,
	type IDataSpaceConnectorSocketClientConstructorOptions
} from "@twin.org/data-space-connector-socket-client";
import type { IEngineCore, IEngineCoreContext } from "@twin.org/engine-models";
import { type IEngineConfig, initialiseEntityStorageConnector } from "@twin.org/engine-types";
import { nameof, nameofKebabCase } from "@twin.org/nameof";

/**
 * Initialise the data space connector component.
 * @param engineCore The engine core.
 * @param context The context for the engine.
 * @param instanceConfig The instance config.
 * @param overrideInstanceType The instance type to override the default.
 * @returns The name of the instance created.
 * @throws GeneralError if the component type is unknown.
 */
export async function initialiseDataSpaceConnectorComponent(
	engineCore: IEngineCore<IEngineConfig>,
	context: IEngineCoreContext<IEngineConfig>,
	instanceConfig:
		| { type: "service"; options?: IDataSpaceConnectorServiceConstructorOptions }
		| { type: "rest-client"; options: IBaseRestClientConfig }
		| { type: "socket-client"; options: IDataSpaceConnectorSocketClientConstructorOptions },
	overrideInstanceType?: string
): Promise<string | undefined> {
	engineCore.logInfo(
		I18n.formatMessage("engineCore.configuring", {
			element: `Data Space Connector Component: ${instanceConfig.type}`
		})
	);

	const type = instanceConfig.type;
	let component: IDataSpaceConnector;
	let instanceType: string;

	if (type === "service") {
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
			...instanceConfig.options
		});
		instanceType = nameofKebabCase(DataSpaceConnectorService);
	} else if (type === "rest-client") {
		component = new DataSpaceConnectorClient(instanceConfig.options);
		instanceType = nameofKebabCase(DataSpaceConnectorClient);
	} else if (type === "socket-client") {
		component = new DataSpaceConnectorSocketClient({
			loggingComponentType: engineCore.getRegisteredInstanceType("loggingComponent"),
			...instanceConfig.options
		});
		instanceType = nameofKebabCase(DataSpaceConnectorSocketClient);
	} else {
		throw new GeneralError("engineCore", "componentUnknownType", {
			type,
			componentType: "DataSpaceConnectorComponent"
		});
	}

	const finalInstanceType = overrideInstanceType ?? instanceType;
	context.componentInstances.push({ instanceType: finalInstanceType, component });
	ComponentFactory.register(finalInstanceType, () => component);
	return finalInstanceType;
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

/**
 * Generate the socket routes for the component.
 * @param baseRouteName The base route name.
 * @param componentName The component name.
 * @returns The rest routes.
 */
export function generateSocketRoutes(baseRouteName: string, componentName: string): ISocketRoute[] {
	return generateSocketRoutesDataSpaceConnector(baseRouteName, componentName);
}
