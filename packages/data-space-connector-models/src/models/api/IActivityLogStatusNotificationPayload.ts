// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IActivityLogStatusNotification } from "../IActivityLogStatusNotification.js";

/**
 * The status supplied to clients of the Data Space Connector
 */
export interface IActivityLogStatusNotificationPayload {
	/**
	 * Body
	 */
	body: IActivityLogStatusNotification;
}
