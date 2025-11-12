// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IActivityLogEntry } from "../IActivityLogEntry.js";

/**
 * Service Offering response
 */
export interface IActivityLogEntryGetResponse {
	/**
	 * The response payload.
	 */
	body: IActivityLogEntry;
}
