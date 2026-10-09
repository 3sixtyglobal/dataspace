// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes, HttpStatusCode } from "@3sixty/web";
import type { IActivityLogEntry } from "../IActivityLogEntry.js";

/**
 * Activity Stream Notify Response.
 */
export interface IActivityStreamNotifyResponse {
	/**
	 * The status code indicating the result of the notification processing. It can be either:
	 * - `201 Created` if the notification was processed inline and a new activity log entry was created.
	 * - `202 Accepted` if the notification was accepted for async processing but has not been completed yet.
	 * - `422 Unprocessable Entity` if inline processing failed due to a semantic problem in the Activity.
	 * - `500 Internal Server Error` if inline processing failed due to a server-side processing error.
	 */
	statusCode:
		| typeof HttpStatusCode.created
		| typeof HttpStatusCode.accepted
		| typeof HttpStatusCode.unprocessableEntity
		| typeof HttpStatusCode.internalServerError;

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
