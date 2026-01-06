// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";

/**
 * Activity Stream Notify Request.
 */
export interface IActivityStreamNotifyRequest {
	/**
	 * The Activity sent to the Stream.
	 */
	body: IActivityStreamsActivity;
}
