// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	ActivityStreamsContexts,
	type IActivityStreamsActivity
} from "@twin.org/standards-w3c-activity-streams";

export const canonicalActivity: IActivityStreamsActivity = {
	"@context": ActivityStreamsContexts.Context,
	type: "Create",
	actor: {
		id: "did:iota:testnet:0x123456"
	},
	object: {
		"@context": "https://vocabulary.uncefact.org/unece-context-D23B.jsonld",
		"@type": "Consignment",
		globalId: "24KEP051219453I002610796"
	},
	updated: new Date().toISOString()
};

export const activityLdContextArray: IActivityStreamsActivity = {
	...canonicalActivity,
	"@context": [ActivityStreamsContexts.Context]
};

export const extendedActivity: IActivityStreamsActivity = {
	"@context": [
		{
			MyCreate: "https://twin.example.org/MyCreate"
		},
		ActivityStreamsContexts.Context
	],
	type: ["Create", "MyCreate"],
	actor: {
		id: "did:iota:testnet:0x123456"
	},
	object: {
		"@context": "https://vocabulary.uncefact.org/unece-context-D23B.jsonld",
		"@type": "Consignment",
		globalId: "24KEP051219453I002610796"
	},
	updated: new Date().toISOString()
};
