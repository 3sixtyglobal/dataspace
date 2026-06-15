// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { HttpUrlHelper, type IPlatformComponent } from "@twin.org/api-models";
import type { ITaskSchedulerComponent } from "@twin.org/background-task-models";
import { ContextIdKeys, ContextIdStore, ContextIdHelper } from "@twin.org/context";
import {
	ArrayHelper,
	AlreadyExistsError,
	BaseError,
	ComponentFactory,
	Converter,
	GeneralError,
	Guards,
	Is,
	NotFoundError,
	ObjectHelper,
	RandomHelper,
	StringHelper,
	UnauthorizedError,
	Url,
	Urn,
	ValidationError
} from "@twin.org/core";
import { JsonLdHelper, type JsonLdObjectWithNoContext } from "@twin.org/data-json-ld";
import {
	DataspaceAppFactory,
	DataspaceTransferFormat,
	TransferProcessRole,
	getJsonLdId,
	getJsonLdType,
	type IDataspaceApp,
	type IDataspaceControlPlaneComponent,
	type IDataspaceControlPlaneResolverComponent,
	type IDataspaceDataPlaneComponent,
	type INegotiationCallback,
	type ITransferCallback,
	type IDataspaceAppDataset,
	type ITransferContext,
	type ITransferProcess,
	type DataspaceAppDataset,
	type TransferProcess
} from "@twin.org/dataspace-models";
import { EngineCoreFactory } from "@twin.org/engine-models";
import { ComparisonOperator } from "@twin.org/entity";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@twin.org/entity-storage-models";
import type { IFederatedCatalogueComponent } from "@twin.org/federated-catalogue-models";
import type { ILoggingComponent } from "@twin.org/logging-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import {
	OdrlPolicyHelper,
	PolicyRequesterFactory,
	type IPolicyAdministrationPointComponent,
	type IPolicyNegotiationAdminPointComponent,
	type IPolicyNegotiationPointComponent
} from "@twin.org/rights-management-models";
import {
	DataspaceProtocolContexts,
	DataspaceProtocolContractNegotiationTypes,
	DataspaceProtocolEndpointType,
	DataspaceProtocolHelper,
	DataspaceProtocolTransferProcessStateType,
	DataspaceProtocolTransferProcessTypes,
	type DataspaceProtocolContractNegotiationStateType,
	type IDataspaceProtocolAgreement,
	type IDataspaceProtocolContractNegotiation,
	type IDataspaceProtocolContractNegotiationError,
	type IDataspaceProtocolDataset,
	type IDataspaceProtocolPolicy,
	type IDataspaceProtocolTransferCompletionMessage,
	type IDataspaceProtocolTransferError,
	type IDataspaceProtocolTransferProcess,
	type IDataspaceProtocolTransferRequestMessage,
	type IDataspaceProtocolTransferStartMessage,
	type IDataspaceProtocolTransferSuspensionMessage,
	type IDataspaceProtocolTransferTerminationMessage
} from "@twin.org/standards-dataspace-protocol";
import type { IDcatDataset } from "@twin.org/standards-w3c-dcat";
import { TrustHelper, type ITrustComponent } from "@twin.org/trust-models";
import { DataspaceControlPlanePolicyRequester } from "./dataspaceControlPlanePolicyRequester.js";
import { EndpointProperties } from "./models/endpointProperties.js";
import type { IDataspaceControlPlaneServiceConstructorOptions } from "./models/IDataspaceControlPlaneServiceConstructorOptions.js";
import {
	isCatalogError,
	isCatalogErrorName,
	transformToTransferError
} from "./utils/transferErrorUtils.js";

/**
 * Dataspace Control Plane Service implementation.
 *
 * Handles contract negotiation (via PNP callbacks) and transfer process management.
 * Negotiation is fully callback-driven: negotiateAgreement() returns immediately with
 * a negotiationId, and the caller is notified via INegotiationCallback when complete.
 */
export class DataspaceControlPlaneService
	implements IDataspaceControlPlaneComponent, IDataspaceControlPlaneResolverComponent
{
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<DataspaceControlPlaneService>();

	/**
	 * Hardcoded requester type for PNP registration.
	 * PNP uses this to route callbacks to our PolicyRequester.
	 * @internal
	 */
	private static readonly _REQUESTER_TYPE = "dataspace-control-plane-requester";

	/**
	 * Stalled negotiation threshold in milliseconds (30 minutes).
	 * Negotiations that haven't received a state update within this time are considered stalled.
	 * @internal
	 */
	private static readonly _STALLED_NEGOTIATION_THRESHOLD_MS = 30 * 60 * 1000;

	/**
	 * The logging component.
	 * @internal
	 */
	private readonly _loggingComponent?: ILoggingComponent;

	/**
	 * Policy Administration Point component for Agreement lookup.
	 * @internal
	 */
	private readonly _policyAdministrationPointComponent: IPolicyAdministrationPointComponent;

	/**
	 * Policy Negotiation Point component for contract negotiation.
	 * Used to negotiate agreements with providers before creating transfer processes.
	 * @internal
	 */
	private readonly _policyNegotiationPointComponent: IPolicyNegotiationPointComponent;

	/**
	 * Policy Negotiation Admin Point component for negotiation history.
	 * @internal
	 */
	private readonly _policyNegotiationAdminPointComponent: IPolicyNegotiationAdminPointComponent;

	/**
	 * Federated Catalogue component for dataset validation.
	 * Used to validate that Agreements reference valid catalog datasets.
	 * @internal
	 */
	private readonly _federatedCatalogueComponent: IFederatedCatalogueComponent;

	/**
	 * Entity storage for Transfer Process entities.
	 * Shared between Control Plane and Data Plane.
	 * @internal
	 */
	private readonly _transferProcessStorage: IEntityStorageConnector<TransferProcess>;

	/**
	 * Entity storage for Dataspace App Dataset entities.
	 * @internal
	 */
	private readonly _dataspaceAppDatasetStorage: IEntityStorageConnector<DataspaceAppDataset>;

	/**
	 * The trust component for token verification and generation.
	 * @internal
	 */
	private readonly _trustComponent: ITrustComponent;

	/**
	 * Override trust generator type for token generation.
	 * @internal
	 */
	private readonly _overrideTrustGeneratorType?: string;

	/**
	 * Data plane endpoint path (path only, not full URL).
	 * Will be combined with public origin from hosting component.
	 * If not configured, PULL transfers are not supported.
	 * @internal
	 */
	private readonly _dataPlanePath?: string;

	/**
	 * Factory key used to look up the data plane component. Resolved lazily at push-time
	 * (not at construction) so the data plane may register after the control plane is built.
	 * @internal
	 */
	private readonly _dataPlaneComponentType: string;

	/**
	 * Policy requester instance for handling negotiation callbacks.
	 * @internal
	 */
	private readonly _policyRequester: DataspaceControlPlanePolicyRequester;

	/**
	 * Task scheduler for periodic stalled negotiation cleanup.
	 * @internal
	 */
	private readonly _taskScheduler?: ITaskSchedulerComponent;

	/**
	 * Platform component.
	 * @internal
	 */
	private readonly _platformComponent?: IPlatformComponent;

	/**
	 * Registered negotiation callbacks from upstream callers, keyed by registration key.
	 * @internal
	 */
	private readonly _negotiationCallbacks: Map<string, INegotiationCallback>;

	/**
	 * Registered transfer callbacks from upstream callers, keyed by registration key.
	 * @internal
	 */
	private readonly _transferCallbacks: Map<string, ITransferCallback>;

	/**
	 * Internal transfer callback that fans out to all registered transfer callbacks.
	 * @internal
	 */
	private readonly _internalTransferCallback: ITransferCallback;

	/**
	 * Factory key used to create remote control plane REST client instances for outbound
	 * DSP transfer requests. Resolved via ComponentFactory.create() at call time.
	 * @internal
	 */
	private readonly _remoteControlPlaneComponentType: string;

	/**
	 * Create a new instance of DataspaceControlPlaneService.
	 * @param options The options for the service.
	 */
	constructor(options?: IDataspaceControlPlaneServiceConstructorOptions) {
		this._loggingComponent = ComponentFactory.getIfExists<ILoggingComponent>(
			options?.loggingComponentType
		);

		// Retrieve PAP component with default
		this._policyAdministrationPointComponent =
			ComponentFactory.get<IPolicyAdministrationPointComponent>(
				options?.policyAdministrationPointComponentType ?? "policy-administration-point"
			);

		// Retrieve PNP component with default
		this._policyNegotiationPointComponent = ComponentFactory.get<IPolicyNegotiationPointComponent>(
			options?.policyNegotiationPointComponentType ?? "policy-negotiation-point"
		);

		// Retrieve PNAP component for negotiation history
		this._policyNegotiationAdminPointComponent =
			ComponentFactory.get<IPolicyNegotiationAdminPointComponent>(
				options?.policyNegotiationAdminPointComponentType ?? "policy-negotiation-admin-point"
			);

		// Retrieve Federated Catalogue component with default
		this._federatedCatalogueComponent = ComponentFactory.get<IFederatedCatalogueComponent>(
			options?.federatedCatalogueComponentType ?? "federated-catalogue"
		);

		this._transferProcessStorage = EntityStorageConnectorFactory.get<
			IEntityStorageConnector<TransferProcess>
		>(options?.transferProcessEntityStorageType ?? nameofKebabCase<TransferProcess>());

		this._dataspaceAppDatasetStorage = EntityStorageConnectorFactory.get<
			IEntityStorageConnector<DataspaceAppDataset>
		>(options?.dataspaceAppDatasetEntityStorageType ?? nameofKebabCase<DataspaceAppDataset>());

		this._trustComponent = ComponentFactory.get<ITrustComponent>(
			options?.trustComponentType ?? "trust"
		);

		this._overrideTrustGeneratorType = options?.config?.overrideTrustGeneratorType;

		this._dataPlanePath = Is.stringValue(options?.config?.dataPlanePath)
			? StringHelper.trimTrailingSlashes(
					StringHelper.trimLeadingSlashes(options.config.dataPlanePath)
				)
			: undefined;

		this._taskScheduler = ComponentFactory.getIfExists<ITaskSchedulerComponent>(
			options?.taskSchedulerComponentType ?? "task-scheduler"
		);

		this._platformComponent = ComponentFactory.getIfExists<IPlatformComponent>(
			options?.platformComponentType ?? "platform"
		);

		// Data plane component is optional and resolved lazily. The control plane is initialised
		// BEFORE the data plane in engine startup order, so `getRegisteredInstanceTypeOptional`
		// returns undefined when the engine constructs us — the wiring override can't fire here.
		// The default therefore matches the engine's actual factory key
		// (`nameofKebabCase(DataspaceDataPlaneService)`) so the late-bound `requireDataPlane()`
		// lookup at push time finds it regardless of init order.
		this._dataPlaneComponentType =
			options?.dataPlaneComponentType ?? "dataspace-data-plane-service";

		this._negotiationCallbacks = new Map();
		this._transferCallbacks = new Map();
		this._internalTransferCallback = this.createInternalTransferCallback();
		this._remoteControlPlaneComponentType =
			options?.remoteControlPlaneComponentType ?? "dataspace-control-plane-rest-client";

		const internalCallback = this.createInternalCallback();

		this._policyRequester = new DataspaceControlPlanePolicyRequester(
			options?.loggingComponentType,
			internalCallback
		);

		PolicyRequesterFactory.register(
			DataspaceControlPlaneService._REQUESTER_TYPE,
			() => this._policyRequester
		);
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return DataspaceControlPlaneService.CLASS_NAME;
	}

	/**
	 * Register a callback to receive negotiation state change notifications.
	 * Upstream modules (e.g. supply-chain) register their callback here.
	 * @param key A unique key identifying this callback registration.
	 * @param callback The callback interface to register.
	 */
	public registerNegotiationCallback(key: string, callback: INegotiationCallback): void {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(key), key);
		this._negotiationCallbacks.set(key, callback);
	}

	/**
	 * Unregister a previously registered negotiation callback.
	 * @param key The key used when registering the callback.
	 */
	public unregisterNegotiationCallback(key: string): void {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(key), key);
		this._negotiationCallbacks.delete(key);
	}

	/**
	 * Register a callback to receive transfer process state change notifications.
	 * @param key A unique key identifying this callback registration.
	 * @param callback The callback interface to register.
	 */
	public registerTransferCallback(key: string, callback: ITransferCallback): void {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(key), key);
		Guards.object(DataspaceControlPlaneService.CLASS_NAME, nameof(callback), callback);
		this._transferCallbacks.set(key, callback);
	}

	/**
	 * Unregister a previously registered transfer callback.
	 * @param key The key used when registering the callback.
	 */
	public unregisterTransferCallback(key: string): void {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(key), key);
		this._transferCallbacks.delete(key);
	}

	/**
	 * The service needs to be started when the application is initialized.
	 * @param nodeLoggingComponentType The node logging component type.
	 * @returns A promise that resolves when the federated catalogue is populated and the cleanup task is scheduled.
	 */
	public async start(nodeLoggingComponentType?: string): Promise<void> {
		const engine = EngineCoreFactory.getIfExists("engine");
		// Skip if no engine exists OR if this is a clone instance
		if (Is.empty(engine) || engine.isClone()) {
			await this._loggingComponent?.log({
				level: "debug",
				ts: Date.now(),
				source: DataspaceControlPlaneService.CLASS_NAME,
				message: "engineCloneStart"
			});
			return;
		}

		await this._loggingComponent?.log({
			level: "info",
			ts: Date.now(),
			source: DataspaceControlPlaneService.CLASS_NAME,
			message: "populatingFederatedCatalogue"
		});

		let registeredCount = 0;
		let errorCount = 0;
		let totalDatasets = 0;

		// The platform component execute is used so that the dataset publication runs in the
		// tenant context of the hosting component, also works in single tenant mode
		await this._platformComponent?.execute(async () => {
			// The tenant context id is set here for each system tenant
			let cursor: string | undefined;
			do {
				const page = await this._dataspaceAppDatasetStorage.query(
					undefined,
					undefined,
					undefined,
					cursor
				);
				if (Is.arrayValue(page.entities)) {
					for (const entity of page.entities) {
						const appDataset = entity as DataspaceAppDataset;
						totalDatasets++;
						try {
							await this.publishAppDataset(appDataset);
							registeredCount++;

							await this._loggingComponent?.log({
								level: "debug",
								ts: Date.now(),
								source: DataspaceControlPlaneService.CLASS_NAME,
								message: "datasetRegistered",
								data: {
									datasetId: appDataset.id,
									appId: appDataset.appId,
									tenantId: appDataset.tenantId
								}
							});
						} catch (error) {
							errorCount++;
							await this._loggingComponent?.log({
								level: "error",
								ts: Date.now(),
								source: DataspaceControlPlaneService.CLASS_NAME,
								message: "datasetPublishFailed",
								error: BaseError.fromError(error),
								data: {
									datasetId: appDataset.id,
									appId: appDataset.appId,
									tenantId: appDataset.tenantId
								}
							});
						}
					}
				}
				cursor = page.cursor;
			} while (Is.stringValue(cursor));
		});

		await this._loggingComponent?.log({
			level: "info",
			ts: Date.now(),
			source: DataspaceControlPlaneService.CLASS_NAME,
			message: "federatedCataloguePopulated",
			data: {
				registeredCount,
				errorCount,
				totalDatasets
			}
		});

		if (this._taskScheduler) {
			await this._taskScheduler.addTask(
				"control-plane-negotiation-cleanup",
				[
					{
						nextTriggerTime: Date.now(),
						intervalMinutes: 5
					}
				],
				async () => {
					await this.cleanupStalledNegotiations();
				}
			);
		}
	}

	/**
	 * Stop the service.
	 * Removes the stalled negotiation cleanup task.
	 * @param nodeLoggingComponentType The node logging component type.
	 * @returns A promise that resolves when the cleanup task has been removed.
	 */
	public async stop(nodeLoggingComponentType?: string): Promise<void> {
		if (this._taskScheduler) {
			await this._taskScheduler.removeTask("control-plane-negotiation-cleanup");
		}
	}

	// ----------------------------------------------------------------------------
	// CONSUMER SIDE OPERATIONS
	// ----------------------------------------------------------------------------

	/**
	 * Request a Transfer Process.
	 * Creates a new Transfer Process in REQUESTED state.
	 * @param request Transfer request message (DSP compliant).
	 * @param trustPayload Trust payload containing authorization information (Base64-encoded token).
	 * @returns Transfer Process (DSP compliant) with state REQUESTED, or TransferError if the operation fails.
	 *
	 * Role Performed: Provider
	 * Called by: Consumer when it wants to request a new Transfer Process
	 */
	public async requestTransfer(
		request: IDataspaceProtocolTransferRequestMessage,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError> {
		const trustInfo = await TrustHelper.verifyTrust(
			this._trustComponent,
			trustPayload,
			"requestTransfer"
		);

		const validationFailures = await DataspaceProtocolHelper.validate(
			JsonLdHelper.toNodeObject(request)
		);

		if (Is.arrayValue(validationFailures)) {
			await this._loggingComponent?.log({
				level: "error",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "invalidTransferRequest",
				data: { validationFailures }
			});

			return transformToTransferError(
				new ValidationError(
					DataspaceControlPlaneService.CLASS_NAME,
					nameof(request),
					validationFailures
				),
				request
			);
		}

		const providerPid = `urn:uuid:${RandomHelper.generateUuidV7()}`;

		let datasetId: string;
		let consumerIdentity: string;
		let providerIdentity: string;
		let policies: IDataspaceProtocolPolicy[];

		try {
			const agreement = await this.lookupAgreement(request.agreementId);

			if (!agreement) {
				await this._loggingComponent?.log({
					level: "error",
					source: DataspaceControlPlaneService.CLASS_NAME,
					ts: Date.now(),
					message: "agreementNotFound",
					data: {
						agreementId: request.agreementId,
						hint: "Agreement must exist before transfer. Use contract negotiation to create agreement first."
					}
				});

				throw new NotFoundError(
					DataspaceControlPlaneService.CLASS_NAME,
					"agreementNotFound",
					request.agreementId,
					{
						agreementId: request.agreementId,
						hint: "Perform contract negotiation first to create an agreement"
					}
				);
			}

			const assigneeIdentity = OdrlPolicyHelper.extractAssigneeIdentity(agreement);
			const assigneeIds = ArrayHelper.fromObjectOrArray<string>(assigneeIdentity);

			// The agreement's assignee is stamped by the provider as the consumer's organization identity.
			if (!assigneeIds.includes(trustInfo.identity)) {
				throw new UnauthorizedError(
					DataspaceControlPlaneService.CLASS_NAME,
					"callerNotAuthorizedForAgreement"
				);
			}
			consumerIdentity = trustInfo.identity;

			const assignerIdentity = OdrlPolicyHelper.extractAssignerIdentity(agreement);
			const assignerIds = ArrayHelper.fromObjectOrArray<string>(assignerIdentity);
			if (assignerIds.length > 1) {
				throw new GeneralError(
					DataspaceControlPlaneService.CLASS_NAME,
					"multipleAssignersNotSupported"
				);
			}
			providerIdentity = assignerIds[0];

			datasetId = this.extractDatasetId(agreement);

			await this.validateCatalogDataset(datasetId, agreement);

			policies = [agreement];
		} catch (error) {
			return transformToTransferError(error, { consumerPid: request.consumerPid, providerPid });
		}

		const now = new Date();
		const organizationIdentity = await this.resolveContextOrganizationId();

		const storageEntity: TransferProcess = {
			id: Converter.bytesToHex(RandomHelper.generate(32)),
			consumerPid: request.consumerPid,
			providerPid,
			state: DataspaceProtocolTransferProcessStateType.REQUESTED,
			agreementId: request.agreementId,
			datasetId,
			consumerIdentity,
			providerIdentity,
			// offerId should reference Catalog Offer (via Agreement)
			// For now, use agreementId as reference (proper flow: Catalog → Negotiation → Agreement)
			offerId: request.agreementId,
			policies,
			callbackAddress: request.callbackAddress,
			format: request.format,
			organizationIdentity,
			dataAddress: request.dataAddress,
			dateCreated: now.toISOString(),
			dateModified: now.toISOString()
		};

		await this._transferProcessStorage.set(storageEntity);

		const entity: ITransferProcess = this.storageEntityToModel(storageEntity);

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "transferProcessInitiated",
			data: {
				consumerPid: request.consumerPid,
				providerPid,
				agreementId: request.agreementId
			}
		});

		return {
			"@context": [DataspaceProtocolContexts.Context],
			"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
			consumerPid: entity.consumerPid,
			providerPid: entity.providerPid,
			state: entity.state
		};
	}

	/**
	 * Start a data transfer as a Consumer.
	 * Generates a consumerPid, POSTs a TransferRequestMessage to the provider's DSP endpoint,
	 * and (only if the provider accepts) persists a local TransferProcess in REQUESTED state.
	 * @param agreementId The finalized agreement ID from contract negotiation.
	 * @param providerEndpoint The provider's DSP control plane base URL.
	 * @param publicOrigin The public origin URL of this control plane (used as callbackAddress).
	 * @param format The transfer format (e.g. "HttpData-PULL", "HttpData-PUSH").
	 * @param trustPayload Trust payload for authenticating this call.
	 * @returns The consumerPid of the newly created TransferProcess.
	 *
	 * **Engine configuration requirement:** The outbound call to the provider uses
	 * `ComponentFactory.create(remoteControlPlaneComponentType, { endpoint, pathPrefix })`.
	 * For the runtime `providerEndpoint` to be forwarded correctly, the engine **must** register
	 * the component type (default: `dataspace-control-plane-rest-client`) as a
	 * **multi-instance** component (`isMultiInstance: true` in engine config). A singleton
	 * registration ignores the runtime `endpoint` arg and silently POSTs to its
	 * static endpoint instead.
	 */
	public async startDataTransfer(
		agreementId: string,
		providerEndpoint: string,
		publicOrigin: string,
		format: string,
		trustPayload: unknown
	): Promise<{ consumerPid: string }> {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(agreementId), agreementId);
		Guards.stringValue(
			DataspaceControlPlaneService.CLASS_NAME,
			nameof(providerEndpoint),
			providerEndpoint
		);
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(publicOrigin), publicOrigin);
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(format), format);

		if (!(Object.values(DataspaceTransferFormat) as string[]).includes(format)) {
			throw new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "unsupportedTransferFormat", {
				format,
				supported: Object.values(DataspaceTransferFormat)
			});
		}

		const trustInfo = await TrustHelper.verifyTrust(
			this._trustComponent,
			trustPayload,
			"startDataTransfer"
		);

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "startingDataTransfer",
			data: { agreementId, providerEndpoint, format, identity: trustInfo.identity }
		});

		const agreement = await this.lookupAgreement(agreementId);

		const assigneeIdentity = OdrlPolicyHelper.extractAssigneeIdentity(agreement);
		const assigneeIds = ArrayHelper.fromObjectOrArray<string>(assigneeIdentity);
		if (!assigneeIds.includes(trustInfo.identity)) {
			throw new UnauthorizedError(
				DataspaceControlPlaneService.CLASS_NAME,
				"callerNotAuthorizedForAgreement"
			);
		}

		const assignerIdentity = OdrlPolicyHelper.extractAssignerIdentity(agreement);
		const assignerIds = ArrayHelper.fromObjectOrArray<string>(assignerIdentity);
		if (assignerIds.length > 1) {
			throw new GeneralError(
				DataspaceControlPlaneService.CLASS_NAME,
				"multipleAssignersNotSupported"
			);
		}
		const providerIdentity = assignerIds[0];

		const datasetId = this.extractDatasetId(agreement);

		const consumerPid = `urn:uuid:${RandomHelper.generateUuidV7()}`;
		const callbackAddress = StringHelper.trimTrailingSlashes(publicOrigin);

		// Fetch context once and reuse across the PUSH dataAddress, trust token, and storage entity.
		const organizationIdentity = await this.resolveContextOrganizationId();

		const transferRequestMessage: IDataspaceProtocolTransferRequestMessage = {
			"@context": [DataspaceProtocolContexts.Context],
			"@type": DataspaceProtocolTransferProcessTypes.TransferRequestMessage,
			consumerPid,
			agreementId,
			callbackAddress,
			format
		};

		// For consumer-initiated PUSH transfers the consumer must supply its /inbox endpoint as
		// dataAddress so the provider knows where to push ActivityStreams objects. Without it the
		// provider silently falls through to PULL mode on startTransfer.
		if (format === DataspaceTransferFormat.HttpDataPush) {
			if (!Is.stringValue(this._dataPlanePath)) {
				throw new GeneralError(
					DataspaceControlPlaneService.CLASS_NAME,
					"pushTransferDataPathNotConfigured",
					{ consumerPid }
				);
			}
			let inboxEndpoint = `${callbackAddress}/${this._dataPlanePath}/inbox`;
			if (Is.stringValue(organizationIdentity)) {
				inboxEndpoint = HttpUrlHelper.addQueryStringParam(
					inboxEndpoint,
					ContextIdKeys.Organization,
					organizationIdentity
				);
			}
			transferRequestMessage.dataAddress = {
				"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
				endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
				endpoint: inboxEndpoint
			};
		}

		// Generate outbound trust token to authenticate this node to the provider.
		const outboundToken = await this._trustComponent.generate(
			organizationIdentity,
			this._overrideTrustGeneratorType,
			{ subject: { consumerPid, agreementId } }
		);

		// Create a remote REST client pointed at the provider endpoint and call requestTransfer.
		const remoteControlPlane = ComponentFactory.create<IDataspaceControlPlaneComponent>(
			this._remoteControlPlaneComponentType,
			{ endpoint: providerEndpoint, pathPrefix: "" }
		);

		const result = await remoteControlPlane.requestTransfer(transferRequestMessage, outboundToken);

		if (getJsonLdType(result) === DataspaceProtocolTransferProcessTypes.TransferError) {
			const transferError = result as { code?: string };
			throw new GeneralError(
				DataspaceControlPlaneService.CLASS_NAME,
				"transferRequestRejectedByProvider",
				{
					agreementId,
					providerEndpoint,
					code: transferError.code
				}
			);
		}

		const transferProcess = result as { providerPid?: string };

		if (!Is.stringValue(transferProcess.providerPid)) {
			throw new GeneralError(
				DataspaceControlPlaneService.CLASS_NAME,
				"providerPidMissingInResponse",
				{ consumerPid }
			);
		}

		const now = new Date();

		const storageEntity: TransferProcess = {
			id: Converter.bytesToHex(RandomHelper.generate(32)),
			consumerPid,
			providerPid: transferProcess.providerPid,
			state: DataspaceProtocolTransferProcessStateType.REQUESTED,
			agreementId,
			datasetId,
			consumerIdentity: trustInfo.identity,
			providerIdentity,
			offerId: agreementId,
			policies: [agreement],
			callbackAddress,
			format,
			dataAddress: transferRequestMessage.dataAddress,
			organizationIdentity,
			dateCreated: now.toISOString(),
			dateModified: now.toISOString()
		};

		await this._transferProcessStorage.set(storageEntity);

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "dataTransferStarted",
			data: {
				consumerPid,
				providerPid: storageEntity.providerPid,
				agreementId,
				format
			}
		});

		return { consumerPid };
	}

	// ----------------------------------------------------------------------------
	// PROVIDER SIDE OPERATIONS
	// ----------------------------------------------------------------------------

	/**
	 * Start a Transfer Process.
	 * Transitions Transfer Process from REQUESTED to STARTED state or resumes from SUSPENDED state.
	 * @param message Transfer start message (DSP compliant).
	 * @param publicOrigin The public origin URL of this service.
	 * @param trustPayload Trust payload containing authorization information (Base64-encoded token).
	 * @returns Transfer Start Message (DSP compliant) with dataAddress for PULL transfers, or TransferError if the operation fails.
	 *
	 * Role Performed: Provider / Consumer
	 */
	public async startTransfer(
		message: IDataspaceProtocolTransferStartMessage,
		publicOrigin: string,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferStartMessage | IDataspaceProtocolTransferError> {
		publicOrigin = StringHelper.trimTrailingSlashes(publicOrigin);

		const trustInfo = await TrustHelper.verifyTrust(
			this._trustComponent,
			trustPayload,
			"startTransfer"
		);

		const validationFailures = await DataspaceProtocolHelper.validate(
			JsonLdHelper.toNodeObject(message)
		);

		if (Is.arrayValue(validationFailures)) {
			await this._loggingComponent?.log({
				level: "error",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "invalidTransferStartMessage",
				data: { validationFailures }
			});

			return transformToTransferError(
				new ValidationError(
					DataspaceControlPlaneService.CLASS_NAME,
					nameof(message),
					validationFailures
				),
				message
			);
		}

		try {
			const { entity, role } = await this.lookupTransferByMessage(message);

			if (trustInfo.identity !== entity.providerIdentity) {
				throw new UnauthorizedError(
					DataspaceControlPlaneService.CLASS_NAME,
					"callerNotAuthorizedAsProvider"
				);
			}

			// Only the organization that owns this transfer can mutate it.
			const callingOrganizationIdentity = await this.resolveContextOrganizationId();
			if (entity.organizationIdentity !== callingOrganizationIdentity) {
				throw new UnauthorizedError(
					DataspaceControlPlaneService.CLASS_NAME,
					"transferWrongOrganization"
				);
			}

			if (
				entity.state !== DataspaceProtocolTransferProcessStateType.REQUESTED &&
				entity.state !== DataspaceProtocolTransferProcessStateType.SUSPENDED
			) {
				return transformToTransferError(
					new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "invalidStateForStart", {
						consumerPid: entity.consumerPid,
						providerPid: entity.providerPid,
						currentState: entity.state
					}),
					message
				);
			}

			// The previous (pre-transition) state drives the push-subscription branch below
			// (setup vs resume). Do NOT mutate entity.state here as the persisted transition
			// to STARTED happens after the dispatch block succeeds, so any validation or
			// token-generation failure leaves the row in its prior state.
			const previousState = entity.state;

			const response: IDataspaceProtocolTransferStartMessage = {
				"@context": [DataspaceProtocolContexts.Context],
				"@type": DataspaceProtocolTransferProcessTypes.TransferStartMessage,
				consumerPid: entity.consumerPid,
				providerPid: entity.providerPid
			};

			// ============================================================================
			// PULL vs PUSH Transfer Mode Detection (DSP Protocol)
			// ============================================================================
			// The transfer mode is determined by whether the consumer provided a dataAddress
			// in the original TransferRequestMessage:
			//
			// PULL Mode (dataAddress NOT provided by consumer):
			//   - Consumer requests data but doesn't specify where to receive it
			//   - Provider generates access token and returns dataAddress in TransferStartMessage
			//   - Consumer uses the returned endpoint + token to PULL data from provider
			//   - Flow: Consumer → GET /entities?consumerPid=X (with Bearer token) → Provider
			//
			// PUSH Mode (dataAddress PROVIDED by consumer):
			//   - Consumer specifies endpoint where they want data sent (e.g., webhook URL)
			//   - Provider will PUSH data to the consumer's specified endpoint
			//   - Flow: Provider → POST to consumer's dataAddress endpoint → Consumer
			//
			// See: https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1-err1/#transfer-start-message
			// ============================================================================

			if (Is.empty(entity.dataAddress) && entity.format === DataspaceTransferFormat.HttpDataPost) {
				// PROVIDER-INITIATED PUSH: Consumer requested push but did not supply an /inbox.
				// Provider returns its own /inbox URL + a signed JWT so the consumer can verify
				// the incoming activities (HttpData-POST / DataspaceTransferFormat.HttpDataPost).
				if (!Is.stringValue(this._dataPlanePath)) {
					return transformToTransferError(
						new GeneralError(
							DataspaceControlPlaneService.CLASS_NAME,
							"pushTransferDataPathNotConfigured",
							{ consumerPid: entity.consumerPid }
						),
						message
					);
				}

				if (!Is.stringValue(entity.providerIdentity)) {
					throw new GeneralError(
						DataspaceControlPlaneService.CLASS_NAME,
						"providerIdentityMissing"
					);
				}
				const pushProviderId = entity.providerIdentity;
				const accessToken = await this._trustComponent.generate(
					pushProviderId,
					this._overrideTrustGeneratorType,
					{
						subject: {
							consumerPid: entity.consumerPid,
							providerPid: entity.providerPid,
							agreementId: entity.agreementId,
							datasetId: entity.datasetId
						}
					}
				);

				Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, "accessToken", accessToken);
				const tokenString = accessToken;
				let fullEndpoint = `${publicOrigin}/${this._dataPlanePath}/inbox`;

				// Bake the provider's organization identity into the /inbox URL so the consumer's
				// inbound POST routes to the right organization via TenantProcessor — mirrors the
				// pull-mode endpoint baking below.
				const organizationIdentity = await this.resolveContextOrganizationId();
				fullEndpoint = HttpUrlHelper.addQueryStringParam(
					fullEndpoint,
					ContextIdKeys.Organization,
					organizationIdentity
				);

				response.dataAddress = {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: fullEndpoint,
					endpointProperties: [
						{
							"@type": DataspaceProtocolTransferProcessTypes.EndpointProperty,
							name: EndpointProperties.Authorization,
							value: tokenString
						},
						{
							"@type": DataspaceProtocolTransferProcessTypes.EndpointProperty,
							name: EndpointProperties.AuthType,
							value: "bearer"
						}
					]
				};

				await this._loggingComponent?.log({
					level: "info",
					source: DataspaceControlPlaneService.CLASS_NAME,
					ts: Date.now(),
					message: "pushTransferStarted",
					data: {
						consumerPid: entity.consumerPid,
						providerPid: entity.providerPid,
						endpoint: fullEndpoint,
						transferMode: DataspaceTransferFormat.HttpDataPost
					}
				});
			} else if (Is.empty(entity.dataAddress)) {
				if (!Is.stringValue(this._dataPlanePath)) {
					return transformToTransferError(
						new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "pullTransfersNotSupported", {
							consumerPid: entity.consumerPid,
							providerPid: entity.providerPid
						}),
						message
					);
				}

				// Provider signs the data access token with its own identity.
				// The subject contains the transfer context claims that the data plane
				// will verify when the consumer presents this token
				if (!Is.stringValue(entity.providerIdentity)) {
					throw new GeneralError(
						DataspaceControlPlaneService.CLASS_NAME,
						"providerIdentityMissing"
					);
				}
				const pullProviderId = entity.providerIdentity;
				const accessToken = await this._trustComponent.generate(
					pullProviderId,
					this._overrideTrustGeneratorType,
					{
						subject: {
							consumerPid: entity.consumerPid,
							providerPid: entity.providerPid,
							agreementId: entity.agreementId,
							datasetId: entity.datasetId
						}
					}
				);

				Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, "accessToken", accessToken);
				const tokenString = accessToken;
				let fullEndpoint = `${publicOrigin}/${this._dataPlanePath}`;

				const organizationIdentity = await this.resolveContextOrganizationId();
				fullEndpoint = HttpUrlHelper.addQueryStringParam(
					fullEndpoint,
					ContextIdKeys.Organization,
					organizationIdentity
				);

				response.dataAddress = {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsQueryEndpoint,
					endpoint: fullEndpoint,
					endpointProperties: [
						{
							"@type": DataspaceProtocolTransferProcessTypes.EndpointProperty,
							name: EndpointProperties.Authorization,
							value: tokenString
						},
						{
							"@type": DataspaceProtocolTransferProcessTypes.EndpointProperty,
							name: EndpointProperties.AuthType,
							value: "bearer"
						}
					]
				};

				await this._loggingComponent?.log({
					level: "info",
					source: DataspaceControlPlaneService.CLASS_NAME,
					ts: Date.now(),
					message: "dataAccessTokenGenerated",
					data: {
						consumerPid: entity.consumerPid,
						providerPid: entity.providerPid,
						endpoint: fullEndpoint,
						transferMode: "PULL"
					}
				});
			} else {
				// PUSH MODE (consumer-initiated): Consumer provided their /inbox endpoint in
				// the TransferRequestMessage.dataAddress. Provider responds with its own /inbox
				// URL so the consumer knows where to route data notifications.
				if (
					!Is.stringValue(entity.dataAddress?.endpoint) ||
					!Is.stringValue(entity.dataAddress?.endpointType)
				) {
					return transformToTransferError(
						new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "invalidPushDataAddress", {
							consumerPid: entity.consumerPid
						}),
						message
					);
				}

				if (!Is.stringValue(this._dataPlanePath)) {
					return transformToTransferError(
						new GeneralError(
							DataspaceControlPlaneService.CLASS_NAME,
							"pushTransferDataPathNotConfigured",
							{ consumerPid: entity.consumerPid }
						),
						message
					);
				}

				let fullEndpoint = `${publicOrigin}/${this._dataPlanePath}/inbox`;

				// Bake the provider's organization identity into the /inbox URL so the consumer's
				// inbound POST routes to the right organization via TenantProcessor — mirrors the
				// pull-mode endpoint baking.
				const organizationIdentity = await this.resolveContextOrganizationId();
				fullEndpoint = HttpUrlHelper.addQueryStringParam(
					fullEndpoint,
					ContextIdKeys.Organization,
					organizationIdentity
				);

				response.dataAddress = {
					"@type": DataspaceProtocolTransferProcessTypes.DataAddress,
					endpointType: DataspaceProtocolEndpointType.HttpsActivityStreamEndpoint,
					endpoint: fullEndpoint
				};

				await this._loggingComponent?.log({
					level: "info",
					source: DataspaceControlPlaneService.CLASS_NAME,
					ts: Date.now(),
					message: "pushTransferStarted",
					data: {
						consumerPid: entity.consumerPid,
						providerPid: entity.providerPid,
						endpoint: fullEndpoint,
						transferMode: DataspaceTransferFormat.HttpDataPush
					}
				});

				const dataPlane = this.requireDataPlane();

				// Push subscription setup reads the entity from storage and requires state=STARTED.
				// Persist STARTED before the data-plane call, and roll back if subscription setup
				// fails so the row doesn't leak to STARTED on a setup-time error.
				entity.state = DataspaceProtocolTransferProcessStateType.STARTED;
				entity.dateModified = new Date();
				await this._transferProcessStorage.set(this.modelToStorageEntity(entity));

				try {
					if (previousState === DataspaceProtocolTransferProcessStateType.REQUESTED) {
						await dataPlane.setupPushSubscription(entity.consumerPid);
					} else if (previousState === DataspaceProtocolTransferProcessStateType.SUSPENDED) {
						await dataPlane.resumePushSubscription(entity.consumerPid);
					}
				} catch (subscriptionError) {
					entity.state = previousState;
					entity.dateModified = new Date();
					await this._transferProcessStorage.set(this.modelToStorageEntity(entity));
					throw subscriptionError;
				}
			}

			entity.state = DataspaceProtocolTransferProcessStateType.STARTED;
			entity.dateModified = new Date();
			await this._transferProcessStorage.set(this.modelToStorageEntity(entity));

			await this._loggingComponent?.log({
				level: "info",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "transferProcessStarted",
				data: {
					consumerPid: entity.consumerPid,
					providerPid: entity.providerPid,
					role
				}
			});

			if (role === TransferProcessRole.Consumer) {
				await this._internalTransferCallback.onStateChanged(
					entity.consumerPid,
					DataspaceProtocolTransferProcessStateType.STARTED
				);
				await this._internalTransferCallback.onStarted(entity.consumerPid, response);
			}

			return response;
		} catch (error) {
			return transformToTransferError(error, message);
		}
	}

	// ----------------------------------------------------------------------------
	// SHARED STATE MANAGEMENT OPERATIONS (Either Side)
	// ----------------------------------------------------------------------------

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
		const trustInfo = await TrustHelper.verifyTrust(
			this._trustComponent,
			trustPayload,
			"completeTransfer"
		);

		const validationFailures = await DataspaceProtocolHelper.validate(
			JsonLdHelper.toNodeObject(message)
		);

		if (Is.arrayValue(validationFailures)) {
			await this._loggingComponent?.log({
				level: "error",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "invalidTransferCompletionMessage",
				data: { validationFailures }
			});

			return transformToTransferError(
				new ValidationError(
					DataspaceControlPlaneService.CLASS_NAME,
					nameof(message),
					validationFailures
				),
				message
			);
		}

		try {
			const { entity, role } = await this.lookupTransferByMessage(message);

			if (trustInfo.identity !== entity.consumerIdentity) {
				throw new UnauthorizedError(
					DataspaceControlPlaneService.CLASS_NAME,
					"callerNotAuthorizedAsConsumer"
				);
			}

			// Only the organization that owns this transfer can mutate it.
			const callingOrganizationId = await this.resolveContextOrganizationId();
			if (entity.organizationIdentity !== callingOrganizationId) {
				throw new UnauthorizedError(
					DataspaceControlPlaneService.CLASS_NAME,
					"transferWrongOrganization"
				);
			}

			// DSP idempotency: re-receiving TransferCompletionMessage for a transfer already
			// in COMPLETED should return the same success response, not invalidStateForComplete.
			// Data-plane teardown already ran on the first attempt.
			if (entity.state === DataspaceProtocolTransferProcessStateType.COMPLETED) {
				return {
					"@context": [DataspaceProtocolContexts.Context],
					"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
					consumerPid: entity.consumerPid,
					providerPid: entity.providerPid,
					state: entity.state
				};
			}

			if (entity.state !== DataspaceProtocolTransferProcessStateType.STARTED) {
				return transformToTransferError(
					new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "invalidStateForComplete", {
						consumerPid: entity.consumerPid,
						providerPid: entity.providerPid,
						currentState: entity.state
					}),
					message
				);
			}

			const previousState = entity.state;
			entity.state = DataspaceProtocolTransferProcessStateType.COMPLETED;
			entity.dateModified = new Date();

			await this._transferProcessStorage.set(this.modelToStorageEntity(entity));

			await this._loggingComponent?.log({
				level: "info",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "transferProcessCompleted",
				data: {
					consumerPid: entity.consumerPid,
					providerPid: entity.providerPid,
					role
				}
			});

			if (this.isPushFormat(entity.format)) {
				try {
					await this.requireDataPlane().teardownPushSubscription(entity.consumerPid);
				} catch (teardownError) {
					// Symmetric rollback: data-plane teardown failed, revert the transfer state
					// so the client can retry. Without this the storage row is COMPLETED but
					// the subscription is still flowing, and a retry hits invalidStateForComplete.
					entity.state = previousState;
					entity.dateModified = new Date();
					await this._transferProcessStorage.set(this.modelToStorageEntity(entity));
					throw teardownError;
				}
			}

			if (role === TransferProcessRole.Consumer) {
				await this._internalTransferCallback.onStateChanged(
					entity.consumerPid,
					DataspaceProtocolTransferProcessStateType.COMPLETED
				);
				await this._internalTransferCallback.onCompleted(entity.consumerPid);
			}

			return {
				"@context": [DataspaceProtocolContexts.Context],
				"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
				consumerPid: entity.consumerPid,
				providerPid: entity.providerPid,
				state: entity.state
			};
		} catch (error) {
			return transformToTransferError(error, message);
		}
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
		const trustInfo = await TrustHelper.verifyTrust(
			this._trustComponent,
			trustPayload,
			"suspendTransfer"
		);

		const validationFailures = await DataspaceProtocolHelper.validate(
			JsonLdHelper.toNodeObject(message)
		);

		if (Is.arrayValue(validationFailures)) {
			await this._loggingComponent?.log({
				level: "error",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "invalidTransferSuspensionMessage",
				data: { validationFailures }
			});

			return transformToTransferError(
				new ValidationError(
					DataspaceControlPlaneService.CLASS_NAME,
					nameof(message),
					validationFailures
				),
				message
			);
		}

		try {
			const { entity, role } = await this.lookupTransferByMessage(message);

			if (
				trustInfo.identity !== entity.consumerIdentity &&
				trustInfo.identity !== entity.providerIdentity
			) {
				throw new UnauthorizedError(
					DataspaceControlPlaneService.CLASS_NAME,
					"callerNotAuthorizedForTransfer"
				);
			}

			// S2 belt-and-braces: only the organization that owns this transfer can mutate it.
			const callingOrganizationId = await this.resolveContextOrganizationId();
			if (entity.organizationIdentity !== callingOrganizationId) {
				throw new UnauthorizedError(
					DataspaceControlPlaneService.CLASS_NAME,
					"transferWrongOrganization"
				);
			}

			// DSP idempotency: re-receiving TransferSuspensionMessage for a transfer already
			// in SUSPENDED should return success. Data-plane suspend already ran.
			if (entity.state === DataspaceProtocolTransferProcessStateType.SUSPENDED) {
				return {
					"@context": [DataspaceProtocolContexts.Context],
					"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
					consumerPid: entity.consumerPid,
					providerPid: entity.providerPid,
					state: entity.state
				};
			}

			if (entity.state !== DataspaceProtocolTransferProcessStateType.STARTED) {
				return transformToTransferError(
					new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "invalidStateForSuspend", {
						consumerPid: entity.consumerPid,
						providerPid: entity.providerPid,
						currentState: entity.state
					}),
					message
				);
			}

			const previousState = entity.state;
			entity.state = DataspaceProtocolTransferProcessStateType.SUSPENDED;
			entity.dateModified = new Date();

			await this._transferProcessStorage.set(this.modelToStorageEntity(entity));

			await this._loggingComponent?.log({
				level: "info",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "transferProcessSuspended",
				data: {
					consumerPid: entity.consumerPid,
					providerPid: entity.providerPid,
					role,
					reason: message.reason
				}
			});

			if (this.isPushFormat(entity.format)) {
				try {
					await this.requireDataPlane().suspendPushSubscription(entity.consumerPid);
				} catch (suspendError) {
					// Symmetric rollback: data-plane suspend failed, revert transfer state so
					// a retry can repair the subscription instead of failing invalidStateForSuspend.
					entity.state = previousState;
					entity.dateModified = new Date();
					await this._transferProcessStorage.set(this.modelToStorageEntity(entity));
					throw suspendError;
				}
			}

			if (role === TransferProcessRole.Consumer) {
				await this._internalTransferCallback.onStateChanged(
					entity.consumerPid,
					DataspaceProtocolTransferProcessStateType.SUSPENDED
				);
				// DSP reason is typed any[] — forward only the first entry since the callback
				// contract is reason?: string. Additional entries are intentionally dropped.
				const suspendReason = Array.isArray(message.reason)
					? (message.reason[0] as string | undefined)
					: (message.reason as string | undefined);
				await this._internalTransferCallback.onSuspended(entity.consumerPid, suspendReason);
			}

			return {
				"@context": [DataspaceProtocolContexts.Context],
				"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
				consumerPid: entity.consumerPid,
				providerPid: entity.providerPid,
				state: entity.state
			};
		} catch (error) {
			return transformToTransferError(error, message);
		}
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
		const trustInfo = await TrustHelper.verifyTrust(
			this._trustComponent,
			trustPayload,
			"terminateTransfer"
		);

		const validationFailures = await DataspaceProtocolHelper.validate(
			JsonLdHelper.toNodeObject(message)
		);

		if (Is.arrayValue(validationFailures)) {
			await this._loggingComponent?.log({
				level: "error",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "invalidTransferTerminationMessage",
				data: { validationFailures }
			});

			return transformToTransferError(
				new ValidationError(
					DataspaceControlPlaneService.CLASS_NAME,
					nameof(message),
					validationFailures
				),
				message
			);
		}

		try {
			const { entity, role } = await this.lookupTransferByMessage(message);

			if (
				trustInfo.identity !== entity.consumerIdentity &&
				trustInfo.identity !== entity.providerIdentity
			) {
				throw new UnauthorizedError(
					DataspaceControlPlaneService.CLASS_NAME,
					"callerNotAuthorizedForTransfer"
				);
			}

			// Only the organization that owns this transfer can mutate it.
			const organizationIdentity = await this.resolveContextOrganizationId();
			if (entity.organizationIdentity !== organizationIdentity) {
				throw new UnauthorizedError(
					DataspaceControlPlaneService.CLASS_NAME,
					"transferWrongOrganization"
				);
			}

			// DSP idempotency: re-receiving TransferTerminationMessage for a transfer already
			// in TERMINATED should return success. Data-plane teardown already ran.
			if (entity.state === DataspaceProtocolTransferProcessStateType.TERMINATED) {
				return {
					"@context": [DataspaceProtocolContexts.Context],
					"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
					consumerPid: entity.consumerPid,
					providerPid: entity.providerPid,
					state: entity.state
				};
			}

			const previousState = entity.state;
			entity.state = DataspaceProtocolTransferProcessStateType.TERMINATED;
			entity.dateModified = new Date();

			await this._transferProcessStorage.set(this.modelToStorageEntity(entity));

			await this._loggingComponent?.log({
				level: "info",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "transferProcessTerminated",
				data: {
					consumerPid: entity.consumerPid,
					providerPid: entity.providerPid,
					role,
					reason: message.reason
				}
			});

			if (this.isPushFormat(entity.format)) {
				try {
					await this.requireDataPlane().teardownPushSubscription(entity.consumerPid);
				} catch (teardownError) {
					// Symmetric rollback: data-plane teardown failed, revert transfer state so
					// a retry can repair the subscription. Terminate is reachable from multiple
					// states (REQUESTED/STARTED/SUSPENDED), so restore the actual previous one.
					entity.state = previousState;
					entity.dateModified = new Date();
					await this._transferProcessStorage.set(this.modelToStorageEntity(entity));
					throw teardownError;
				}
			}

			if (role === TransferProcessRole.Consumer) {
				await this._internalTransferCallback.onStateChanged(
					entity.consumerPid,
					DataspaceProtocolTransferProcessStateType.TERMINATED
				);
				// DSP reason is typed any[] — forward only the first entry since the callback
				// contract is reason?: string. Additional entries are intentionally dropped.
				const terminateReason = Array.isArray(message.reason)
					? (message.reason[0] as string | undefined)
					: (message.reason as string | undefined);
				await this._internalTransferCallback.onTerminated(entity.consumerPid, terminateReason);
			}

			return {
				"@context": [DataspaceProtocolContexts.Context],
				"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
				consumerPid: entity.consumerPid,
				providerPid: entity.providerPid,
				state: entity.state
			};
		} catch (error) {
			return transformToTransferError(error, message);
		}
	}

	/**
	 * Get Transfer Process state.
	 * @param pid Process ID (consumerPid or providerPid).
	 * @param trustPayload Trust payload containing authorization information (Base64-encoded token).
	 * @returns Transfer Process (DSP compliant) with current state, or TransferError if the operation fails.
	 */
	public async getTransferProcess(
		pid: string,
		trustPayload: unknown
	): Promise<IDataspaceProtocolTransferProcess | IDataspaceProtocolTransferError> {
		const trustInfo = await TrustHelper.verifyTrust(
			this._trustComponent,
			trustPayload,
			"getTransferProcess"
		);

		try {
			const { entity, role } = await this.lookupTransferByPid(pid);

			if (
				trustInfo.identity !== entity.consumerIdentity &&
				trustInfo.identity !== entity.providerIdentity
			) {
				throw new UnauthorizedError(
					DataspaceControlPlaneService.CLASS_NAME,
					"callerNotAuthorizedForTransfer"
				);
			}

			await this._loggingComponent?.log({
				level: "info",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "transferProcessQueried",
				data: {
					pid,
					role,
					state: entity.state
				}
			});

			return {
				"@context": [DataspaceProtocolContexts.Context],
				"@type": DataspaceProtocolTransferProcessTypes.TransferProcess,
				consumerPid: entity.consumerPid,
				providerPid: entity.providerPid,
				state: entity.state
			};
		} catch (error) {
			return transformToTransferError(error, { consumerPid: pid, providerPid: pid });
		}
	}

	// ============================================================================
	// CONTRACT NEGOTIATION
	// ============================================================================

	/**
	 * Negotiate a contract agreement with a provider.
	 * Returns immediately with a negotiationId. The caller is notified
	 * via the registered INegotiationCallback when the negotiation completes.
	 *
	 * @param datasetId The dataset ID from the provider's catalog.
	 * @param offerId The offer ID from the provider's catalog.
	 * @param providerEndpoint The provider's contract negotiation endpoint URL.
	 * @param publicOrigin The public origin URL of this control plane (for callbacks).
	 * @param trustPayload The trust payload for authentication.
	 * @returns The negotiation ID. Use the registered callback for completion notification.
	 */
	public async negotiateAgreement(
		datasetId: string,
		offerId: string,
		providerEndpoint: string,
		publicOrigin: string,
		trustPayload: unknown
	): Promise<{ negotiationId: string }> {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(datasetId), datasetId);
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(offerId), offerId);
		Guards.stringValue(
			DataspaceControlPlaneService.CLASS_NAME,
			nameof(providerEndpoint),
			providerEndpoint
		);
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(publicOrigin), publicOrigin);

		const trustInfo = await TrustHelper.verifyTrust(
			this._trustComponent,
			trustPayload,
			"negotiateAgreement"
		);

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "startingContractNegotiation",
			data: {
				datasetId,
				offerId,
				providerEndpoint,
				publicOrigin,
				verifiedIdentity: trustInfo.identity
			}
		});

		const organizationId = await this.resolveContextOrganizationId();

		const localTrustPayload = await this._trustComponent.generate(
			organizationId,
			this._overrideTrustGeneratorType,
			{}
		);
		const catalogResult = await this._federatedCatalogueComponent.get(datasetId, localTrustPayload);

		if (isCatalogError(catalogResult)) {
			if (isCatalogErrorName(catalogResult, NotFoundError.CLASS_NAME)) {
				throw new NotFoundError(
					DataspaceControlPlaneService.CLASS_NAME,
					"datasetNotFoundInCatalog",
					datasetId,
					{
						datasetId,
						offerId,
						providerEndpoint
					}
				);
			}

			throw new GeneralError(
				DataspaceControlPlaneService.CLASS_NAME,
				"catalogLookupFailedForNegotiation",
				{
					datasetId,
					offerId,
					providerEndpoint,
					errorCode: catalogResult.code
				}
			);
		}

		const rawOffers = this.getCatalogDatasetPolicies(catalogResult);

		if (!Is.arrayValue(rawOffers)) {
			throw new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "datasetHasNoOffers", {
				offerId,
				datasetId: getJsonLdId(catalogResult) ?? ""
			});
		}

		const catalogOffers = rawOffers.filter(offer => Is.object<IDataspaceProtocolPolicy>(offer));

		if (!Is.arrayValue(catalogOffers)) {
			throw new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "datasetHasNoValidOffers", {
				offerId,
				datasetId: getJsonLdId(catalogResult) ?? ""
			});
		}

		const matchingOffer = catalogOffers.find((offer: IDataspaceProtocolPolicy) => {
			const offerUid = OdrlPolicyHelper.getUid(offer);
			return offerUid === offerId;
		});

		if (!matchingOffer) {
			const availableOffers = catalogOffers
				.map((o: IDataspaceProtocolPolicy) => OdrlPolicyHelper.getUid(o) ?? "unknown")
				.join(", ");

			throw new NotFoundError(
				DataspaceControlPlaneService.CLASS_NAME,
				"offerNotFoundInDataset",
				offerId,
				{
					offerId,
					datasetId: getJsonLdId(catalogResult) ?? "",
					availableOffers
				}
			);
		}

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "offerFoundInCatalog",
			data: {
				offerId,
				datasetId: getJsonLdId(catalogResult) ?? "",
				offerType: getJsonLdType(matchingOffer)
			}
		});

		const negotiationId = await this._policyNegotiationPointComponent.sendRequestToProvider(
			providerEndpoint,
			DataspaceControlPlaneService._REQUESTER_TYPE,
			offerId,
			publicOrigin
		);

		if (!negotiationId) {
			throw new GeneralError(
				DataspaceControlPlaneService.CLASS_NAME,
				"negotiationInitiationFailed",
				{
					offerId,
					providerEndpoint
				}
			);
		}

		this._policyRequester.trackNegotiation(negotiationId);

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "negotiationInitiated",
			data: { negotiationId, offerId }
		});

		return { negotiationId };
	}

	/**
	 * Get the current state of a contract negotiation.
	 * @param negotiationId The unique identifier of the negotiation.
	 * @param trustPayload The trust payload for authentication.
	 * @returns Current state of the negotiation.
	 */
	public async getNegotiation(
		negotiationId: string,
		trustPayload: unknown
	): Promise<IDataspaceProtocolContractNegotiation | IDataspaceProtocolContractNegotiationError> {
		Guards.stringValue(
			DataspaceControlPlaneService.CLASS_NAME,
			nameof(negotiationId),
			negotiationId
		);

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "getNegotiation",
			data: { negotiationId }
		});

		const result = await this._policyNegotiationPointComponent.getNegotiation(
			negotiationId,
			trustPayload
		);

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "negotiationStateRetrieved",
			data: {
				negotiationId,
				type: getJsonLdType(result),
				state: (result as IDataspaceProtocolContractNegotiation).state
			}
		});

		return result;
	}

	/**
	 * Get negotiation history.
	 * @param state Optional filter by negotiation state.
	 * @param cursor Optional pagination cursor.
	 * @param trustPayload Trust payload for authentication.
	 * @returns List of negotiation history entries with pagination.
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
		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "getNegotiationHistory",
			data: { state, cursor }
		});

		const { items: pnapNegotiations, cursor: nextCursor } =
			await this._policyNegotiationAdminPointComponent.query(
				state as DataspaceProtocolContractNegotiationStateType | undefined,
				cursor
			);

		const negotiations = pnapNegotiations.map(pnapNeg => {
			const dspNegotiation: IDataspaceProtocolContractNegotiation = {
				"@context": [DataspaceProtocolContexts.Context],
				"@type": DataspaceProtocolContractNegotiationTypes.ContractNegotiation,
				consumerPid: pnapNeg.id,
				providerPid: pnapNeg.correlationId,
				state: pnapNeg.state
			};

			return {
				negotiation: dspNegotiation,
				createdAt: pnapNeg.dateCreated,
				offerId: OdrlPolicyHelper.getUid(pnapNeg.offer),
				agreementId: OdrlPolicyHelper.getUid(pnapNeg.agreement)
			};
		});

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "negotiationHistoryRetrieved",
			data: {
				count: negotiations.length,
				state,
				hasCursor: Boolean(nextCursor)
			}
		});

		return {
			negotiations,
			cursor: nextCursor,
			count: negotiations.length
		};
	}

	// ============================================================================
	// RESOLVER METHODS - IDataspaceControlPlaneResolverComponent
	// ============================================================================

	/**
	 * Resolve consumerPid to Transfer Context.
	 * @param consumerPid Consumer Process ID.
	 * @param trustPayload Trust payload containing authorization information (Base64-encoded token).
	 * @returns Transfer Context with Agreement, datasetId, and Transfer Process metadata.
	 */
	public async resolveConsumerPid(
		consumerPid: string,
		trustPayload: unknown
	): Promise<ITransferContext> {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(consumerPid), consumerPid);

		await TrustHelper.verifyTrust(this._trustComponent, trustPayload, "resolveConsumerPid");

		const storageEntity = await this._transferProcessStorage.get(consumerPid);

		if (!storageEntity) {
			throw new NotFoundError(
				DataspaceControlPlaneService.CLASS_NAME,
				"transferProcessNotFound",
				undefined,
				{ consumerPid }
			);
		}

		const entity = this.storageEntityToModel(storageEntity);

		if (entity.state === DataspaceProtocolTransferProcessStateType.TERMINATED) {
			throw new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "transferProcessTerminated", {
				consumerPid
			});
		}

		const agreement = await this.lookupAgreement(entity.agreementId);

		const organizationIdentity = await this.resolveContextOrganizationId();

		const assignerIdentity = OdrlPolicyHelper.extractAssignerIdentity(agreement);
		const assignerIds = ArrayHelper.fromObjectOrArray<string>(assignerIdentity);

		if (!assignerIds.includes(organizationIdentity)) {
			throw new UnauthorizedError(
				DataspaceControlPlaneService.CLASS_NAME,
				"agreementAssignerMismatch",
				{
					consumerPid,
					agreementId: OdrlPolicyHelper.getUid(agreement),
					organizationIdentity,
					actualAssigner: assignerIds.join(", ")
				}
			);
		}

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "resolvedConsumerPid",
			data: {
				consumerPid,
				datasetId: entity.datasetId,
				state: entity.state,
				consumerIdentity: entity.consumerIdentity,
				agreementId: OdrlPolicyHelper.getUid(agreement),
				organizationId: organizationIdentity
			}
		});

		return {
			consumerPid: entity.consumerPid,
			providerPid: entity.providerPid,
			agreement,
			datasetId: entity.datasetId,
			offerId: entity.offerId,
			state: entity.state,
			consumerIdentity: entity.consumerIdentity,
			providerIdentity: entity.providerIdentity,
			dataAddress: entity.dataAddress
		};
	}

	/**
	 * Resolve providerPid to Transfer Context.
	 * @param providerPid Provider Process ID.
	 * @param trustPayload Trust payload containing authorization information (Base64-encoded token).
	 * @returns Transfer Context with Agreement, datasetId, and Transfer Process metadata.
	 */
	public async resolveProviderPid(
		providerPid: string,
		trustPayload: unknown
	): Promise<ITransferContext> {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(providerPid), providerPid);

		await TrustHelper.verifyTrust(this._trustComponent, trustPayload, "resolveProviderPid");

		const { entity } = await this.lookupTransferByPid(providerPid);

		if (entity.state === DataspaceProtocolTransferProcessStateType.TERMINATED) {
			throw new GeneralError(
				DataspaceControlPlaneService.CLASS_NAME,
				"transferProcessTerminatedProvider",
				{
					providerPid
				}
			);
		}

		const agreement = await this.lookupAgreement(entity.agreementId);

		const organizationIdentity = await this.resolveContextOrganizationId();

		const assignerIdentity = OdrlPolicyHelper.extractAssignerIdentity(agreement);
		const assignerIds = ArrayHelper.fromObjectOrArray<string>(assignerIdentity);

		if (!assignerIds.includes(organizationIdentity)) {
			throw new UnauthorizedError(
				DataspaceControlPlaneService.CLASS_NAME,
				"agreementAssignerMismatchProvider",
				{
					providerPid,
					agreementId: OdrlPolicyHelper.getUid(agreement),
					organizationIdentity,
					actualAssigner: assignerIds.join(", ")
				}
			);
		}

		// Validate that Agreement assignee matches expected consumer identity
		// This ensures we're pushing to the correct consumer
		// If assignee is undefined but consumerIdentity has a value, this is also a mismatch
		const assigneeIdentity = OdrlPolicyHelper.extractAssigneeIdentity(agreement);
		const assigneeIds = ArrayHelper.fromObjectOrArray<string>(assigneeIdentity);

		if (
			!Is.stringValue(entity.consumerIdentity) ||
			!assigneeIds.includes(entity.consumerIdentity)
		) {
			throw new UnauthorizedError(
				DataspaceControlPlaneService.CLASS_NAME,
				"agreementAssigneeMismatch",
				{
					providerPid,
					agreementId: OdrlPolicyHelper.getUid(agreement),
					expectedConsumerIdentity: entity.consumerIdentity,
					actualAssignee: assigneeIds.join(", ")
				}
			);
		}

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "resolvedProviderPid",
			data: {
				providerPid,
				datasetId: entity.datasetId,
				state: entity.state,
				consumerIdentity: entity.consumerIdentity,
				providerIdentity: entity.providerIdentity,
				agreementId: OdrlPolicyHelper.getUid(agreement),
				organizationId: organizationIdentity
			}
		});

		return {
			consumerPid: entity.consumerPid,
			providerPid: entity.providerPid,
			agreement,
			datasetId: entity.datasetId,
			offerId: entity.offerId,
			state: entity.state,
			consumerIdentity: entity.consumerIdentity,
			providerIdentity: entity.providerIdentity,
			dataAddress: entity.dataAddress
		};
	}

	/**
	 * Register a dataset for a dataspace app, owned by the calling organization.
	 * @param id Optional explicit id. If omitted, derived from `dataset["@id"]`
	 * or generated.
	 * @param appId The dataspace app this dataset belongs to.
	 * @param dataset The dataset payload.
	 * @returns The resolved dataset id.
	 */
	public async createAppDataset(
		id: string | undefined,
		appId: string,
		dataset: IDataspaceProtocolDataset
	): Promise<string> {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(appId), appId);
		Guards.object<IDataspaceProtocolDataset>(
			DataspaceControlPlaneService.CLASS_NAME,
			nameof(dataset),
			dataset
		);

		let resolvedId;

		if (Is.stringValue(id)) {
			resolvedId = id;
		} else if (Is.stringValue(dataset["@id"])) {
			resolvedId = dataset["@id"];
		} else {
			resolvedId = `dataset:${RandomHelper.generateUuidV7("compact")}`;
		}

		if (!Urn.tryParseExact(resolvedId) || !Url.tryParseExact(resolvedId)) {
			throw new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "invalidDatasetId", {
				id: resolvedId
			});
		}

		const organizationIdentity = await this.resolveContextOrganizationId();
		const existing = await this._dataspaceAppDatasetStorage.get(resolvedId);
		if (!Is.empty(existing)) {
			throw new AlreadyExistsError(
				DataspaceControlPlaneService.CLASS_NAME,
				"datasetAlreadyExists",
				resolvedId
			);
		}

		const now = new Date().toISOString();
		const entity: DataspaceAppDataset = {
			id: resolvedId,
			organizationIdentity,
			// Required for out of bound dataset operations that need to correlate back to the owning tenant
			tenantId: await this.resolveContextTenantId(),
			appId,
			dataset: ObjectHelper.omit(dataset, ["@id"]),
			dateCreated: now,
			dateModified: now
		};

		// Side effect first, primary storage last
		await this.publishAppDataset(entity);
		await this._dataspaceAppDatasetStorage.set(entity);

		return resolvedId;
	}

	/**
	 * Get a dataset record owned by the calling organization.
	 * @param id The stored dataset id.
	 * @returns The stored dataset record.
	 */
	public async getAppDataset(id: string): Promise<IDataspaceAppDataset> {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(id), id);

		const organizationId = await this.resolveContextOrganizationId();
		const entity = await this._dataspaceAppDatasetStorage.get(id);
		if (Is.empty(entity)) {
			throw new NotFoundError(DataspaceControlPlaneService.CLASS_NAME, "datasetNotFound", id);
		}
		if (entity.organizationIdentity !== organizationId) {
			throw new UnauthorizedError(
				DataspaceControlPlaneService.CLASS_NAME,
				"datasetWrongOrganization"
			);
		}

		return {
			id: entity.id,
			appId: entity.appId,
			dataset: this.restampDatasetId(entity.dataset, entity.id),
			dateCreated: entity.dateCreated,
			dateModified: entity.dateModified
		};
	}

	/**
	 * List the dataspace app datasets owned by the calling organization.
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
		const organizationIdentity = await this.resolveContextOrganizationId();
		const page = await this._dataspaceAppDatasetStorage.query(
			{
				property: "organizationIdentity",
				value: organizationIdentity,
				comparison: ComparisonOperator.Equals
			},
			undefined,
			undefined,
			cursor,
			limit
		);

		const entities: IDataspaceAppDataset[] = (page.entities ?? []).map(entity => ({
			id: entity.id,
			appId: entity.appId,
			dataset: this.restampDatasetId(entity.dataset ?? {}, entity.id ?? ""),
			dateCreated: entity.dateCreated,
			dateModified: entity.dateModified
		})) as IDataspaceAppDataset[];

		return {
			entities,
			cursor: page.cursor
		};
	}

	/**
	 * Update a dataset record owned by the calling organization.
	 * @param id The stored dataset id.
	 * @param appId The dataspace app this dataset belongs to.
	 * @param dataset The dataset payload.
	 * @returns A promise that resolves when the dataset has been updated in storage and the catalogue.
	 */
	public async updateAppDataset(
		id: string,
		appId: string,
		dataset: IDataspaceProtocolDataset
	): Promise<void> {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(id), id);
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(appId), appId);
		Guards.object<IDataspaceProtocolDataset>(
			DataspaceControlPlaneService.CLASS_NAME,
			nameof(dataset),
			dataset
		);

		const organizationId = await this.resolveContextOrganizationId();
		const existing = await this._dataspaceAppDatasetStorage.get(id);
		if (Is.empty(existing)) {
			throw new NotFoundError(DataspaceControlPlaneService.CLASS_NAME, "datasetNotFound", id);
		}
		if (existing.organizationIdentity !== organizationId) {
			throw new UnauthorizedError(
				DataspaceControlPlaneService.CLASS_NAME,
				"datasetWrongOrganization"
			);
		}

		const updated: DataspaceAppDataset = {
			...existing,
			appId,
			dataset: ObjectHelper.omit(dataset, ["@id"]),
			dateModified: new Date().toISOString()
		};

		// Side effect first, primary storage last
		await this.publishAppDataset(updated);
		await this._dataspaceAppDatasetStorage.set(updated);
	}

	/**
	 * Delete a dataspace app dataset owned by the calling organization.
	 * @param id The stored app dataset id.
	 * @returns A promise that resolves when the dataset has been removed from storage and the catalogue.
	 */
	public async deleteAppDataset(id: string): Promise<void> {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(id), id);

		const organizationId = await this.resolveContextOrganizationId();
		const existing = await this._dataspaceAppDatasetStorage.get(id);
		if (Is.empty(existing)) {
			throw new NotFoundError(DataspaceControlPlaneService.CLASS_NAME, "datasetNotFound", id);
		}
		if (existing.organizationIdentity !== organizationId) {
			throw new UnauthorizedError(
				DataspaceControlPlaneService.CLASS_NAME,
				"datasetWrongOrganization"
			);
		}

		const localTrustPayload = await this._trustComponent.generate(
			existing.organizationIdentity,
			this._overrideTrustGeneratorType,
			{}
		);
		const removeResult = await this._federatedCatalogueComponent.remove(id, localTrustPayload);

		if (isCatalogError(removeResult)) {
			throw new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "datasetRemoveFailed", {
				datasetId: id,
				tenantId: existing.tenantId ?? "",
				catalogErrorCode: removeResult.code
			});
		}

		await this._dataspaceAppDatasetStorage.remove(id);
	}
	// ============================================================================
	// PRIVATE HELPER METHODS
	// ============================================================================

	/**
	 * Cleanup stalled negotiations.
	 * Called periodically by the task scheduler.
	 * @returns A promise that resolves when all stalled negotiations have been removed and their callbacks notified.
	 * @internal
	 */
	private async cleanupStalledNegotiations(): Promise<void> {
		const now = Date.now();
		const stalled: string[] = [];

		for (const [negotiationId, state] of this._policyRequester.getActiveNegotiations()) {
			if (now - state.updatedAt > DataspaceControlPlaneService._STALLED_NEGOTIATION_THRESHOLD_MS) {
				stalled.push(negotiationId);
			}
		}

		for (const negotiationId of stalled) {
			this._policyRequester.removeNegotiation(negotiationId);

			await this._loggingComponent?.log({
				level: "warn",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "stalledNegotiationCleanedUp",
				data: { negotiationId }
			});

			for (const [key, cb] of this._negotiationCallbacks.entries()) {
				try {
					await cb.onFailed(negotiationId, "negotiationStalled");
				} catch (error) {
					await this._loggingComponent?.log({
						level: "error",
						source: DataspaceControlPlaneService.CLASS_NAME,
						ts: Date.now(),
						message: "negotiationCallbackError",
						data: { key, negotiationId, method: "onFailed", error }
					});
				}
			}
		}

		if (Is.arrayValue(stalled)) {
			await this._loggingComponent?.log({
				level: "info",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "stalledNegotiationsCleanupComplete",
				data: { cleanedUp: stalled.length }
			});
		}
	}

	/**
	 * Convert a storage entity to model.
	 * @param storageEntity The entity from storage.
	 * @returns The model representation.
	 * @internal
	 */
	private storageEntityToModel(storageEntity: TransferProcess): ITransferProcess {
		return {
			id: storageEntity.id,
			consumerPid: storageEntity.consumerPid,
			providerPid: storageEntity.providerPid,
			state: storageEntity.state,
			agreementId: storageEntity.agreementId,
			datasetId: storageEntity.datasetId,
			offerId: storageEntity.offerId,
			consumerIdentity: storageEntity.consumerIdentity,
			providerIdentity: storageEntity.providerIdentity,
			format: storageEntity.format,
			callbackAddress: storageEntity.callbackAddress,
			organizationIdentity: storageEntity.organizationIdentity,
			dateCreated: new Date(storageEntity.dateCreated),
			dateModified: new Date(storageEntity.dateModified),
			policies: storageEntity.policies,
			dataAddress: storageEntity.dataAddress
		};
	}

	/**
	 * Convert a model to storage entity.
	 * @param entity The model representation.
	 * @returns The entity for storage.
	 * @internal
	 */
	private modelToStorageEntity(entity: ITransferProcess): TransferProcess {
		return {
			id: entity.id,
			consumerPid: entity.consumerPid,
			providerPid: entity.providerPid,
			state: entity.state,
			agreementId: entity.agreementId,
			datasetId: entity.datasetId,
			offerId: entity.offerId,
			consumerIdentity: entity.consumerIdentity,
			providerIdentity: entity.providerIdentity,
			format: entity.format,
			callbackAddress: entity.callbackAddress,
			organizationIdentity: entity.organizationIdentity,
			dateCreated: entity.dateCreated.toISOString(),
			dateModified: entity.dateModified.toISOString(),
			policies: entity.policies,
			dataAddress: entity.dataAddress
		};
	}

	/**
	 * Look up Agreement from PAP.
	 * @param agreementId Agreement ID.
	 * @returns Agreement.
	 * @internal
	 */
	private async lookupAgreement(agreementId: string): Promise<IDataspaceProtocolAgreement> {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(agreementId), agreementId);

		let agreement;
		try {
			agreement = await this._policyAdministrationPointComponent.getAgreement(agreementId);
		} catch (error) {
			if (BaseError.isErrorName(error, NotFoundError.CLASS_NAME)) {
				throw error;
			}

			throw new GeneralError(
				DataspaceControlPlaneService.CLASS_NAME,
				"agreementLookupFailed",
				{ agreementId },
				error
			);
		}

		return agreement;
	}

	/**
	 * Check whether a transfer format string represents a push-mode delivery.
	 * @param format The transfer format string from the TransferProcess entity.
	 * @returns True if the format is a push variant (HttpData-PUSH or HttpData-POST).
	 * @internal
	 */
	private isPushFormat(format: string | undefined): boolean {
		return (
			format === DataspaceTransferFormat.HttpDataPush ||
			format === DataspaceTransferFormat.HttpDataPost
		);
	}

	/**
	 * Extract the dataset ID from an ODRL agreement's target.
	 * @param agreement The ODRL agreement containing the target.
	 * @returns The dataset ID extracted from the target URN.
	 * @throws GeneralError if the agreement target is missing, has no UID, or has multiple targets.
	 * @internal
	 */
	private extractDatasetId(agreement: IDataspaceProtocolAgreement): string {
		if (Is.empty(agreement.target)) {
			throw new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "agreementMissingTarget", {
				agreementId: OdrlPolicyHelper.getUid(agreement)
			});
		}

		// Top-level target identifies the dataset; rule-level targets are constraint
		// scopes (refinements, JSONPath filters, AssetCollections) and aren't datasets.
		const datasetTargets = OdrlPolicyHelper.getDatasetTargets(agreement);

		if (!Is.arrayValue(datasetTargets)) {
			throw new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "agreementTargetMissingUid", {
				agreementId: OdrlPolicyHelper.getUid(agreement)
			});
		}

		if (datasetTargets.length > 1) {
			throw new GeneralError(
				DataspaceControlPlaneService.CLASS_NAME,
				"agreementMultipleTargetsNotSupported",
				{
					agreementId: OdrlPolicyHelper.getUid(agreement),
					targetCount: datasetTargets.length
				}
			);
		}

		return datasetTargets[0];
	}

	/**
	 * Validate that the dataset exists in the Federated Catalogue.
	 * @param datasetId Dataset identifier extracted from Agreement.
	 * @param agreement The Agreement being validated.
	 * @returns A promise that resolves when the dataset has been confirmed in the catalogue and the offer has been validated.
	 * @internal
	 */
	private async validateCatalogDataset(
		datasetId: string,
		agreement: IDataspaceProtocolAgreement
	): Promise<void> {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(datasetId), datasetId);
		Guards.object<IDataspaceProtocolAgreement>(
			DataspaceControlPlaneService.CLASS_NAME,
			nameof(agreement),
			agreement
		);

		const organizationId = await this.resolveContextOrganizationId();
		const localTrustPayload = await this._trustComponent.generate(
			organizationId,
			this._overrideTrustGeneratorType,
			{}
		);
		const catalogResult = await this._federatedCatalogueComponent.get(datasetId, localTrustPayload);

		if (isCatalogError(catalogResult)) {
			if (isCatalogErrorName(catalogResult, NotFoundError.CLASS_NAME)) {
				throw new NotFoundError(
					DataspaceControlPlaneService.CLASS_NAME,
					"datasetNotInCatalog",
					datasetId,
					{
						datasetId,
						agreementId: OdrlPolicyHelper.getUid(agreement)
					}
				);
			}
			throw new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "catalogLookupFailed", {
				datasetId,
				agreementId: OdrlPolicyHelper.getUid(agreement) ?? "",
				errorCode: catalogResult.code
			});
		}

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "catalogDatasetFound",
			data: {
				datasetId,
				agreementId: OdrlPolicyHelper.getUid(agreement) ?? "",
				datasetTitle: catalogResult["dcterms:title"]
			}
		});

		await this.validateAgreementMatchesOffer(agreement, catalogResult);
	}

	/**
	 * Extract PID from DSP message and lookup Transfer Process with role detection.
	 * @param message DSP protocol message with consumerPid and/or providerPid fields.
	 * @param message.consumerPid The consumer-side PID from the DSP message.
	 * @param message.providerPid The provider-side PID from the DSP message.
	 * @returns Transfer Process entity and our role in this transfer.
	 * @internal
	 */
	private async lookupTransferByMessage(message: {
		consumerPid?: string;
		providerPid?: string;
	}): Promise<{
		entity: ITransferProcess;
		role: TransferProcessRole;
	}> {
		const pid = message.consumerPid ?? message.providerPid;
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, "pid", pid);

		return this.lookupTransferByPid(pid);
	}

	/**
	 * Lookup Transfer Process by PID and determine our role.
	 * @param pid Either consumerPid or providerPid.
	 * @returns Transfer Process entity and our role in this transfer.
	 * @internal
	 */
	private async lookupTransferByPid(pid: string): Promise<{
		entity: ITransferProcess;
		role: TransferProcessRole;
	}> {
		Guards.stringValue(DataspaceControlPlaneService.CLASS_NAME, nameof(pid), pid);

		// Check if pid is a consumerPid (primary key lookup)
		const storageEntity = await this._transferProcessStorage.get(pid);

		if (storageEntity) {
			return {
				entity: this.storageEntityToModel(storageEntity),
				role: TransferProcessRole.Consumer
			};
		}

		// Check if pid is a providerPid (secondary key lookup)
		const providerPidEntity = await this._transferProcessStorage.get(pid, "providerPid");
		if (providerPidEntity) {
			return {
				entity: this.storageEntityToModel(providerPidEntity),
				role: TransferProcessRole.Provider
			};
		}

		throw new NotFoundError(
			DataspaceControlPlaneService.CLASS_NAME,
			"transferProcessNotFound",
			pid,
			{
				pid
			}
		);
	}

	/**
	 * Get raw policy entries from a catalog dataset.
	 * @param catalogDataset Catalog dataset.
	 * @returns Raw policy entries.
	 * @internal
	 */
	private getCatalogDatasetPolicies(
		catalogDataset: IDcatDataset | IDataspaceProtocolDataset
	): JsonLdObjectWithNoContext<IDataspaceProtocolPolicy>[] {
		// Support both "odrl:hasPolicy" and "hasPolicy" to accommodate different catalog implementations
		if (Is.object<IDcatDataset>(catalogDataset) && !Is.empty(catalogDataset["odrl:hasPolicy"])) {
			const items = ArrayHelper.fromObjectOrArray(catalogDataset["odrl:hasPolicy"]) ?? [];
			return items.map(item => ({
				...item,
				"@id": OdrlPolicyHelper.getUid(item) ?? ""
			}));
		}

		if (
			Is.object<IDataspaceProtocolDataset>(catalogDataset) &&
			!Is.empty(catalogDataset.hasPolicy)
		) {
			return ArrayHelper.fromObjectOrArray(catalogDataset.hasPolicy) ?? [];
		}

		return [];
	}

	/**
	 * Validate that the Agreement policies match at least one Catalog Offer.
	 * @param agreement Agreement to validate.
	 * @param catalogDataset Catalog dataset containing Offers.
	 * @returns A promise that resolves when the agreement has been matched against a catalogue offer.
	 * @internal
	 */
	private async validateAgreementMatchesOffer(
		agreement: IDataspaceProtocolAgreement,
		catalogDataset: IDcatDataset
	): Promise<void> {
		Guards.object<IDataspaceProtocolAgreement>(
			DataspaceControlPlaneService.CLASS_NAME,
			nameof(agreement),
			agreement
		);
		Guards.object<IDcatDataset>(
			DataspaceControlPlaneService.CLASS_NAME,
			nameof(catalogDataset),
			catalogDataset
		);

		const datasetId = getJsonLdId(catalogDataset);
		if (!Is.stringValue(datasetId)) {
			throw new NotFoundError(DataspaceControlPlaneService.CLASS_NAME, "catalogDatasetMissingId");
		}
		const rawOffers = this.getCatalogDatasetPolicies(catalogDataset);

		if (!Is.arrayValue(rawOffers)) {
			await this._loggingComponent?.log({
				level: "warn",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "catalogDatasetHasNoOffers",
				data: {
					datasetId: getJsonLdId(catalogDataset) ?? "",
					agreementId: OdrlPolicyHelper.getUid(agreement) ?? ""
				}
			});
			return;
		}

		const catalogOffers = rawOffers.filter(offer => Is.object<IDataspaceProtocolPolicy>(offer));

		if (!Is.arrayValue(catalogOffers)) {
			await this._loggingComponent?.log({
				level: "warn",
				source: DataspaceControlPlaneService.CLASS_NAME,
				ts: Date.now(),
				message: "catalogDatasetHasNoOffers",
				data: {
					datasetId: getJsonLdId(catalogDataset) ?? "",
					agreementId: OdrlPolicyHelper.getUid(agreement) ?? ""
				}
			});
			return;
		}

		const matchingOffer = catalogOffers.find(
			(offer: IDataspaceProtocolPolicy) =>
				OdrlPolicyHelper.getUid(offer) === OdrlPolicyHelper.getUid(agreement) ||
				this.isPolicyDerivedFrom(agreement, offer)
		);

		if (!matchingOffer) {
			throw new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "agreementNotMatchingOffer", {
				agreementId: OdrlPolicyHelper.getUid(agreement) ?? "",
				datasetId: getJsonLdId(catalogDataset) ?? "",
				availableOffers: catalogOffers
					.map((o: IDataspaceProtocolPolicy) => OdrlPolicyHelper.getUid(o) ?? "unknown")
					.join(", ")
			});
		}

		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlaneService.CLASS_NAME,
			ts: Date.now(),
			message: "agreementMatchedOffer",
			data: {
				agreementId: OdrlPolicyHelper.getUid(agreement) ?? "",
				offerId: OdrlPolicyHelper.getUid(matchingOffer) ?? "",
				datasetId
			}
		});
	}

	/**
	 * Check if an Agreement is derived from an Offer.
	 * Per the DS Protocol spec, Offers within a Dataset's hasPolicy array must NOT
	 * include an explicit "target" property — the target is implicitly the Dataset itself.
	 * When the offer has no explicit targets, we use the datasetId as the implicit target
	 * so that the comparison with the agreement's target can succeed.
	 * @param agreement Agreement to check.
	 * @param offer Offer to compare against.
	 * @returns True if Agreement appears derived from Offer.
	 * @see https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1-err1/#lower-level-types
	 * @internal
	 */
	private isPolicyDerivedFrom(
		agreement: IDataspaceProtocolAgreement,
		offer: IDataspaceProtocolPolicy
	): boolean {
		const agreementTargets = OdrlPolicyHelper.getTargets(agreement);
		const offerTargets = OdrlPolicyHelper.getTargets(offer);

		// Per DSP spec, offers in a Dataset's hasPolicy MUST NOT include explicit targets —
		// the target is implicitly the Dataset. When the catalogue offer has no targets,
		// skip the target comparison entirely (the agreement's target is the dataset itself).
		// Only reject if both have explicit targets that don't overlap.
		if (Is.arrayValue(offerTargets) && Is.arrayValue(agreementTargets)) {
			if (
				!agreementTargets.some((agreementTarget: string) => offerTargets.includes(agreementTarget))
			) {
				return false;
			}
		} else if (Is.arrayValue(offerTargets) && !Is.arrayValue(agreementTargets)) {
			// Offer has targets but agreement doesn't — mismatch
			return false;
		}
		// If offer has no targets (catalogue offer), accept any agreement targets
		// since the implicit target is the dataset the offer belongs to

		const agreementAssignerIdentity = OdrlPolicyHelper.extractAssignerIdentity(agreement);
		const offerAssignerIdentity = OdrlPolicyHelper.extractAssignerIdentity(offer);

		const agreementAssigner = ArrayHelper.fromObjectOrArray(agreementAssignerIdentity);
		const offerAssigner = ArrayHelper.fromObjectOrArray(offerAssignerIdentity);

		if (!agreementAssigner.some(assigner => offerAssigner.includes(assigner))) {
			return false;
		}

		if (!Is.array(agreement.permission) || !Is.array(offer.permission)) {
			return false;
		}

		return true;
	}

	/**
	 * Populate the system-controlled fields of a dataset payload.
	 * @param dataset The user-supplied dataset payload.
	 * @returns The populated dataset.
	 * @internal
	 */
	private async populateDefaults(
		dataset: IDataspaceProtocolDataset
	): Promise<IDataspaceProtocolDataset> {
		if (dataset["dcterms:publisher"]) {
			return dataset;
		}

		const contextIds = await ContextIdStore.getContextIds();
		if (contextIds?.[ContextIdKeys.Organization]) {
			return { ...dataset, "dcterms:publisher": contextIds[ContextIdKeys.Organization] };
		}

		return dataset;
	}

	/**
	 * Resolve the data plane component or throw if it isn't registered. Push-mode transfers
	 * require the data plane; pull-only deployments may run without it.
	 * @returns The data plane component.
	 * @throws GeneralError if the data plane component is not registered.
	 * @internal
	 */
	private requireDataPlane(): IDataspaceDataPlaneComponent {
		const dataPlane = ComponentFactory.getIfExists<IDataspaceDataPlaneComponent>(
			this._dataPlaneComponentType
		);
		if (!dataPlane) {
			throw new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "dataPlaneNotRegistered");
		}
		return dataPlane;
	}

	/**
	 * Creates the internal INegotiationCallback that fans out to all registered callbacks.
	 * @returns The internal negotiation callback.
	 * @internal
	 */
	private createInternalCallback(): INegotiationCallback {
		return {
			onStateChanged: async (negotiationId, state, data) => {
				for (const [key, cb] of this._negotiationCallbacks.entries()) {
					try {
						await cb.onStateChanged(negotiationId, state, data);
					} catch (error) {
						await this._loggingComponent?.log({
							level: "error",
							source: DataspaceControlPlaneService.CLASS_NAME,
							ts: Date.now(),
							message: "negotiationCallbackError",
							data: { key, negotiationId, method: "onStateChanged", error }
						});
					}
				}
			},
			onFinalized: async (negotiationId, agreementId) => {
				for (const [key, cb] of this._negotiationCallbacks.entries()) {
					try {
						await cb.onFinalized(negotiationId, agreementId);
					} catch (error) {
						await this._loggingComponent?.log({
							level: "error",
							source: DataspaceControlPlaneService.CLASS_NAME,
							ts: Date.now(),
							message: "negotiationCallbackError",
							data: { key, negotiationId, method: "onCompleted", error }
						});
					}
				}
			},
			onFailed: async (negotiationId, reason) => {
				for (const [key, cb] of this._negotiationCallbacks.entries()) {
					try {
						await cb.onFailed(negotiationId, reason);
					} catch (error) {
						await this._loggingComponent?.log({
							level: "error",
							source: DataspaceControlPlaneService.CLASS_NAME,
							ts: Date.now(),
							message: "negotiationCallbackError",
							data: { key, negotiationId, method: "onFailed", error }
						});
					}
				}
			}
		};
	}

	/**
	 * Creates the internal ITransferCallback that fans out to all registered transfer callbacks.
	 * Errors thrown by individual callbacks are logged and swallowed so they cannot affect
	 * the DSP protocol state machine or other registrants.
	 * @returns The internal transfer callback.
	 * @internal
	 */
	private createInternalTransferCallback(): ITransferCallback {
		return {
			onStateChanged: async (consumerPid, state) => {
				for (const [key, cb] of this._transferCallbacks.entries()) {
					try {
						await cb.onStateChanged(consumerPid, state);
					} catch (error) {
						await this._loggingComponent?.log({
							level: "error",
							source: DataspaceControlPlaneService.CLASS_NAME,
							ts: Date.now(),
							message: "transferCallbackError",
							error: BaseError.fromError(error),
							data: { key, consumerPid, state, method: "onStateChanged" }
						});
					}
				}
			},
			onStarted: async (consumerPid, message) => {
				for (const [key, cb] of this._transferCallbacks.entries()) {
					try {
						await cb.onStarted(consumerPid, message);
					} catch (error) {
						await this._loggingComponent?.log({
							level: "error",
							source: DataspaceControlPlaneService.CLASS_NAME,
							ts: Date.now(),
							message: "transferCallbackError",
							error: BaseError.fromError(error),
							data: { key, consumerPid, method: "onStarted" }
						});
					}
				}
			},
			onCompleted: async consumerPid => {
				for (const [key, cb] of this._transferCallbacks.entries()) {
					try {
						await cb.onCompleted(consumerPid);
					} catch (error) {
						await this._loggingComponent?.log({
							level: "error",
							source: DataspaceControlPlaneService.CLASS_NAME,
							ts: Date.now(),
							message: "transferCallbackError",
							error: BaseError.fromError(error),
							data: { key, consumerPid, method: "onCompleted" }
						});
					}
				}
			},
			onSuspended: async (consumerPid, reason) => {
				for (const [key, cb] of this._transferCallbacks.entries()) {
					try {
						await cb.onSuspended(consumerPid, reason);
					} catch (error) {
						await this._loggingComponent?.log({
							level: "error",
							source: DataspaceControlPlaneService.CLASS_NAME,
							ts: Date.now(),
							message: "transferCallbackError",
							error: BaseError.fromError(error),
							data: { key, consumerPid, method: "onSuspended" }
						});
					}
				}
			},
			onTerminated: async (consumerPid, reason) => {
				for (const [key, cb] of this._transferCallbacks.entries()) {
					try {
						await cb.onTerminated(consumerPid, reason);
					} catch (error) {
						await this._loggingComponent?.log({
							level: "error",
							source: DataspaceControlPlaneService.CLASS_NAME,
							ts: Date.now(),
							message: "transferCallbackError",
							error: BaseError.fromError(error),
							data: { key, consumerPid, method: "onTerminated" }
						});
					}
				}
			}
		};
	}

	/**
	 * Re-stamp `@id` onto a stored payload blob using the entity primary key.
	 * @param payload The stored payload blob (without `@id`).
	 * @param id The entity id (becomes the dataset's `@id`).
	 * @returns The dataset payload with `@id` populated.
	 * @internal
	 */
	private restampDatasetId(
		payload: { [key: string]: unknown },
		id: string
	): IDataspaceProtocolDataset {
		return { ...payload, "@id": id } as IDataspaceProtocolDataset;
	}

	// DATASPACE APP DATASET HANDLERS

	/**
	 * Publish a single dataspace app dataset to the federated catalogue.
	 * @param appDataset The stored dataspace app dataset entity.
	 * @internal
	 */
	private async publishAppDataset(appDataset: DataspaceAppDataset): Promise<void> {
		const localTrustPayload = await this._trustComponent.generate(
			appDataset.organizationIdentity,
			this._overrideTrustGeneratorType
		);

		// Ensure that any dataspace app operations are run with the tenant id
		// of the dataset owner, so that propagates to any operations it performs
		const contextIds = await ContextIdStore.getContextIds();
		const tenantContextIds = { ...contextIds, [ContextIdKeys.Tenant]: appDataset.tenantId };

		await ContextIdStore.run(tenantContextIds, async () => {
			const app = DataspaceAppFactory.get<IDataspaceApp>(appDataset.appId);
			const datasetPayload = this.restampDatasetId(appDataset.dataset, appDataset.id);
			const overrideHandler = app.datasetsHandled?.bind(app);

			const rawDatasets: IDataspaceProtocolDataset[] = overrideHandler
				? await overrideHandler(datasetPayload)
				: [datasetPayload];

			const datasets = await Promise.all(rawDatasets.map(async d => this.populateDefaults(d)));

			for (const dataset of datasets) {
				const publishResult = await this._federatedCatalogueComponent.set(
					dataset as unknown as IDcatDataset,
					localTrustPayload
				);
				if (isCatalogError(publishResult)) {
					throw new GeneralError(DataspaceControlPlaneService.CLASS_NAME, "datasetPublishFailed", {
						datasetId: appDataset.id,
						appId: appDataset.appId,
						tenantId: appDataset.tenantId ?? "",
						catalogErrorCode: publishResult.code
					});
				}
			}
		});
	}

	/**
	 * Resolve the calling organization from the request context.
	 * @returns The owning organization identity.
	 * @internal
	 */
	private async resolveContextOrganizationId(): Promise<string> {
		const contextIds = await ContextIdStore.getContextIds();
		ContextIdHelper.guard(contextIds, ContextIdKeys.Organization);
		return contextIds[ContextIdKeys.Organization];
	}

	/**
	 * Resolve the tenant identity from the current context.
	 * @returns The owning tenant identity.
	 * @internal
	 */
	private async resolveContextTenantId(): Promise<string | undefined> {
		const contextIds = await ContextIdStore.getContextIds();
		return contextIds?.[ContextIdKeys.Tenant];
	}
}
