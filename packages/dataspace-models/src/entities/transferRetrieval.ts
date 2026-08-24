// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property } from "@twin.org/entity";

/**
 * Records the consumer's first successful retrieval for a transfer.
 * Written by the Data Plane, read by the Control Plane's one-shot policy sweep.
 */
@entity()
export class TransferRetrieval {
	/**
	 * The consumer PID of the transfer, primary key.
	 */
	@property({ type: "string", isPrimary: true })
	public consumerPid!: string;

	/**
	 * When the first successful retrieval happened (ISO string format).
	 */
	@property({ type: "string", format: "date-time" })
	public dateFirstRetrieved!: string;

	/**
	 * When the most recent successful retrieval happened (ISO string format).
	 */
	@property({ type: "string", format: "date-time" })
	public dateLastRetrieved!: string;
}
