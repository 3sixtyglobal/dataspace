// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@twin.org/api-core";
import type { IBaseRestClientConfig } from "@twin.org/api-models";
import { Guards, NotSupportedError } from "@twin.org/core";
import type {
	ICompleteTransferRequest,
	ICompleteTransferResponse,
	IDataspaceControlPlaneComponent,
	IGetTransferProcessRequest,
	IGetTransferProcessResponse,
	IDataspaceAppDataset,
	INegotiationCallback,
	ITransferCallback,
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
	IDataspaceProtocolContractNegotiation,
	IDataspaceProtocolContractNegotiationError,
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
	implements IDataspaceControlPlaneComponent
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
	 * Not supported on REST client — negotiation callbacks are in-process only.
	 * @param key Unused.
	 * @param callback Unused.
	 * @throws NotSupportedError as this method is not supported on the REST client.
	 */
	public registerNegotiationCallback(key: string, callback: INegotiationCallback): void {
		throw new NotSupportedError(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			"notSupportedOnClient",
			{
				methodName: "registerNegotiationCallback"
			}
		);
	}

	/**
	 * Not supported on REST client — negotiation callbacks are in-process only.
	 * @param key Unused.
	 * @throws NotSupportedError as this method is not supported on the REST client.
	 */
	public unregisterNegotiationCallback(key: string): void {
		throw new NotSupportedError(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			"notSupportedOnClient",
			{
				methodName: "unregisterNegotiationCallback"
			}
		);
	}

	/**
	 * Not supported on REST client — contract negotiation is in-process only.
	 * @param datasetId Unused.
	 * @param offerId Unused.
	 * @param providerEndpoint Unused.
	 * @param trustPayload Unused.
	 * @returns The negotiation ID for tracking.
	 */
	public async negotiateAgreement(
		datasetId: string,
		offerId: string,
		providerEndpoint: string,
		trustPayload: unknown
	): Promise<{ negotiationId?: string; agreementId?: string }> {
		throw new NotSupportedError(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			"notSupportedOnClient",
			{
				methodName: "negotiateAgreement"
			}
		);
	}

	/**
	 * Not supported on REST client — contract negotiation is in-process only.
	 * @param negotiationId Unused.
	 * @param trustPayload Unused.
	 * @returns DSP ContractNegotiation with current state, or error.
	 */
	public async getNegotiation(
		negotiationId: string,
		trustPayload: unknown
	): Promise<IDataspaceProtocolContractNegotiation | IDataspaceProtocolContractNegotiationError> {
		throw new NotSupportedError(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			"notSupportedOnClient",
			{
				methodName: "getNegotiation"
			}
		);
	}

	/**
	 * Not supported on REST client — contract negotiation is in-process only.
	 * @param state Unused.
	 * @param cursor Unused.
	 * @param trustPayload Unused.
	 * @returns List of negotiation history entries with pagination cursor.
	 */
	public async getNegotiationHistory(
		state: string | undefined,
		cursor: string | undefined,
		trustPayload: unknown
	): Promise<{
		negotiations: {
			negotiation:
				| IDataspaceProtocolContractNegotiation
				| IDataspaceProtocolContractNegotiationError;
			createdAt: string;
			offerId?: string;
			agreementId?: string;
		}[];
		cursor?: string;
		count: number;
	}> {
		throw new NotSupportedError(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			"notSupportedOnClient",
			{
				methodName: "getNegotiationHistory"
			}
		);
	}

	/**
	 * Not supported on REST client — transfer callbacks are in-process only.
	 * @param key Unused.
	 * @param callback Unused.
	 * @throws NotSupportedError as this method is not supported on the REST client.
	 */
	public registerTransferCallback(key: string, callback: ITransferCallback): void {
		throw new NotSupportedError(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			"notSupportedOnClient",
			{
				methodName: "registerTransferCallback"
			}
		);
	}

	/**
	 * Not supported on REST client — transfer callbacks are in-process only.
	 * @param key Unused.
	 * @throws NotSupportedError as this method is not supported on the REST client.
	 */
	public unregisterTransferCallback(key: string): void {
		throw new NotSupportedError(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			"notSupportedOnClient",
			{
				methodName: "unregisterTransferCallback"
			}
		);
	}

	/**
	 * Not supported on REST client — consumer-initiated transfers are in-process only.
	 * @param agreementId Unused.
	 * @param providerEndpoint Unused.
	 * @param format Unused.
	 * @param trustPayload Unused.
	 * @returns The consumerPid of the newly created TransferProcess.
	 */
	public async prepareTransfer(
		agreementId: string,
		providerEndpoint: string,
		format: string,
		trustPayload: unknown
	): Promise<{ consumerPid: string }> {
		throw new NotSupportedError(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			"notSupportedOnClient",
			{
				methodName: "prepareTransfer"
			}
		);
	}

	/**
	 * Request a Transfer Process.
	 * @param request Transfer request message (DSP compliant).
	 * @param trustPayload Trust payload containing authorization information.
	 * @returns Transfer Process (DSP compliant) with state REQUESTED, or TransferError if the operation fails.
	 * @remarks Whether the transfer auto-starts is a provider-side decision (service config); the consumer
	 * cannot request it.
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
	 * @param trustPayload Trust payload containing authorization information.
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
	 * Not supported on REST client (provider-initiated transfers are in-process only).
	 * @param pid Unused.
	 * @param trustPayload Unused.
	 * @returns Transfer Start Message (DSP compliant) with dataAddress for PULL transfers, or TransferError if the operation fails.
	 */
	public async transferStarted(
		pid: string,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferStartMessage | IDataspaceProtocolTransferError> {
		throw new NotSupportedError(
			DataspaceControlPlaneRestClient.CLASS_NAME,
			"notSupportedOnClient",
			{
				methodName: "transferStarted"
			}
		);
	}

	/**
	 * Complete a Transfer Process.
	 * @param message Transfer completion message (DSP compliant).
	 * @param trustPayload Trust payload containing authorization information.
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
	 * @param trustPayload Trust payload containing authorization information.
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
	 * @param trustPayload Trust payload containing authorization information.
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
	 * @param trustPayload Trust payload containing authorization information.
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
	 * @returns A promise that resolves when the dataset has been updated.
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
	 * @returns A promise that resolves when the dataset has been deleted.
	 */
	public async deleteAppDataset(id: string): Promise<void> {
		Guards.stringValue(DataspaceControlPlaneRestClient.CLASS_NAME, nameof(id), id);

		await this.fetch<IAppDatasetDeleteRequest, never>("/app-datasets/:id", "DELETE", {
			pathParams: { id }
		});
	}
}
