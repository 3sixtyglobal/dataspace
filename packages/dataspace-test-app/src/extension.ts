// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRoute } from "@3sixty/api-models";
import { Is } from "@3sixty/core";
import { DataspaceAppFactory } from "@3sixty/dataspace-models";
import type { ITestAppConstructorOptions } from "./ITestAppConstructorOptions.js";
import { TestDataspaceDataPlaneApp } from "./testDataspaceDataPlaneApp.js";

/**
 * Initialise the extension.
 * @param envVars The environment variables for the node.
 * @param nodeEngineConfig The node engine config.
 * @param nodeEngineConfig.types The component type configurations keyed by type name.
 * @returns A promise that resolves when the test app component type has been registered in the engine config.
 */
export async function extensionInitialise(
	envVars: { [id: string]: string | unknown },
	nodeEngineConfig: { types: { [key: string]: unknown[] } }
): Promise<void> {
	nodeEngineConfig.types.testAppComponent = [
		{
			type: "service",
			options: {
				consignments: Is.arrayValue(envVars.testAppConsignments)
					? envVars.testAppConsignments
					: undefined
			}
		}
	];
}

/**
 * Initialise the engine for the extension.
 * @param engineCore The engine core instance.
 * @param engineCore.addTypeInitialiser Registers a named type initialiser module and export with the engine.
 * @returns A promise that resolves when the type initialiser has been registered with the engine.
 */
export async function extensionInitialiseEngine(engineCore: {
	addTypeInitialiser: (type: string, module: string, name: string) => void;
}): Promise<void> {
	engineCore.addTypeInitialiser(
		"testAppComponent",
		"@3sixty/dataspace-test-app",
		"testAppInitialiser"
	);
}

/**
 * Initialise the engine server for the extension.
 * @param engineCore The engine core instance (unused by this extension).
 * @param engineServer The engine server instance.
 * @param engineServer.addRestRouteGenerator Registers a named REST route generator module and export with the engine server.
 * @returns A promise that resolves when the REST route generator has been registered with the engine server.
 */
export async function extensionInitialiseEngineServer(
	engineCore: unknown,
	engineServer: {
		addRestRouteGenerator: (type: string, module: string, name: string) => void;
	}
): Promise<void> {
	engineServer.addRestRouteGenerator(
		"testAppComponent",
		"@3sixty/dataspace-test-app",
		"generateRestRoutes"
	);
}

/**
 * Test Dataspace Data Plane App initializer.
 * @param engineCore The engine core.
 * @param engineCore.getRegisteredInstanceType Returns the registered instance type name for a given component type.
 * @param context The engine core context (unused by this extension).
 * @param instanceConfig The instance config.
 * @param instanceConfig.options The instance config options.
 * @param instanceConfig.type The instance type.
 * @returns The instance created and the factory for it.
 */
export function testAppInitialiser(
	engineCore: { getRegisteredInstanceType: (type: string) => string },
	context: unknown,
	instanceConfig: { type: "service"; options: ITestAppConstructorOptions }
): {
	instanceTypeName?: string;
	factory: typeof DataspaceAppFactory;
	createComponent?: (createConfig: typeof instanceConfig) => TestDataspaceDataPlaneApp;
} {
	let instanceTypeName: string | undefined;
	let createComponent;

	if (instanceConfig.type === "service") {
		createComponent = (createConfig: typeof instanceConfig) =>
			new TestDataspaceDataPlaneApp({
				loggingComponentType: engineCore.getRegisteredInstanceType("loggingComponent"),
				...createConfig.options
			});
		instanceTypeName = TestDataspaceDataPlaneApp.APP_ID;
	}

	return {
		instanceTypeName,
		factory: DataspaceAppFactory,
		createComponent
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
