// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IActivityStreamsActivity } from "@3sixty/standards-w3c-activity-streams";
import type { HeaderTypes } from "@3sixty/web";

/**
 * Activity Stream Notify Request.
 */
export interface IActivityStreamNotifyRequest {
	/**
	 * The headers which can be used for authentication (e.g. Bearer token for cross-node push).
	 */
	headers?: {
		[HeaderTypes.Authorization]?: string;
	};

	/**
	 * The Activity sent to the Stream.
	 */
	body: IActivityStreamsActivity;
}
