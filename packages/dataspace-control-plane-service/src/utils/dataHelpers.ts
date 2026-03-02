// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { ObjectHelper } from "@twin.org/core";

/**
 * Get a JSON-LD id.
 * @param object The object to get the id from.
 * @returns The JSON-LD id.
 * @internal
 */
export function getJsonLdId(object: unknown): string | undefined {
	return ObjectHelper.extractProperty(object, ["@id", "id"], false);
}

/**
 * Get a JSON-LD type.
 * @param object The object to get the type from.
 * @returns The JSON-LD type.
 * @internal
 */
export function getJsonLdType(object: unknown): string | undefined {
	return ObjectHelper.extractProperty(object, ["@type", "type"], false);
}
