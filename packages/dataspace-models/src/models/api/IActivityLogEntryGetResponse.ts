// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IActivityLogEntry } from "../IActivityLogEntry.js";

/**
 * Response containing a single activity log entry.
 */
export interface IActivityLogEntryGetResponse {
	/**
	 * The response payload.
	 */
	body: IActivityLogEntry;
}
