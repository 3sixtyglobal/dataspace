// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IError } from "@twin.org/core";
import type { IActivityLogEntry } from "../IActivityLogEntry.js";

/**
 * Activity log entry extended with a top-level RFC 9457 error field.
 * Returned as the response body for 422/500 inline-processing failures.
 */
export interface IActivityLogEntryWithError extends IActivityLogEntry {
	/**
	 * Top-level RFC 9457-formatted error describing the processing failure.
	 * Present only for 422 and 500 responses.
	 */
	error?: IError;
}
