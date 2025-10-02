// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type { IActivity } from "@twin.org/standards-w3c-activity-streams";
import type { IActivityQuery } from "../IActivityQuery";

/**
 * Interface describes a Data Space Connector App.
 */
export interface IDataSpaceConnectorApp extends IComponent {
	/**
	 * The activities handled by the App.
	 * @returns The activities handled by the App.
	 */
	activitiesHandled(): IActivityQuery[];

	/**
	 * Handles an Activity and report about results through the Data Space Connector Callback
	 * @param activity The Activity to be handled
	 * @returns The result of executing the Activity.
	 */
	handleActivity<T>(activity: IActivity): Promise<T>;
}
