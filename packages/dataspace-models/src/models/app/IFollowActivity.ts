// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type {
	ActivityStreamsTypes,
	IActivityStreamsActivity
} from "@twin.org/standards-w3c-activity-streams";

/**
 * ActivityPub Follow activity used by the DS Connector to subscribe
 * an app to a data source. The app treats this as "start producing
 * data for this consumer."
 *
 * generator = consumerPid (URN) of the follower
 * actor     = DID of the follower's organization
 * object    = TransferProcess reference, optionally with a filter expressed as JSON-LD
 */
export interface IFollowActivity extends IActivityStreamsActivity {
	/**
	 * The activity type, always "Follow".
	 */
	type: typeof ActivityStreamsTypes.Follow;

	/**
	 * The consumerPid URN identifying the follower's transfer process.
	 */
	generator: string;

	/**
	 * The DID of the follower's organization.
	 */
	actor: string;

	/**
	 * The TransferProcess reference, optionally with a filter expressed as JSON-LD.
	 */
	object: string | IJsonLdNodeObject;
}
