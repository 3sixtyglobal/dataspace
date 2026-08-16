// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Classification reasons for the unused agreement sweep, reported in logs.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AgreementSweepReason = {
	/**
	 * A live transfer (REQUESTED, STARTED or SUSPENDED) references the agreement.
	 */
	ActiveTransfer: "activeTransfer",

	/**
	 * A referencing transfer or the agreement itself changed within the unused window.
	 */
	RecentActivity: "recentActivity",

	/**
	 * The policy record carries no id, so it cannot be evaluated or removed.
	 */
	NoId: "noId",

	/**
	 * The agreement has no referencing transfers but is younger than the unused window.
	 */
	RecentAgreement: "recentAgreement",

	/**
	 * The agreement has no referencing transfers and no timestamps, so its age cannot be judged.
	 */
	NoTimestamp: "noTimestamp",

	/**
	 * Every referencing transfer is terminal and stale beyond the unused window.
	 */
	Unused: "unused",

	/**
	 * No transfer references the agreement and it is older than the unused window.
	 */
	NeverReferenced: "neverReferenced"
} as const;

/**
 * Classification reasons for the unused agreement sweep, reported in logs.
 */
export type AgreementSweepReason = (typeof AgreementSweepReason)[keyof typeof AgreementSweepReason];
