// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ITransferProcess } from "./ITransferProcess.js";

/**
 * Result of querying Transfer Processes by agreement.
 */
export interface ITransferQueryResult {
	/**
	 * The transfer processes matching the query, empty when none match.
	 */
	transfers: ITransferProcess[];

	/**
	 * Pagination cursor for retrieving the next page, omitted when no more results exist.
	 */
	cursor?: string;
}
