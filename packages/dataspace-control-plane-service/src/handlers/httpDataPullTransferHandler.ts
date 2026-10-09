// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { HttpUrlHelper } from "@3sixty/api-models";
import { ContextIdKeys } from "@3sixty/context";
import { GeneralError, Guards, Is } from "@3sixty/core";
import type { IDataspaceDataPlaneComponent } from "@3sixty/dataspace-models";
import { nameof } from "@3sixty/nameof";
import {
	DataspaceProtocolEndpointType,
	DataspaceProtocolTransferProcessTypes
} from "@3sixty/standards-dataspace-protocol";
import type {
	DataspaceProtocolTransferProcessStateType,
	IDataspaceProtocolDataAddress
} from "@3sixty/standards-dataspace-protocol";
import { EndpointProperties } from "../models/endpointProperties.js";
import type { ITransferHandler } from "../models/ITransferHandler.js";
import type { ITransferHandlerPrepareContext } from "../models/ITransferHandlerPrepareContext.js";
import type { ITransferHandlerStartContext } from "../models/ITransferHandlerStartContext.js";

/**
 * Transfer handler for HttpData-PULL format.
 * Consumer queries the provider's data endpoint using a bearer token supplied in the
 * TransferStartMessage dataAddress. No data-plane push subscription is involved.
 */
export class HttpDataPullTransferHandler implements ITransferHandler {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<HttpDataPullTransferHandler>();

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return HttpDataPullTransferHandler.CLASS_NAME;
	}

	/**
	 * PULL consumers do not supply a dataAddress - the provider generates one on start.
	 * @param ctx Prepare context (unused for PULL).
	 * @returns undefined.
	 */
	public buildConsumerDataAddress(
		ctx: ITransferHandlerPrepareContext
	): IDataspaceProtocolDataAddress | undefined {
		return undefined;
	}

	/**
	 * Build the provider's data endpoint and bearer token for the TransferStartMessage.
	 * @param ctx Start context containing entity, trust component, and path configuration.
	 * @returns The dataAddress carrying the query endpoint and bearer token.
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
			throw new GeneralError(HttpDataPullTransferHandler.CLASS_NAME, "pullTransfersNotSupported", {
				consumerPid: entity.consumerPid,
				providerPid: entity.providerPid
			});
		}

		if (!Is.stringValue(entity.providerIdentity)) {
			throw new GeneralError(HttpDataPullTransferHandler.CLASS_NAME, "providerIdentityMissing");
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

		Guards.stringValue(HttpDataPullTransferHandler.CLASS_NAME, nameof(accessToken), accessToken);

		const fullEndpoint = HttpUrlHelper.addQueryStringParam(
			`${publicOrigin}/${dataPlanePath}/entities`,
			ContextIdKeys.Organization,
			organizationIdentity
		);

		return {
			"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
			endpointType: DataspaceProtocolEndpointType.HttpsQueryEndpoint,
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
	 * No-op: PULL transfers require no push subscription.
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
	 * No-op: PULL transfers have no push subscription to tear down.
	 * @param dataPlaneComponent The data plane component instance.
	 * @param consumerPid The consumer process ID.
	 * @returns A promise that resolves immediately.
	 */
	public async onComplete(
		dataPlaneComponent: IDataspaceDataPlaneComponent,
		consumerPid: string
	): Promise<void> {}

	/**
	 * No-op: PULL transfers have no push subscription to suspend.
	 * @param dataPlaneComponent The data plane component instance.
	 * @param consumerPid The consumer process ID.
	 * @returns A promise that resolves immediately.
	 */
	public async onSuspend(
		dataPlaneComponent: IDataspaceDataPlaneComponent,
		consumerPid: string
	): Promise<void> {}

	/**
	 * No-op: PULL transfers have no push subscription to tear down.
	 * @param dataPlaneComponent The data plane component instance.
	 * @param consumerPid The consumer process ID.
	 * @returns A promise that resolves immediately.
	 */
	public async onTerminate(
		dataPlaneComponent: IDataspaceDataPlaneComponent,
		consumerPid: string
	): Promise<void> {}
}
