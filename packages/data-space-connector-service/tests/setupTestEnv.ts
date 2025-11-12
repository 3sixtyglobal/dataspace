// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import fs from "node:fs";
import path from "node:path";
import { EnvHelper, RandomHelper } from "@twin.org/core";
import * as dotenv from "dotenv";

console.debug("Setting up test environment from .env and .env.dev files");

dotenv.config({
	path: [path.join(__dirname, ".env-test"), path.join(__dirname, ".env.dev")],
	quiet: true
});

/**
 * Setup the test environment.
 * @returns the Clearing House Approver list.
 */
export async function setupTestEnv(): Promise<void> {
	await cleanupTestEnv();

	EnvHelper.envToJson(process.env, "DATA_SPACE_CONNECTOR");

	RandomHelper.generate = vi
		.fn()
		.mockImplementationOnce(length => new Uint8Array(length).fill(99))
		.mockImplementation(length => new Uint8Array(length).fill(88));
}

/**
 * Cleanup the test environment.
 */
export async function cleanupTestEnv(): Promise<void> {
	try {
		fs.rmSync(path.join(__dirname, ".tmp"), { recursive: true });
	} catch {}
}
