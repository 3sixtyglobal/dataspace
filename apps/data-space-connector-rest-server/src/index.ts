// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Coerce, Is } from "@twin.org/core";
import type { IDataSpaceConnectorAppDescriptor } from "@twin.org/data-space-connector-models";
import type { IEngineCore, IEngineCoreTypeConfig, IEngineServer } from "@twin.org/engine-models";
import { run, type INodeEnvironmentVariables } from "@twin.org/node-core";
import * as dotenv from "dotenv";

const filename = fileURLToPath(import.meta.url);
const dirnameStr = path.dirname(filename);
const customTypeConfig: IEngineCoreTypeConfig[] = [];

dotenv.config({
	path: [path.resolve(".env"), path.resolve(".env.local")],
	quiet: true
});

await run({
	serverName: "Data Space Connector Server",
	serverVersion: "0.0.1-next.6", // x-release-please-version
	envPrefix: "DATA_SPACE_CONNECTOR_",
	localesDirectory: path.resolve("dist/locales"),
	openApiSpecFile: path.resolve("docs/open-api/spec.json"),
	extendEnvVars,
	extendEngine,
	extendEngineServer
});

/**
 * Extend the engine environment variables with any additional custom configuration.
 * @param envVars The environment variables.
 */
async function extendEnvVars(
	envVars: INodeEnvironmentVariables & {
		activityLogRetainFor?: string;
		activityLogCleanupInterval?: string;
	}
): Promise<void> {
	customTypeConfig.push({
		type: "service",
		restPath: "data-space-connector",
		socketPath: "data-space-connector",
		options: {
			config: {
				dataSpaceConnectorAppDescriptors: await loadAppDescriptors(),
				retainActivityLogsFor: Coerce.number(envVars.activityLogRetainFor),
				activityLogsCleanUpInterval: Coerce.number(envVars.activityLogCleanupInterval)
			}
		}
	});
}

/**
 * Extends the engine.
 * @param engineCore Engine Core
 */
export async function extendEngine(engineCore: IEngineCore): Promise<void> {
	engineCore.addTypeInitialiser(
		"dataSpaceConnectorComponent",
		customTypeConfig,
		`file://${path.join(dirnameStr, "dataSpaceConnector.js")}`,
		"initialiseDataSpaceConnectorComponent"
	);
}

/**
 * Extends the engine server.
 * @param server The engine server.
 */
export async function extendEngineServer(server: IEngineServer): Promise<void> {
	server.addRestRouteGenerator(
		"dataSpaceConnectorComponent",
		customTypeConfig,
		`file://${path.join(dirnameStr, "dataSpaceConnector.js")}`,
		"generateRestRoutes"
	);

	server.addSocketRouteGenerator(
		"dataSpaceConnectorComponent",
		customTypeConfig,
		`file://${path.join(dirnameStr, "dataSpaceConnector.js")}`,
		"generateSocketRoutes"
	);
}

/**
 * Load the data space connector app descriptors.
 * @returns The data space connector app descriptors.
 */
async function loadAppDescriptors(): Promise<IDataSpaceConnectorAppDescriptor[]> {
	const dsConnectorAppsFileName = "data-space-connector-apps.json";
	let dataSpaceConnectorAppDescriptors: IDataSpaceConnectorAppDescriptor[] = [];
	const dsConnectorAppsFile = path.resolve(dsConnectorAppsFileName);

	if (fs.existsSync(dsConnectorAppsFile)) {
		const jsonStr = fs.readFileSync(dsConnectorAppsFile, "utf8");
		try {
			dataSpaceConnectorAppDescriptors = JSON.parse(jsonStr) as IDataSpaceConnectorAppDescriptor[];
			if (!Is.arrayValue(dataSpaceConnectorAppDescriptors)) {
				// eslint-disable-next-line no-console
				console.warn("Data Space Connector Apps descriptors file does not represent an array");
			} else {
				// eslint-disable-next-line no-console
				console.log(`Data Space Connector Apps descriptors file  ${dsConnectorAppsFileName} read`);
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error(
				`Data Space Connector Apps descriptors file ${dsConnectorAppsFileName} invalid`,
				error
			);
		}
	}

	return dataSpaceConnectorAppDescriptors;
}
