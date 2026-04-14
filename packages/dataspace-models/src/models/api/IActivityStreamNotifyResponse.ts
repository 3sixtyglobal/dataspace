// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes, HttpStatusCode } from "@twin.org/web";
import type { IActivityLogEntry } from "../IActivityLogEntry.js";

/**
 * Activity Stream Notify Response.
 */
export interface IActivityStreamNotifyResponse {
	/**
	 * The status code indicating the result of the notification processing. It can be either:
	 * - `201 Created` if the notification was processed inline and a new activity log entry was created.
	 * - `102 Processing` if the notification was accepted for processing but has not been completed yet.
	 */
	statusCode: typeof HttpStatusCode.created | typeof HttpStatusCode.processing;

	/**
	 * Optional headers.
	 */
	headers?: {
		[HeaderTypes.Location]?: string;
	};

	/**
	 * The Activity log entry if the notification was processed inline.
	 */
	body?: IActivityLogEntry;
}
