// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { HttpUrlHelper } from "@twin.org/api-models";
import { ContextIdKeys } from "@twin.org/context";
import { GeneralError, Guards, Is } from "@twin.org/core";
import type { IDataspaceDataPlaneComponent } from "@twin.org/dataspace-models";
import { nameof } from "@twin.org/nameof";
import {
	DataspaceProtocolEndpointType,
	DataspaceProtocolTransferProcessTypes
} from "@twin.org/standards-dataspace-protocol";
import type {
	DataspaceProtocolTransferProcessStateType,
	IDataspaceProtocolDataAddress
} from "@twin.org/standards-dataspace-protocol";
import { EndpointProperties } from "../models/endpointProperties.js";
import type { ITransferHandler } from "../models/ITransferHandler.js";
import type { ITransferHandlerPrepareContext } from "../models/ITransferHandlerPrepareContext.js";
import type { ITransferHandlerStartContext } from "../models/ITransferHandlerStartContext.js";

/**
 * Transfer handler for HttpData-POST format (provider-initiated push).
 * The consumer does not supply a dataAddress. The provider returns its own /inbox URL
 * along with a signed JWT so the consumer can authenticate when posting activities there.
 */
export class HttpDataPostTransferHandler implements ITransferHandler {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<HttpDataPostTransferHandler>();

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return HttpDataPostTransferHandler.CLASS_NAME;
	}

	/**
	 * POST consumers do not supply a dataAddress - provider returns its own /inbox on start.
	 * @param ctx Prepare context (unused for POST).
	 * @returns undefined.
	 */
	public buildConsumerDataAddress(
		ctx: ITransferHandlerPrepareContext
	): IDataspaceProtocolDataAddress | undefined {
		return undefined;
	}

	/**
	 * Build the provider's /inbox dataAddress and signed JWT for the TransferStartMessage.
	 * @param ctx Start context containing entity, trust component, and path configuration.
	 * @returns The provider's ActivityStream inbox dataAddress with bearer token.
	 * @throws GeneralError When dataPlanePath is not configured or providerIdentity is missing.
	 */
	public async buildProviderStartDataAddress(
		ctx: ITransferHandlerStartContext
	): Promise<IDataspaceProtocolDataAddress | undefined> {
		const {
			entity,
			publicOrigin,
			dataPlanePath,
			organizationIdentity,
			trustComponent,
			overrideTrustGeneratorType
		} = ctx;

		if (!Is.stringValue(dataPlanePath)) {
			throw new GeneralError(
				HttpDataPostTransferHandler.CLASS_NAME,
				"pushTransferDataPathNotConfigured",
				{ consumerPid: entity.consumerPid }
			);
		}

		if (!Is.stringValue(entity.providerIdentity)) {
			throw new GeneralError(HttpDataPostTransferHandler.CLASS_NAME, "providerIdentityMissing");
		}

		const accessToken = await trustComponent.generate(
			entity.providerIdentity,
			overrideTrustGeneratorType,
			{
				subject: {
					consumerPid: entity.consumerPid,
					providerPid: entity.providerPid,
					agreementId: entity.agreementId,
					datasetId: entity.datasetId
				}
			}
		);

		Guards.stringValue(HttpDataPostTransferHandler.CLASS_NAME, nameof(accessToken), accessToken);

		const fullEndpoint = HttpUrlHelper.addQueryStringParam(
			`${publicOrigin}/${dataPlanePath}/inbox`,
			ContextIdKeys.Organization,
			organizationIdentity
		);

		return {
			"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
			endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
			endpoint: fullEndpoint,
			endpointProperties: [
				{
					"@type": DataspaceProtocolTransferProcessTypes.EndpointProperty,
					name: EndpointProperties.Authorization,
					value: accessToken
				},
				{
					"@type": DataspaceProtocolTransferProcessTypes.EndpointProperty,
					name: EndpointProperties.AuthType,
					value: "bearer"
				}
			]
		};
	}

	/**
	 * No-op: POST transfers do not involve a provider-managed push subscription on start.
	 * @param dataPlaneComponent The data plane component instance.
	 * @param consumerPid The consumer process ID.
	 * @param previousState The state before the STARTED transition.
	 * @returns A promise that resolves immediately.
	 */
	public async onProviderStart(
		dataPlaneComponent: IDataspaceDataPlaneComponent,
		consumerPid: string,
		previousState: DataspaceProtocolTransferProcessStateType
	): Promise<void> {}

	/**
	 * Tear down the data plane subscription when the transfer completes.
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
	 * Suspend the data plane subscription when the transfer is suspended.
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
	 * Tear down the data plane subscription when the transfer terminates.
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
