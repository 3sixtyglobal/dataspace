// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Part of the Data Request interface to represent a set of entities either by id or by type
 */
export interface IEntitySet {
	/**
	 * Entity Id.
	 */
	entityId?: string[];

	/**
	 * The entity type.
	 */
	entityType: string;
}
