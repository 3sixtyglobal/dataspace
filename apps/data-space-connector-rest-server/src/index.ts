// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { Guards } from "@twin.org/core";
import { FederatedCatalogueComponentType, type IEngineConfig } from "@twin.org/engine-types";
import { nameof } from "@twin.org/nameof";
import { type INodeEnvironmentVariables, run } from "@twin.org/node-core";

await run({
	serverName: "Data Space Connector Server",
	serverVersion: "0.0.1-next.8", // x-release-please-version
	envPrefix: "DATA_SPACE_CONNECTOR_",
	localesDirectory: path.resolve("dist/locales"),
	openApiSpecFile: path.resolve("docs/open-api/spec.json"),
	extendConfig
});

/**
 * Extends the engine config with types specific.
 * @param envVars The env variables.
 * @param engineConfig The engine configuration.
 */
export async function extendConfig(
	envVars: INodeEnvironmentVariables & { federatedCatalogueEndpoint?: string },
	engineConfig: IEngineConfig
): Promise<void> {
	Guards.string(
		"data-space-connector-rest-server",
		nameof(envVars.federatedCatalogueEndpoint),
		envVars.federatedCatalogueEndpoint
	);
	engineConfig.types.federatedCatalogueComponent = [
		{
			type: FederatedCatalogueComponentType.RestClient,
			options: {
				endpoint: envVars.federatedCatalogueEndpoint
			}
		}
	];
}
