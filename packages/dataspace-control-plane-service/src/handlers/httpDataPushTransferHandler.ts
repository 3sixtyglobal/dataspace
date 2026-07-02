// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { HttpUrlHelper } from "@twin.org/api-models";
import { ContextIdKeys } from "@twin.org/context";
import { GeneralError, Is } from "@twin.org/core";
import type { IDataspaceDataPlaneComponent } from "@twin.org/dataspace-models";
import { nameof } from "@twin.org/nameof";
import {
	DataspaceProtocolEndpointType,
	DataspaceProtocolTransferProcessStateType,
	DataspaceProtocolTransferProcessTypes
} from "@twin.org/standards-dataspace-protocol";
import type { IDataspaceProtocolDataAddress } from "@twin.org/standards-dataspace-protocol";
import type { ITransferHandler } from "../models/ITransferHandler.js";
import type { ITransferHandlerPrepareContext } from "../models/ITransferHandlerPrepareContext.js";
import type { ITransferHandlerStartContext } from "../models/ITransferHandlerStartContext.js";

/**
 * Transfer handler for HttpData-PUSH format (consumer-initiated push).
 * The consumer supplies its /inbox endpoint in the TransferRequestMessage dataAddress.
 * The provider pushes ActivityStreams objects to that endpoint, and returns its own
 * /inbox in the TransferStartMessage so the consumer can route data notifications.
 */
export class HttpDataPushTransferHandler implements ITransferHandler {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<HttpDataPushTransferHandler>();

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return HttpDataPushTransferHandler.CLASS_NAME;
	}

	/**
	 * Build the consumer's /inbox dataAddress for the TransferRequestMessage.
	 * @param ctx Prepare context containing path and organization identity.
	 * @returns The consumer's ActivityStream inbox dataAddress.
	 * @throws GeneralError When dataPlanePath is not configured.
	 */
	public buildConsumerDataAddress(
		ctx: ITransferHandlerPrepareContext
	): IDataspaceProtocolDataAddress | undefined {
		const { consumerPid, origin, dataPlanePath, organizationIdentity } = ctx;

		if (!Is.stringValue(dataPlanePath)) {
			throw new GeneralError(
				HttpDataPushTransferHandler.CLASS_NAME,
				"pushTransferDataPathNotConfigured",
				{
					consumerPid
				}
			);
		}

		const inboxEndpoint = HttpUrlHelper.addQueryStringParam(
			`${origin}/${dataPlanePath}/inbox`,
			ContextIdKeys.Organization,
			organizationIdentity
		);

		return {
			"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
			endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
			endpoint: inboxEndpoint
		};
	}

	/**
	 * Validate the consumer's dataAddress and build the provider's /inbox endpoint
	 * for the TransferStartMessage. No bearer token is included — the consumer authenticates
	 * via the DSP protocol trust payload on the push POST.
	 * @param ctx Start context containing entity and path configuration.
	 * @returns The provider's ActivityStream inbox dataAddress.
	 * @throws GeneralError When the consumer dataAddress is invalid or dataPlanePath is not configured.
	 */
	public async buildProviderStartDataAddress(
		ctx: ITransferHandlerStartContext
	): Promise<IDataspaceProtocolDataAddress | undefined> {
		const { entity, publicOrigin, dataPlanePath, organizationIdentity } = ctx;

		if (
			!Is.stringValue(entity.dataAddress?.endpoint) ||
			!Is.stringValue(entity.dataAddress?.endpointType)
		) {
			throw new GeneralError(HttpDataPushTransferHandler.CLASS_NAME, "invalidPushDataAddress", {
				consumerPid: entity.consumerPid
			});
		}

		if (!Is.stringValue(dataPlanePath)) {
			throw new GeneralError(
				HttpDataPushTransferHandler.CLASS_NAME,
				"pushTransferDataPathNotConfigured",
				{ consumerPid: entity.consumerPid }
			);
		}

		const fullEndpoint = HttpUrlHelper.addQueryStringParam(
			`${publicOrigin}/${dataPlanePath}/inbox`,
			ContextIdKeys.Organization,
			organizationIdentity
		);

		return {
			"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
			endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
			endpoint: fullEndpoint
		};
	}

	/**
	 * Set up (or resume) the data-plane push subscription after state is persisted to STARTED.
	 * @param dataPlaneComponent The data plane component instance.
	 * @param consumerPid The consumer process ID.
	 * @param previousState The state before the STARTED transition.
	 * @returns A promise that resolves when the subscription is established.
	 */
	public async onProviderStart(
		dataPlaneComponent: IDataspaceDataPlaneComponent,
		consumerPid: string,
		previousState: DataspaceProtocolTransferProcessStateType
	): Promise<void> {
		if (previousState === DataspaceProtocolTransferProcessStateType.REQUESTED) {
			await dataPlaneComponent.setupPushSubscription(consumerPid);
		} else if (previousState === DataspaceProtocolTransferProcessStateType.SUSPENDED) {
			await dataPlaneComponent.resumePushSubscription(consumerPid);
		}
	}

	/**
	 * Tear down the push subscription when the transfer completes.
	 * @param dataPlaneComponent The data plane component instance.
	 * @param consumerPid The consumer process ID.
	 * @returns A promise that resolves when the subscription is torn down.
	 */
	public async onComplete(
		dataPlaneComponent: IDataspaceDataPlaneComponent,
		consumerPid: string
	): Promise<void> {
		await dataPlaneComponent.teardownPushSubscription(consumerPid);
	}

	/**
	 * Suspend the push subscription when the transfer is suspended.
	 * @param dataPlaneComponent The data plane component instance.
	 * @param consumerPid The consumer process ID.
	 * @returns A promise that resolves when the subscription is suspended.
	 */
	public async onSuspend(
		dataPlaneComponent: IDataspaceDataPlaneComponent,
		consumerPid: string
	): Promise<void> {
		await dataPlaneComponent.suspendPushSubscription(consumerPid);
	}

	/**
	 * Tear down the push subscription when the transfer terminates.
	 * @param dataPlaneComponent The data plane component instance.
	 * @param consumerPid The consumer process ID.
	 * @returns A promise that resolves when the subscription is torn down.
	 */
	public async onTerminate(
		dataPlaneComponent: IDataspaceDataPlaneComponent,
		consumerPid: string
	): Promise<void> {
		await dataPlaneComponent.teardownPushSubscription(consumerPid);
	}
}
