// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	ActivityStreamsTypes,
	IActivityStreamsActivity
} from "@twin.org/standards-w3c-activity-streams";

/**
 * ActivityPub Undo activity used by the DS Connector to unsubscribe
 * an app from a data source. The object MUST reference the `@id` of
 * a previously issued Follow activity.
 */
export interface IUndoActivity extends IActivityStreamsActivity {
	/**
	 * The activity type, always "Undo".
	 */
	type: typeof ActivityStreamsTypes.Undo;

	/**
	 * The consumerPid URN identifying the transfer process being unsubscribed.
	 */
	generator: string;

	/**
	 * The DID of the unsubscribing organization.
	 */
	actor: string;

	/**
	 * The `@id` of the Follow activity being undone.
	 */
	object: string;
}
