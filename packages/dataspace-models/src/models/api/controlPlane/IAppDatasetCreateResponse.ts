// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes, HttpStatusCode } from "@3sixty/web";

/**
 * API response from registering an app dataset.
 */
export interface IAppDatasetCreateResponse {
	/**
	 * The headers of the response, including the location of the new app dataset.
	 */
	headers: {
		[HeaderTypes.Location]: string;
	};

	/**
	 * HTTP status code (201 on success).
	 */
	statusCode: HttpStatusCode;
}
