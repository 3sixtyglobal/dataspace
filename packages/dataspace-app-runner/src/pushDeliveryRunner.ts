// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ContextIdKeys, ContextIdStore } from "@3sixty/context";
import { ComponentFactory, Guards, Is } from "@3sixty/core";
import { getJsonLdId, type IPushDeliveryPayload } from "@3sixty/dataspace-models";
import { ModuleHelper } from "@3sixty/modules";
import { nameof } from "@3sixty/nameof";
import type { IPolicyEnforcementPointComponent } from "@3sixty/rights-management-models";
import {
	ActivityStreamsContexts,
	ActivityStreamsTypes,
	type IActivityStreamsActivity
} from "@3sixty/standards-w3c-activity-streams";
import type { ITrustComponent } from "@3sixty/trust-models";
import {
	FetchHelper,
	HeaderHelper,
	HeaderTypes,
	HttpMethod,
	MimeTypes,
	type IHttpHeaders
} from "@3sixty/web";

const PUSH_DELIVERY_RUNNER_SOURCE = "pushDeliveryRunner";

let engine:
	| {
			start: () => Promise<void>;
			stop: () => Promise<void>;
			getRegisteredInstanceTypeOptional: (componentConnectorType: string) => string | undefined;
	  }
	| undefined;

// Serialises concurrent startup+task dispatch: Node.js EventEmitter doesn't await async
// listeners, so pushDeliveryRunnerStart and pushDeliveryRunner can run concurrently in the worker thread.
let startupPromise: Promise<void> | undefined;
let pepComponent: IPolicyEnforcementPointComponent | undefined;
let trustComponent: ITrustComponent | undefined;
let nodeIdentity: string | undefined;

/**
 * Push Delivery Task Startup Method.
 * @param engineCloneData Engine clone data used to initialise a worker-thread engine instance.
 * @returns A promise that resolves when the engine has started and all push-delivery components are ready.
 */
export async function pushDeliveryRunnerStart(engineCloneData: unknown): Promise<void> {
	startupPromise = (async () => {
		if (!Is.empty(engineCloneData)) {
			engine = await ModuleHelper.execModuleMethod<{
				start: () => Promise<void>;
				stop: () => Promise<void>;
				getRegisteredInstanceTypeOptional: (componentConnectorType: string) => string | undefined;
			}>("@3sixty/engine-core", "EngineCoreBuilder.fromClone", [
				"engine",
				engineCloneData,
				await ContextIdStore.getContextIds(),
				{
					logLevel: "error",
					types: [
						"loggingComponent",
						"loggingConnector",
						"entityStorageConnector",
						"vaultConnector",
						"identityComponent",
						"identityConnector",
						"trustComponent",
						"trustGeneratorComponent",
						"rightsManagementPepComponent",
						"rightsManagementPdpComponent",
						"rightsManagementPapComponent",
						"rightsManagementPmpComponent",
						"rightsManagementPipComponent",
						"rightsManagementPxpComponent",
						"rightsManagementPolicyArbiterComponent",
						"rightsManagementPolicyEnforcementProcessorComponent",
						"rightsManagementPolicyExecutionActionComponent",
						"rightsManagementPolicyInformationSourceComponent",
						"platformComponent",
						"dltConfig"
					]
				}
			]);
			await engine.start();

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
 * @returns A promise that resolves when the engine has stopped and all resources are released.
 */
export async function pushDeliveryRunnerEnd(): Promise<void> {
	if (!Is.empty(engine)) {
		await engine.stop?.();
		engine = undefined;
	}
	startupPromise = undefined;
}

/**
 * Push Delivery Task - POSTs an Activity Streams object to a consumer's /inbox.
 * @param engineCloneData Engine clone data used to initialise a worker-thread engine instance.
 * @param payload The push delivery payload describing the consumer endpoint, auth, and data.
 * @returns The delivery result containing a success flag on successful POST.
 */
export async function pushDeliveryRunner(
	engineCloneData: undefined,
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
	// engine's start-time context but doesn't propagate per-delivery tenant context - we
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
 * @returns The delivery result containing a success flag on successful POST.
 * @internal
 */
async function pushDeliveryRunnerBody(payload: IPushDeliveryPayload): Promise<unknown> {
	// Apply PEP policy filter if available
	let data = payload.data;
	if (!Is.empty(pepComponent)) {
		data = await pepComponent.interceptWithPolicy(
			payload.agreement,
			payload.data,
			undefined,
			payload.agreement.trustData
		);
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
