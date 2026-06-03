// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import { ComponentFactory, Guards, Is } from "@twin.org/core";
import { getJsonLdId, type IPushDeliveryPayload } from "@twin.org/dataspace-models";
import { EngineCore } from "@twin.org/engine-core";
import {
	EngineCoreFactory,
	type IEngineCore,
	type IEngineCoreClone
} from "@twin.org/engine-models";
import { nameof } from "@twin.org/nameof";
import type { IPolicyEnforcementPointComponent } from "@twin.org/rights-management-models";
import {
	ActivityStreamsContexts,
	ActivityStreamsTypes,
	type IActivityStreamsActivity
} from "@twin.org/standards-w3c-activity-streams";
import type { ITrustComponent } from "@twin.org/trust-models";
import {
	FetchHelper,
	HeaderHelper,
	HeaderTypes,
	HttpMethod,
	type IHttpHeaders,
	MimeTypes
} from "@twin.org/web";

const PUSH_DELIVERY_RUNNER_SOURCE = "pushDeliveryRunner";

let engine: IEngineCore | undefined;

// Serialises concurrent startup+task dispatch: Node.js EventEmitter doesn't await async
// listeners, so pushDeliveryRunnerStart and pushDeliveryRunner can run concurrently in the worker thread.
let startupPromise: Promise<void> | undefined;
let pepComponent: IPolicyEnforcementPointComponent | undefined;
let trustComponent: ITrustComponent | undefined;
let nodeIdentity: string | undefined;

/**
 * Push Delivery Task Startup Method.
 * @param engineCloneData The Engine.
 * @returns Nothing.
 */
export async function pushDeliveryRunnerStart(engineCloneData: IEngineCoreClone): Promise<void> {
	startupPromise = (async () => {
		if (!Is.empty(engineCloneData)) {
			const newEngine = new EngineCore();
			EngineCoreFactory.register("engine", () => newEngine);
			newEngine.populateClone(engineCloneData, await ContextIdStore.getContextIds(), true);
			await newEngine.start();
			engine = newEngine;

			const defaultPepType = engine.getRegisteredInstanceTypeOptional(
				"rightsManagementPepComponent"
			);
			const defaultTrustType = engine.getRegisteredInstanceTypeOptional("trustComponent");

			pepComponent = ComponentFactory.getIfExists<IPolicyEnforcementPointComponent>(defaultPepType);
			trustComponent = ComponentFactory.getIfExists<ITrustComponent>(defaultTrustType);

			const contextIds = await ContextIdStore.getContextIds();
			nodeIdentity = contextIds?.[ContextIdKeys.Node];
		}
	})();
	await startupPromise;
}

/**
 * Push Delivery Task End.
 * @returns Nothing.
 */
export async function pushDeliveryRunnerEnd(): Promise<void> {
	if (!Is.empty(engine)) {
		await engine.stop();
		engine = undefined;
	}
	startupPromise = undefined;
}

/**
 * Push Delivery Task — POSTs an Activity Streams object to a consumer's /inbox.
 * @param engineCloneData The Engine.
 * @param payload The push delivery payload.
 * @returns The result.
 */
export async function pushDeliveryRunner(
	engineCloneData: IEngineCoreClone,
	payload: IPushDeliveryPayload
): Promise<unknown> {
	// startupPromise is assigned as the first synchronous statement of pushDeliveryRunnerStart
	// (before any await) and MessagePort dispatch is FIFO, so it is always set by the time
	// this runs when both messages are dispatched from the same worker initialisation sequence.
	if (startupPromise) {
		await startupPromise;
	}

	Guards.objectValue<IPushDeliveryPayload>(PUSH_DELIVERY_RUNNER_SOURCE, nameof(payload), payload);
	Guards.stringValue(PUSH_DELIVERY_RUNNER_SOURCE, nameof(payload.consumerPid), payload.consumerPid);
	Guards.stringValue(
		PUSH_DELIVERY_RUNNER_SOURCE,
		nameof(payload.consumerEndpoint),
		payload.consumerEndpoint
	);

	// Re-establish the owning tenant's context for downstream tenant-scoped operations
	// (PEP, trust signing, vault lookups). The background-task framework snapshots the
	// engine's start-time context but doesn't propagate per-delivery tenant context — we
	// restore it explicitly from the payload here. No-op if the payload has no tenantId
	// (single-tenant deployment).
	if (Is.stringValue(payload.tenantId)) {
		const inherited = (await ContextIdStore.getContextIds()) ?? {};
		const wrappedContextIds = { ...inherited, [ContextIdKeys.Tenant]: payload.tenantId };
		return ContextIdStore.run(wrappedContextIds, async () => pushDeliveryRunnerBody(payload));
	}

	return pushDeliveryRunnerBody(payload);
}

/**
 * Inner body of the push delivery runner.
 * @param payload The push delivery payload.
 * @returns The result of the delivery.
 * @internal
 */
async function pushDeliveryRunnerBody(payload: IPushDeliveryPayload): Promise<unknown> {
	// Apply PEP policy filter if available
	let data = payload.data;
	if (!Is.empty(pepComponent)) {
		data = await pepComponent.interceptWithPolicy(payload.agreement, payload.data);
	}

	// Build Activity Streams Create wrapper
	const activity: IActivityStreamsActivity = {
		"@context": ActivityStreamsContexts.Context,
		type: ActivityStreamsTypes.Create,
		generator: payload.generatorPid,
		actor: nodeIdentity,
		to: payload.consumerPid,
		object: data
	};

	// Build auth header: use pre-packaged token or generate a fresh JWT
	let authHeader: string | undefined;
	if (Is.stringValue(payload.consumerAuthToken)) {
		authHeader = HeaderHelper.createBearer(payload.consumerAuthToken);
	} else if (Is.stringValue(nodeIdentity) && !Is.empty(trustComponent)) {
		const token = await trustComponent.generate(nodeIdentity, undefined, {
			subject: {
				consumerPid: payload.consumerPid,
				providerPid: payload.providerPid,
				agreementId: getJsonLdId(payload.agreement),
				datasetId: payload.agreement.target
			}
		});
		authHeader = HeaderHelper.createBearer(token);
	}

	const headers: IHttpHeaders = {
		[HeaderTypes.ContentType]: MimeTypes.ActivityStreams
	};
	if (Is.stringValue(authHeader)) {
		headers[HeaderTypes.Authorization] = authHeader;
	}

	// POST to consumer /inbox with retry
	await FetchHelper.fetchJson<typeof activity, unknown>(
		PUSH_DELIVERY_RUNNER_SOURCE,
		payload.consumerEndpoint,
		HttpMethod.POST,
		activity,
		{
			headers,
			timeoutMs: payload.pushTimeoutMs ?? 30000,
			retryCount: payload.pushRetryCount ?? 3,
			retryDelayMs: payload.pushRetryBaseDelayMs ?? 1000
		}
	);

	return { success: true };
}
