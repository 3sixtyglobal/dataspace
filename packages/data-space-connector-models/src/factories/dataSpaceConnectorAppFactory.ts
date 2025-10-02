// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@twin.org/core";
import type { IDataSpaceConnectorApp } from "../models/app/IDataSpaceConnectorApp";

/**
 * Factory for creating data space connector apps.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataSpaceConnectorAppFactory = Factory.createFactory<IDataSpaceConnectorApp>(
	"data-space-connector-app"
);
