// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IActivityLogStatusNotification } from "../IActivityLogStatusNotification.js";

/**
 * WebSocket push payload carrying an activity log status notification to connected clients.
 */
export interface IActivityLogStatusNotificationPayload {
	/**
	 * The activity log status notification.
	 */
	body: IActivityLogStatusNotification;
}
