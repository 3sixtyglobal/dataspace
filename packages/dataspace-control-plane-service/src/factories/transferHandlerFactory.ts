// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@3sixty/core";
import type { ITransferHandler } from "../models/ITransferHandler.js";

/**
 * Factory for registering and retrieving format-specific ITransferHandler instances.
 * Keys are DataspaceTransferFormat values (e.g. "HttpData-PULL").
 * Throws GeneralError when get() is called with an unregistered format.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TransferHandlerFactory = Factory.createFactory<ITransferHandler>("transfer-handler");
