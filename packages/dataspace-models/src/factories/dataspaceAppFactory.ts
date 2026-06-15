// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@twin.org/core";
import type { IDataspaceApp } from "../models/app/IDataspaceApp.js";

/**
 * Factory for registering and retrieving dataspace app instances by name.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataspaceAppFactory = Factory.createFactory<IDataspaceApp>("dataspace-app");
