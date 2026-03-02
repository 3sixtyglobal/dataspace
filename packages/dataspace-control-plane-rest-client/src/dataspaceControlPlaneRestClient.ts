// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@twin.org/api-core";
import type { IBaseRestClientConfig } from "@twin.org/api-models";
import { Guards } from "@twin.org/core";
import type {
	ICompleteTransferRequest,
	ICompleteTransferResponse,
	IDataspaceControlPlaneComponent,
	IGetTransferProcessRequest,
	IGetTransferProcessResponse,
	IRequestTransferRequest,
	IRequestTransferResponse,
	IStartTransferRequest,
	IStartTransferResponse,
	ISuspendTransferRequest,
	ISuspendTransferResponse,
	ITerminateTransferRequest,
	ITerminateTransferResponse
} from "@twin.org/dataspace-models";
import { nameof } from "@twin.org/nameof";
import type {
	IDataspaceProtocolTransferCompletionMessage,
	IDataspaceProtocolTransferError,
	IDataspaceProtocolTransferProcess,
	IDataspaceProtocolTransferRequestMessage,
	IDataspaceProtocolTransferStartMessage,
	IDataspaceProtocolTransferSuspensionMessage,
	IDataspaceProtocolTransferTerminationMessage
} from "@twin.org/standards-dataspace-protocol";
import { HeaderHelper, HeaderTypes } from "@twin.org/web";

/**
 * Client for performing dataspace control plane operations through REST endpoints.
 * Implements Eclipse Dataspace Protocol (DSP) Transfer Process Protocol.
 *
 * Contract negotiation methods are not available via REST.
 * Use ComponentFactory.get<IDataspaceControlPlaneComponent>() for programmatic access
 * to negotiateAgreement() and other internal-only methods.
 */
export class DataspaceControlPlaneRestClient
	extends BaseRestClient
	implements
		Omit<
			IDataspaceControlPlaneComponent,
			| "registerNegotiationCallback"
			| "unregisterNegotiationCallback"
			| "negotiateAgreement"
			| "getNegotiation"
			| "getNegotiationHistory"
		>
{
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<DataspaceControlPlaneRestClient>();

	/**
	 * Create a new instance of DataspaceControlPlaneRestClient.
	 * @param config The configuration for the client.
	 */
	constructor(config: IBaseRestClientConfig) {
		super(DataspaceControlPlaneRestClient.CLASS_NAME, config, "dataspace-control-plane");
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return DataspaceControlPlaneRestClient.CLASS_NAME;
	}

	/**
	 * Request a Transfer Process.
	 * @param request Transfer request message (DSP compliant).
	 * @param trustPayload Trust payload containing authorization information (Base64-encoded token).
	 * @returns Transfer Process (DSP compliant) with state REQUESTED, or TransferError if the operation fails.
	 */
	public async requestTransfer(
		request: IDataspaceProtocolTransferRequestMessage,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError> {
		Guards.object(DataspaceControlPlaneRestClient.CLASS_NAME, nameof(request), request);
		Guards.stringValue(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			nameof(trustPayload),
			trustPayload
		);

		const response = await this.fetch<IRequestTransferRequest, IRequestTransferResponse>(
			"/transfers/request",
			"POST",
			{
				body: request,
				headers: {
					[HeaderTypes.Authorization]: HeaderHelper.createBearer(trustPayload)
				}
			}
		);

		return response.body;
	}

	/**
	 * Start a Transfer Process (Provider Side).
	 * @param message Transfer start message (DSP compliant).
	 * @param trustPayload Trust payload containing authorization information (Base64-encoded token).
	 * @returns Transfer Start Message (DSP compliant) with dataAddress for PULL transfers, or TransferError if the operation fails.
	 */
	public async startTransfer(
		message: IDataspaceProtocolTransferStartMessage,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferStartMessage | IDataspaceProtocolTransferError> {
		Guards.object(DataspaceControlPlaneRestClient.CLASS_NAME, nameof(message), message);
		Guards.stringValue(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			nameof(trustPayload),
			trustPayload
		);

		const response = await this.fetch<IStartTransferRequest, IStartTransferResponse>(
			"/transfers/:pid/start",
			"POST",
			{
				pathParams: { pid: message.consumerPid },
				body: message,
				headers: {
					[HeaderTypes.Authorization]: HeaderHelper.createBearer(trustPayload)
				}
			}
		);

		return response.body;
	}

	/**
	 * Complete a Transfer Process.
	 * @param message Transfer completion message (DSP compliant).
	 * @param trustPayload Trust payload containing authorization information (Base64-encoded token).
	 * @returns Transfer Process (DSP compliant) with state COMPLETED, or TransferError if the operation fails.
	 */
	public async completeTransfer(
		message: IDataspaceProtocolTransferCompletionMessage,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError> {
		Guards.object(DataspaceControlPlaneRestClient.CLASS_NAME, nameof(message), message);
		Guards.stringValue(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			nameof(trustPayload),
			trustPayload
		);

		const response = await this.fetch<ICompleteTransferRequest, ICompleteTransferResponse>(
			"/transfers/:pid/complete",
			"POST",
			{
				pathParams: { pid: message.consumerPid },
				body: message,
				headers: {
					[HeaderTypes.Authorization]: HeaderHelper.createBearer(trustPayload)
				}
			}
		);

		return response.body;
	}

	/**
	 * Suspend a Transfer Process.
	 * @param message Transfer suspension message (DSP compliant).
	 * @param trustPayload Trust payload containing authorization information (Base64-encoded token).
	 * @returns Transfer Process (DSP compliant) with state SUSPENDED, or TransferError if the operation fails.
	 */
	public async suspendTransfer(
		message: IDataspaceProtocolTransferSuspensionMessage,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError> {
		Guards.object(DataspaceControlPlaneRestClient.CLASS_NAME, nameof(message), message);
		Guards.stringValue(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			nameof(trustPayload),
			trustPayload
		);

		const response = await this.fetch<ISuspendTransferRequest, ISuspendTransferResponse>(
			"/transfers/:pid/suspend",
			"POST",
			{
				pathParams: { pid: message.consumerPid },
				body: message,
				headers: {
					[HeaderTypes.Authorization]: HeaderHelper.createBearer(trustPayload)
				}
			}
		);

		return response.body;
	}

	/**
	 * Terminate a Transfer Process.
	 * @param message Transfer termination message (DSP compliant).
	 * @param trustPayload Trust payload containing authorization information (Base64-encoded token).
	 * @returns Transfer Process (DSP compliant) with state TERMINATED, or TransferError if the operation fails.
	 */
	public async terminateTransfer(
		message: IDataspaceProtocolTransferTerminationMessage,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError> {
		Guards.object(DataspaceControlPlaneRestClient.CLASS_NAME, nameof(message), message);
		Guards.stringValue(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			nameof(trustPayload),
			trustPayload
		);

		const response = await this.fetch<ITerminateTransferRequest, ITerminateTransferResponse>(
			"/transfers/:pid/terminate",
			"POST",
			{
				pathParams: { pid: message.consumerPid },
				body: message,
				headers: {
					[HeaderTypes.Authorization]: HeaderHelper.createBearer(trustPayload)
				}
			}
		);

		return response.body;
	}

	/**
	 * Get Transfer Process state (DSP compliant).
	 * @param pid Process ID (consumerPid or providerPid).
	 * @param trustPayload Trust payload containing authorization information (Base64-encoded token).
	 * @returns Transfer Process (DSP compliant) with current state, or TransferError if the operation fails.
	 */
	public async getTransferProcess(
		pid: string,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError> {
		Guards.stringValue(DataspaceControlPlaneRestClient.CLASS_NAME, nameof(pid), pid);
		Guards.stringValue(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			nameof(trustPayload),
			trustPayload
		);

		const response = await this.fetch<IGetTransferProcessRequest, IGetTransferProcessResponse>(
			"/transfers/:pid",
			"GET",
			{
				pathParams: { pid },
				headers: {
					[HeaderTypes.Authorization]: HeaderHelper.createBearer(trustPayload)
				}
			}
		);

		return response.body;
	}
}
