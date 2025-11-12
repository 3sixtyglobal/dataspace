// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRoute } from "@twin.org/api-models";
import type { IComponent } from "@twin.org/core";
import {
	DataSpaceConnectorAppFactory,
	type IDataSpaceConnectorApp
} from "@twin.org/data-space-connector-models";
import type {
	IEngineCore,
	IEngineCoreConfig,
	IEngineCoreContext,
	IEngineServer
} from "@twin.org/engine-models";
import type { ITestAppConstructorOptions } from "./ITestAppConstructorOptions.js";
import { TestDataSpaceConnectorApp } from "./testDataSpaceConnectorApp.js";

/**
 * Initialise the  extension.
 * @param envVars The environment variables for the node.
 * @param nodeEngineConfig The node engine config.
 */
export async function extensionInitialise(
	envVars: { [id: string]: string },
	nodeEngineConfig: IEngineCoreConfig
): Promise<void> {
	nodeEngineConfig.types.testAppComponent = [
		{
			type: "service",
			options: {}
		}
	];
}

/**
 * Initialise the engine for the extension.
 * @param engineCore The engine core instance.
 */
export async function extensionInitialiseEngine(engineCore: IEngineCore): Promise<void> {
	engineCore.addTypeInitialiser(
		"testAppComponent",
		"@twin.org/data-space-connector-test-app",
		"testAppInitialiser"
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
		"testAppComponent",
		"@twin.org/data-space-connector-test-app",
		"generateRestRoutes"
	);
}

/**
 * Test Data Space Connector App initializer.
 * @param engineCore The engine core.
 * @param context The context for the engine.
 * @param instanceConfig The instance config.
 * @param instanceConfig.options The instance config options.
 * @param instanceConfig.type The instance type.
 * @returns The instance created and the factory for it.
 */
export async function testAppInitialiser(
	engineCore: IEngineCore,
	context: IEngineCoreContext,
	instanceConfig: { type: "service"; options: ITestAppConstructorOptions }
): Promise<{
	instanceType?: string;
	factory?: typeof DataSpaceConnectorAppFactory;
	component?: IComponent;
}> {
	let component: IDataSpaceConnectorApp | undefined;
	let instanceType: string | undefined;

	if (instanceConfig.type === "service") {
		component = new TestDataSpaceConnectorApp({
			dataSpaceConnectorComponentType: engineCore.getRegisteredInstanceType(
				"dataSpaceConnectorComponent"
			),
			loggingComponentType: engineCore.getRegisteredInstanceType("loggingComponent"),
			...instanceConfig.options
		});
		instanceType = TestDataSpaceConnectorApp.APP_ID;
	}

	return {
		instanceType,
		factory: DataSpaceConnectorAppFactory,
		component
	};
}

/**
 * Generate the rest routes for the component.
 * @param baseRouteName The base route name.
 * @param componentName The component name.
 * @returns The rest routes.
 */
export function generateRestRoutes(baseRouteName: string, componentName: string): IRestRoute[] {
	return [];
}
