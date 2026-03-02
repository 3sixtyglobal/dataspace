// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * (Activity,Object,Target) query for denoting combinations to be handled by a Dataspace App.
 */
export interface IActivityQuery {
	/**
	 * FQN of the Activity type.
	 */
	activityType?: string;

	/**
	 * FQN of the Object Type.
	 */
	objectType: string;

	/**
	 * FQN of the target type.
	 */
	targetType?: string;
}
