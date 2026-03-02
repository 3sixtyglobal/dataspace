// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDataspaceDataPlaneSocketClientConfig } from "./IDataspaceDataPlaneSocketClientConfig.js";

/**
 * The options for the dataspace data plane socket client.
 */
export interface IDataspaceDataPlaneSocketClientConstructorOptions {
	/**
	 * The type of logging component to use.
	 */
	loggingComponentType?: string;

	/**
	 * The configuration for the dataspace data plane socket client.
	 */
	config: IDataspaceDataPlaneSocketClientConfig;
}
