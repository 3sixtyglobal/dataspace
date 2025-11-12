// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@twin.org/core";
import type { IDataSpaceConnectorApp } from "../models/app/IDataSpaceConnectorApp.js";

/**
 * Factory for creating data space connector apps.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataSpaceConnectorAppFactory = Factory.createFactory<IDataSpaceConnectorApp>(
	"data-space-connector-app"
);
