// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The contexts related to Dataspace
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DataspaceContexts = {
	JsonSchemaNamespace: "https://schema.twindev.org/dataspace/"
} as const;

/**
 * The types concerning dataspace.
 */
export type DataspaceContexts = (typeof DataspaceContexts)[keyof typeof DataspaceContexts];
