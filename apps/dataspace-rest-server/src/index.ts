// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import type { IEngineConfig } from "@twin.org/engine-types";
import { type INodeEnvironmentVariables, run } from "@twin.org/node-core";

await run({
	serverName: "Dataspace Server",
	serverVersion: "0.0.3-next.38", // x-release-please-version
	envPrefix: "DATASPACE_",
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
	envVars: INodeEnvironmentVariables,
	engineConfig: IEngineConfig
): Promise<void> {
	// No additional configuration needed for Dataspace
}
