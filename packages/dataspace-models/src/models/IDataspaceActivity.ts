// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { ObjectOrArray } from "@3sixty/core";
import type { JsonLdObjectWithContext } from "@3sixty/data-json-ld";
import type { IActivityStreamsActivity } from "@3sixty/standards-w3c-activity-streams";

/**
 * A dataspace activity that restricts an activity so that it can be handled by a Dataspace Data Plane
 */
export interface IDataspaceActivity<
	O extends object = object,
	T extends object = object
> extends Omit<IActivityStreamsActivity, "object"> {
	/**
	 * Activity's Object
	 */
	object: ObjectOrArray<JsonLdObjectWithContext<O & { type: ObjectOrArray<string> }>>;

	/**
	 * Activity's target
	 */
	target?: JsonLdObjectWithContext<T & { type: ObjectOrArray<string> }>;
}
