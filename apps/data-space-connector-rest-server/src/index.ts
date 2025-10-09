// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { run } from "@twin.org/node-core";

await run({
	serverName: "Data Space Connector Server",
	serverVersion: "0.0.1-next.8", // x-release-please-version
	envPrefix: "DATA_SPACE_CONNECTOR_",
	localesDirectory: path.resolve("dist/locales"),
	openApiSpecFile: path.resolve("docs/open-api/spec.json")
});
