// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types concerning dataspace
 */
export const DataspaceTypes = {
	/**
	 * Activity type.
	 */
	Activity: "Activity"
} as const;

/**
 * The types concerning dataspace.
 */
export type DataspaceTypes = (typeof DataspaceTypes)[keyof typeof DataspaceTypes];
