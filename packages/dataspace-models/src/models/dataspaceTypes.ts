// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types concerning dataspace
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataspaceTypes = {
	Activity: "Activity"
} as const;

/**
 * The types concerning dataspace.
 */
export type DataspaceTypes = (typeof DataspaceTypes)[keyof typeof DataspaceTypes];
