// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { IDataspaceProtocolAgreement } from "@twin.org/standards-dataspace-protocol";

/**
 * Payload handed to pushDeliveryRunner via a Background Task.
 * Contains everything the runner needs to POST one Activity Streams
 * object to a consumer's /inbox without touching entity storage.
 */
export interface IPushDeliveryPayload {
	/**
	 * The consumer process ID identifying the transfer.
	 */
	consumerPid: string;

	/**
	 * The provider process ID identifying the transfer.
	 */
	providerPid: string;

	/**
	 * PID to set as Activity.generator. Always equals providerPid since
	 * processOutboxActivity is only invoked for consumer-initiated push,
	 * where the provider is the data sender.
	 */
	generatorPid: string;

	/**
	 * The consumer's inbox endpoint URL to POST the activity to.
	 */
	consumerEndpoint: string;

	/**
	 * Optional Bearer token for authenticating the push request.
	 */
	consumerAuthToken?: string;

	/**
	 * The ODRL agreement governing the data transfer.
	 */
	agreement: IDataspaceProtocolAgreement;

	/**
	 * The JSON-LD data payload to deliver to the consumer.
	 */
	data: IJsonLdNodeObject;

	/**
	 * The JSON-LD @type of the data entity being delivered.
	 */
	entityType: string;

	/**
	 * The tenant that owns this push delivery, captured at schedule time from the active
	 * `ContextIdStore` context (typically from the subscription's `tenantId` field).
	 * The runner re-establishes this tenant context via `ContextIdStore.run` before invoking
	 * tenant-scoped operations (PEP, trust signing, vault lookups). Optional — single-tenant
	 * nodes operate without a tenant context.
	 */
	tenantId?: string;

	/**
	 * Timeout (ms) for the push delivery HTTP POST. Packaged at schedule time from service config.
	 * @default 30000
	 */
	pushTimeoutMs?: number;

	/**
	 * Max HTTP retry attempts for this delivery. Packaged at schedule time from service config.
	 * @default 3
	 */
	pushRetryCount?: number;
	/**
	 * Base retry delay (ms) for this delivery. Packaged at schedule time from service config.
	 * @default 1000
	 */
	pushRetryBaseDelayMs?: number;
}
