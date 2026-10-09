// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import {
	ActivityStreamsContexts,
	ActivityStreamsTypes
} from "@3sixty/standards-w3c-activity-streams";

import type { IDataspaceActivity } from "../src/models/IDataspaceActivity.js";

describe("dataspace-models", () => {
	test("it can instantiate a new Dataspace Activity", () => {
		const activity1: IDataspaceActivity<{ globalId: string }> = {
			"@context": ActivityStreamsContexts.Context,
			type: ActivityStreamsTypes.Create,
			object: {
				"@context": "https://vocabulary.uncefact.org/unece-context.jsonld",
				type: "Consignment",
				globalId: "1234567"
			}
		};

		expect(activity1).toBeDefined();
	});

	test("it can instantiate a new Dataspace Activity with target", () => {
		const activity2: IDataspaceActivity<{ identifier: string }, { globalId: string }> = {
			"@context": ActivityStreamsContexts.Context,
			type: ActivityStreamsTypes.Add,
			object: {
				"@context": "https://vocabulary.uncefact.org/unece-context.jsonld",
				type: "Document",
				identifier: "1234567"
			},
			target: {
				"@context": "https://vocabulary.uncefact.org/unece-context.jsonld",
				type: "Consignment",
				globalId: "1234567"
			}
		};

		expect(activity2).toBeDefined();
	});

	test("it can instantiate a new Dataspace Activity with target and multiple objects", () => {
		const activity3: IDataspaceActivity<{ identifier: string }, { globalId: string }> = {
			"@context": ActivityStreamsContexts.Context,
			type: ActivityStreamsTypes.Add,
			object: [
				{
					"@context": "https://vocabulary.uncefact.org/unece-context.jsonld",
					type: "Document",
					identifier: "1234567"
				},
				{
					"@context": "https://vocabulary.uncefact.org/unece-context.jsonld",
					type: "Document",
					identifier: "aa-dd-cde"
				}
			],
			target: {
				"@context": "https://vocabulary.uncefact.org/unece-context.jsonld",
				type: "Consignment",
				globalId: "1234567"
			}
		};

		expect(activity3).toBeDefined();
	});
});
