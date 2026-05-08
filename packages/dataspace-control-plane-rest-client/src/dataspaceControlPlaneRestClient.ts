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
	IDataspaceAppDataset,
	IAppDatasetCreateRequest,
	IAppDatasetCreateResponse,
	IAppDatasetDeleteRequest,
	IAppDatasetGetRequest,
	IAppDatasetGetResponse,
	IAppDatasetListRequest,
	IAppDatasetListResponse,
	IAppDatasetUpdateRequest,
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
	IDataspaceProtocolDataset,
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

	/**
	 * Register an app dataset for the calling tenant.
	 * @param id Optional explicit id. If omitted, derived from `dataset["@id"]`
	 * or generated by the server.
	 * @param appId The dataspace app this dataset belongs to.
	 * @param dataset The dataset payload.
	 * @returns The resolved dataset id (from the response Location header).
	 */
	public async createAppDataset(
		id: string | undefined,
		appId: string,
		dataset: IDataspaceProtocolDataset
	): Promise<string> {
		Guards.stringValue(DataspaceControlPlaneRestClient.CLASS_NAME, nameof(appId), appId);
		Guards.object<IDataspaceProtocolDataset>(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			nameof(dataset),
			dataset
		);

		const response = await this.fetch<IAppDatasetCreateRequest, IAppDatasetCreateResponse>(
			"/app-datasets",
			"POST",
			{
				body: { id, appId, dataset }
			}
		);

		return response.headers[HeaderTypes.Location];
	}

	/**
	 * Get an app dataset record owned by the calling tenant.
	 * @param id The stored dataset id.
	 * @returns The stored dataset record.
	 */
	public async getAppDataset(id: string): Promise<IDataspaceAppDataset> {
		Guards.stringValue(DataspaceControlPlaneRestClient.CLASS_NAME, nameof(id), id);

		const response = await this.fetch<IAppDatasetGetRequest, IAppDatasetGetResponse>(
			"/app-datasets/:id",
			"GET",
			{
				pathParams: { id }
			}
		);

		return response.body;
	}

	/**
	 * List the datasets owned by the calling tenant.
	 * @param cursor Optional pagination cursor.
	 * @param limit Optional maximum number of entries to return.
	 * @returns The stored datasets and the next-page cursor if more exist.
	 */
	public async listAppDatasets(
		cursor?: string,
		limit?: number
	): Promise<{
		entities: IDataspaceAppDataset[];
		cursor?: string;
	}> {
		const response = await this.fetch<IAppDatasetListRequest, IAppDatasetListResponse>(
			"/app-datasets",
			"GET",
			{
				query: {
					cursor,
					limit: limit?.toString()
				}
			}
		);

		return response.body;
	}

	/**
	 * Update an app dataset record owned by the calling tenant.
	 * @param id The stored dataset id.
	 * @param appId The dataspace app this dataset belongs to.
	 * @param dataset The dataset payload.
	 */
	public async updateAppDataset(
		id: string,
		appId: string,
		dataset: IDataspaceProtocolDataset
	): Promise<void> {
		Guards.stringValue(DataspaceControlPlaneRestClient.CLASS_NAME, nameof(id), id);
		Guards.stringValue(DataspaceControlPlaneRestClient.CLASS_NAME, nameof(appId), appId);
		Guards.object<IDataspaceProtocolDataset>(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			nameof(dataset),
			dataset
		);

		await this.fetch<IAppDatasetUpdateRequest, never>("/app-datasets/:id", "PUT", {
			pathParams: { id },
			body: { appId, dataset }
		});
	}

	/**
	 * Delete an app dataset record owned by the calling tenant.
	 * @param id The stored app dataset id.
	 */
	public async deleteAppDataset(id: string): Promise<void> {
		Guards.stringValue(DataspaceControlPlaneRestClient.CLASS_NAME, nameof(id), id);

		await this.fetch<IAppDatasetDeleteRequest, never>("/app-datasets/:id", "DELETE", {
			pathParams: { id }
		});
	}
}
