// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ITenant, ITenantAdminComponent } from "@twin.org/api-models";
import {
	TaskStatus,
	type IBackgroundTaskComponent,
	type IScheduledTaskTime,
	type ITaskSchedulerComponent
} from "@twin.org/background-task-models";
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import {
	ArrayHelper,
	BaseError,
	ComponentFactory,
	ConflictError,
	Converter,
	GeneralError,
	GuardError,
	Guards,
	Is,
	JsonHelper,
	NotFoundError,
	RandomHelper,
	UnprocessableError,
	Validation,
	type IValidationFailure
} from "@twin.org/core";
import { Blake2b } from "@twin.org/crypto";
import { DataTypeHelper, JsonSchemaHelper } from "@twin.org/data-core";
import {
	JsonLdDataTypes,
	JsonLdHelper,
	JsonLdProcessor,
	type IJsonLdContextDefinitionElement,
	type IJsonLdNodeObject
} from "@twin.org/data-json-ld";
import {
	ActivityProcessingStatus,
	ActivityTaskStatus,
	DataRequestType,
	DataspaceAppFactory,
	DataspaceContexts,
	DataspaceDataTypes,
	DataspaceTypes,
	type IActivityLogEntry,
	type IActivityLogStatusNotification,
	type IActivityQuery,
	type IActivityTaskEntry,
	type IDataAssetItemListResult,
	type IDataAssetQuery,
	type IDataRequest,
	type IDataspaceActivity,
	type IDataspaceApp,
	type IDataspaceDataPlaneComponent,
	type IEntitySet,
	type IExecutionPayload,
	type IFilteringQuery,
	type ITransferContext,
	type DataspaceAppDataset,
	type TransferProcess
} from "@twin.org/dataspace-models";
import { EngineCoreFactory } from "@twin.org/engine-models";
import { ComparisonOperator, LogicalOperator } from "@twin.org/entity";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@twin.org/entity-storage-models";
import type { ILoggingComponent } from "@twin.org/logging-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import type { IPolicyEnforcementPointComponent } from "@twin.org/rights-management-models";
import {
	DataspaceProtocolDataTypes,
	DataspaceProtocolTransferProcessStateType,
	type IDataspaceProtocolAgreement,
	type IDataspaceProtocolDataset
} from "@twin.org/standards-dataspace-protocol";
import {
	SchemaOrgContexts,
	SchemaOrgDataTypes,
	SchemaOrgTypes
} from "@twin.org/standards-schema-org";
import type { IActivityStreamsActivity } from "@twin.org/standards-w3c-activity-streams";
import { OdrlContexts } from "@twin.org/standards-w3c-odrl";
import { TrustHelper, type ITrustComponent } from "@twin.org/trust-models";
import type { ActivityLogDetails } from "./entities/activityLogDetails.js";
import type { ActivityTask } from "./entities/activityTask.js";
import type { IDataspaceDataPlaneServiceConstructorOptions } from "./models/IDataspaceDataPlaneServiceConstructorOptions.js";

/**
 * Dataspace Data Plane Service.
 */
export class DataspaceDataPlaneService implements IDataspaceDataPlaneComponent {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<DataspaceDataPlaneService>();

	/**
	 * Milliseconds per minute (60 * 1000).
	 * @internal
	 */
	private static readonly _MS_PER_MINUTE: number = 60 * 1000;

	/**
	 * Minutes per day (24 * 60 = 1440).
	 * @internal
	 */
	private static readonly _MINUTES_PER_DAY: number = 24 * 60;

	/**
	 * The default cleanup interval in minutes. (1 hour)
	 * @internal
	 */
	private static readonly _DEFAULT_CLEANUP_INTERVAL: number = 60;

	/**
	 * The default retain interval in minutes. (10 minutes)
	 * @internal
	 */
	private static readonly _DEFAULT_RETAIN_INTERVAL: number = 10;

	/**
	 * Logging service type.
	 * @internal
	 */
	private readonly _loggingComponentType: string;

	/**
	 * Logging service.
	 * @internal
	 */
	private readonly _logging?: ILoggingComponent;

	/**
	 * Storage service for activity logging.
	 * @internal
	 */
	private readonly _entityStorageActivityLogs: IEntityStorageConnector<ActivityLogDetails>;

	/**
	 * Storage service for activity tasks.
	 * @internal
	 */
	private readonly _entityStorageActivityTasks: IEntityStorageConnector<ActivityTask>;

	/**
	 * Background Task Component.
	 * @internal
	 */
	private readonly _backgroundTaskComponent: IBackgroundTaskComponent;

	/**
	 * Activity Log Status callbacks.
	 * @internal
	 */
	private readonly _activityLogStatusCallbacks: {
		[key: string]: (notification: IActivityLogStatusNotification) => Promise<void>;
	};

	/**
	 * Track task handler registrations to avoid resetting worker pools on every task.
	 * @internal
	 */
	private readonly _registeredTaskTypes: string[];

	/**
	 * Task retention. -1 retain forever.
	 * @internal
	 */
	private readonly _retainTasksFor: number;

	/**
	 * Activity Log Entry retention. -1 retain forever.
	 * @internal
	 */
	private readonly _retainActivityLogsFor: number;

	/**
	 * Retry count for failed tasks.
	 * @internal
	 */
	private readonly _retryCount?: number;

	/**
	 * Clean up interval for activity logs.
	 * @internal
	 */
	private readonly _activityLogCleanUpInterval: number;

	/**
	 * Whether there is an ongoing clean up process.
	 * @internal
	 */
	private _cleanUpProcessOngoing: boolean;

	/**
	 * The task scheduler used to clean up activity logs.
	 * @internal
	 */
	private readonly _taskScheduler: ITaskSchedulerComponent;

	/**
	 * The keys to use from the context ids to create partitions.
	 * @internal
	 */
	private readonly _partitionContextIds?: string[];

	/**
	 * The trust component.
	 * @internal
	 */
	private readonly _trustComponent: ITrustComponent;

	/**
	 * The policy enforcement point for ODRL policy enforcement.
	 * @internal
	 */
	private readonly _policyEnforcementPoint?: IPolicyEnforcementPointComponent;

	/**
	 * The tenant admin component.
	 * @internal
	 */
	private readonly _tenantAdmin?: ITenantAdminComponent;

	/**
	 * Entity storage for Transfer Process entities.
	 * Used to read transfer state from shared storage (written by Control Plane).
	 * @internal
	 */
	private readonly _transferProcessStorage: IEntityStorageConnector<TransferProcess>;

	/**
	 * Entity storage for tenant-supplied Dataspace App Dataset entities.
	 * @internal
	 */
	private readonly _dataspaceAppDatasetStorage: IEntityStorageConnector<DataspaceAppDataset>;

	/**
	 * Create a new instance of DataspaceDataPlane.
	 * @param options The options for the data plane.
	 */
	constructor(options?: IDataspaceDataPlaneServiceConstructorOptions) {
		this._loggingComponentType = options?.loggingComponentType ?? "logging";
		this._logging = ComponentFactory.getIfExists<ILoggingComponent>(this._loggingComponentType);

		this._entityStorageActivityLogs = EntityStorageConnectorFactory.get<
			IEntityStorageConnector<ActivityLogDetails>
		>(options?.activityLogEntityStorageType ?? nameofKebabCase<ActivityLogDetails>());

		this._entityStorageActivityTasks = EntityStorageConnectorFactory.get<
			IEntityStorageConnector<ActivityTask>
		>(options?.activityTaskEntityStorageType ?? nameofKebabCase<ActivityTask>());

		this._backgroundTaskComponent = ComponentFactory.get(
			options?.backgroundTaskComponentType ?? "background-task"
		);

		this._taskScheduler = ComponentFactory.get<ITaskSchedulerComponent>(
			options?.taskSchedulerComponentType ?? "task-scheduler"
		);

		this._trustComponent = ComponentFactory.get<ITrustComponent>(
			options?.trustComponentType ?? "trust"
		);

		this._policyEnforcementPoint = ComponentFactory.getIfExists<IPolicyEnforcementPointComponent>(
			options?.pepComponentType ?? "policy-enforcement-point-service"
		);

		this._tenantAdmin = ComponentFactory.getIfExists<ITenantAdminComponent>(
			options?.tenantAdminType ?? "tenant-admin"
		);

		// Entity storage for Transfer Process state lookup
		// Used to read transfer state from shared storage (written by Control Plane)
		this._transferProcessStorage = EntityStorageConnectorFactory.get<
			IEntityStorageConnector<TransferProcess>
		>(options?.transferProcessEntityStorageType ?? nameofKebabCase<TransferProcess>());

		this._dataspaceAppDatasetStorage = EntityStorageConnectorFactory.get<
			IEntityStorageConnector<DataspaceAppDataset>
		>(options?.dataspaceAppDatasetEntityStorageType ?? nameofKebabCase<DataspaceAppDataset>());

		JsonLdDataTypes.registerTypes();
		DataspaceDataTypes.registerTypes();
		SchemaOrgDataTypes.registerRedirects();
		DataspaceProtocolDataTypes.registerRedirects();
		DataspaceProtocolDataTypes.registerTypes();

		this._activityLogStatusCallbacks = {};
		this._registeredTaskTypes = [];
		this._partitionContextIds = options?.partitionContextIds;

		this._retainTasksFor =
			DataspaceDataPlaneService._DEFAULT_RETAIN_INTERVAL * DataspaceDataPlaneService._MS_PER_MINUTE;
		this._retainActivityLogsFor =
			DataspaceDataPlaneService._DEFAULT_RETAIN_INTERVAL * DataspaceDataPlaneService._MS_PER_MINUTE;
		this._retryCount = options?.config?.retryCount;
		this._activityLogCleanUpInterval = DataspaceDataPlaneService._DEFAULT_CLEANUP_INTERVAL;
		this._cleanUpProcessOngoing = false;

		const validationErrors: IValidationFailure[] = [];
		if (!Is.empty(options?.config?.retainActivityLogsFor)) {
			Guards.integer(
				DataspaceDataPlaneService.CLASS_NAME,
				nameof(options.config.retainActivityLogsFor),
				options.config.retainActivityLogsFor
			);

			if (options.config.retainActivityLogsFor === -1) {
				this._retainTasksFor = -1;
				this._retainActivityLogsFor = -1;
			} else {
				Validation.integer(
					nameof(options.config.retainActivityLogsFor),
					options.config.retainActivityLogsFor,
					validationErrors,
					undefined,
					{ minValue: 1 }
				);
				// Retention of internal tasks launched
				// 5 minutes of margin with respect to the Activity Log Entry to ensure proper removal
				this._retainTasksFor =
					(options.config.retainActivityLogsFor + 5) * DataspaceDataPlaneService._MS_PER_MINUTE;
				this._retainActivityLogsFor =
					options.config.retainActivityLogsFor * DataspaceDataPlaneService._MS_PER_MINUTE;
			}
		}

		if (!Is.empty(options?.config?.activityLogsCleanUpInterval)) {
			Guards.integer(
				DataspaceDataPlaneService.CLASS_NAME,
				nameof(options.config.activityLogsCleanUpInterval),
				options.config.activityLogsCleanUpInterval
			);
			Validation.integer(
				nameof(options.config.activityLogsCleanUpInterval),
				options.config.activityLogsCleanUpInterval,
				validationErrors,
				undefined,
				{ minValue: 1 }
			);
			this._activityLogCleanUpInterval = options.config.activityLogsCleanUpInterval;
		}
		Validation.asValidationError(
			DataspaceDataPlaneService.CLASS_NAME,
			nameof(options?.config),
			validationErrors
		);
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return DataspaceDataPlaneService.CLASS_NAME;
	}

	/**
	 * The service needs to be started when the application is initialized.
	 * @param nodeLoggingComponentType The node logging component type.
	 */
	public async start(nodeLoggingComponentType?: string): Promise<void> {
		const engine = EngineCoreFactory.getIfExists("engine");
		if (Is.empty(engine) || engine.isClone()) {
			await this._logging?.log({
				level: "debug",
				source: DataspaceDataPlaneService.CLASS_NAME,
				message: "engineCloneStart"
			});
			return;
		}

		// Only we have a task scheduler if there is a retention different than -1
		if (this._retainActivityLogsFor !== -1) {
			const taskTime: IScheduledTaskTime[] = [
				{
					nextTriggerTime: Date.now() + 5000,
					...this.calculateCleaningTaskSchedule(this._activityLogCleanUpInterval)
				}
			];

			await this._taskScheduler.addTask("dataspace-cleanup", taskTime, async () => {
				await this._logging?.log({
					level: "debug",
					source: DataspaceDataPlaneService.CLASS_NAME,
					message: "scheduledCleanUpTask"
				});

				await this.cleanupActivityLog();
			});

			await this._logging?.log({
				level: "debug",
				source: DataspaceDataPlaneService.CLASS_NAME,
				message: "taskSchedulerStarted",
				data: {
					taskTime
				}
			});
		}
	}

	/**
	 * Notify an Activity.
	 * @param activity The Activity notified.
	 * @returns The activity's id or entry.
	 */
	public async notifyActivity(
		activity: IActivityStreamsActivity
	): Promise<string | IActivityLogEntry> {
		Guards.object<IActivityStreamsActivity>(
			DataspaceDataPlaneService.CLASS_NAME,
			nameof(activity),
			activity
		);

		await this._logging?.log({
			level: "debug",
			source: DataspaceDataPlaneService.CLASS_NAME,
			message: "newActivity",
			data: {
				activityType: activity.type,
				generator: this.calculateActivityGeneratorIdentity(activity)
			}
		});

		// We only validate that the activity conforms to Activity Streams Schema without entering into details
		// about the object, target or actor as they might be subject of custom validation rules
		const typeId = `${DataspaceContexts.JsonSchemaNamespace}Dataspace${DataspaceTypes.Activity}`;
		const activitySchema = await DataTypeHelper.getSchemaForType(typeId);
		if (Is.undefined(activitySchema)) {
			throw new GeneralError(DataspaceDataPlaneService.CLASS_NAME, "schemaNotFound", {
				schemaId: typeId
			});
		}
		const validationFailures = await JsonSchemaHelper.validate(activitySchema, activity);
		Validation.asValidationError(
			DataspaceDataPlaneService.CLASS_NAME,
			nameof(activity),
			validationFailures
		);

		// Calculate Activity Log Entry Id
		const canonical = JsonHelper.canonicalize(activity);
		const canonicalBytes = Converter.utf8ToBytes(canonical);
		const activityLogId = Converter.bytesToHex(Blake2b.sum256(canonicalBytes));
		const activityLogEntryId = `urn:x-activity-log:${activityLogId}`;

		// Check if entry already exists
		let logEntry = await this._entityStorageActivityLogs.get(activityLogEntryId);
		let existingSuccessfulApps: string[] = [];
		let isRetry = false;
		const now = Date.now();

		if (!Is.undefined(logEntry)) {
			// Check if there are failed tasks that can be retried
			const existingEntry = await this.getActivityLogEntry(activityLogEntryId);

			// If all tasks completed successfully, this is a duplicate
			if (existingEntry.status === ActivityProcessingStatus.Completed) {
				throw new ConflictError(
					DataspaceDataPlaneService.CLASS_NAME,
					"activityAlreadyNotified",
					activityLogEntryId
				);
			}

			// If still processing then reject to avoid race conditions
			if (
				existingEntry.status === ActivityProcessingStatus.Pending ||
				existingEntry.status === ActivityProcessingStatus.Running ||
				existingEntry.status === ActivityProcessingStatus.Registering
			) {
				throw new ConflictError(
					DataspaceDataPlaneService.CLASS_NAME,
					"activityStillProcessing",
					activityLogEntryId
				);
			}

			// Status is Error - prepare for retry
			existingSuccessfulApps = await this.prepareForRetry(activityLogEntryId, existingEntry);
			isRetry = true;
		} else {
			logEntry = {
				id: activityLogEntryId,
				activityId: activity.id,
				generator: this.calculateActivityGeneratorIdentity(activity),
				dateCreated: new Date(now).toISOString(),
				dateModified: new Date(now).toISOString()
			};
			await this._entityStorageActivityLogs.set(logEntry);
		}

		const activityQuerySet = await this.calculateActivityQuerySet(activity as IDataspaceActivity);

		const taskEntries: IActivityTaskEntry[] = [];
		const handlerApps: {
			[id: string]: {
				app: IDataspaceApp;
				processingGroupId?: string;
			};
		} = {};

		for (const query of activityQuerySet) {
			const apps = this.getAppForActivityQuery(query);
			for (const appId in apps) {
				// Only process apps that haven't already completed successfully
				if (!handlerApps[appId] && !existingSuccessfulApps.includes(appId)) {
					handlerApps[appId] = apps[appId];
				}
			}
		}

		let inlineCount = 0;
		for (const handlerAppId in handlerApps) {
			if (
				await this.processTask(
					activityLogEntryId,
					activity,
					handlerApps,
					handlerAppId,
					taskEntries,
					isRetry
				)
			) {
				inlineCount++;
			}
		}

		const existingActivityTasks = isRetry
			? await this._entityStorageActivityTasks.get(activityLogEntryId)
			: undefined;
		const existingTasksToKeep =
			existingActivityTasks?.associatedTasks.filter(t =>
				existingSuccessfulApps.includes(t.dataspaceAppId)
			) ?? [];

		const activityTask: ActivityTask = {
			activityLogEntryId,
			associatedTasks: [...existingTasksToKeep, ...taskEntries]
		};

		await this._entityStorageActivityTasks.set(activityTask);

		if (inlineCount === taskEntries.length) {
			return this.finaliseActivityLogEntry(activityLogEntryId);
		}

		return activityTask.activityLogEntryId;
	}

	/**
	 * Subscribes to the activity log.
	 * @param callback The callback to be called when Activity Log is called.
	 * @param subscriptionId The Subscription Id.
	 * @returns The subscription Id.
	 */
	public async subscribeToActivityLog(
		callback: (notification: IActivityLogStatusNotification) => Promise<void>,
		subscriptionId?: string
	): Promise<string> {
		Guards.function(DataspaceDataPlaneService.CLASS_NAME, nameof(callback), callback);

		const theSubscriptionId = Is.stringValue(subscriptionId)
			? subscriptionId
			: Converter.bytesToHex(RandomHelper.generate(16));
		this._activityLogStatusCallbacks[theSubscriptionId] = callback;

		return theSubscriptionId;
	}

	/**
	 * Subscribes to the activity log.
	 * @param subscriptionId The Subscription Id.
	 */
	public async unSubscribeToActivityLog(subscriptionId: string): Promise<void> {
		Guards.stringValue(
			DataspaceDataPlaneService.CLASS_NAME,
			nameof(subscriptionId),
			subscriptionId
		);
		delete this._activityLogStatusCallbacks[subscriptionId];
	}

	/**
	 * Returns the activity processing details of an activity.
	 * @param logEntryId The Id of the Activity Log Entry (a URI).
	 * @returns the Activity Log Entry with the processing details.
	 * @throws NotFoundError if activity log entry is not known.
	 */
	public async getActivityLogEntry(logEntryId: string): Promise<IActivityLogEntry> {
		Guards.stringValue(DataspaceDataPlaneService.CLASS_NAME, nameof(logEntryId), logEntryId);

		const activityLog = await this._entityStorageActivityLogs.get(logEntryId);
		if (Is.undefined(activityLog)) {
			throw new NotFoundError(
				DataspaceDataPlaneService.CLASS_NAME,
				"activityLogEntryNotFound",
				logEntryId
			);
		}

		const activityTasks = await this._entityStorageActivityTasks.get(logEntryId);

		return this.constructLogEntry(activityLog, activityTasks);
	}

	/**
	 * Get Data Asset entities. Allows to retrieve entities by their type or id.
	 * @param entitySet The set of entities to be retrieved.
	 * @param entitySet.jsonLdContext The JSON-LD Context to be used to expand the referred entityType.
	 * @param consumerPid The consumer Process ID from the DSP Transfer Process.
	 * Used to resolve datasetId from the Transfer Process.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @param trustPayload Trust payload to verify the requesters identity.
	 * @returns The entities requested as a JSON-LD Document.
	 */
	public async getDataAssetEntities(
		entitySet: IEntitySet & {
			jsonLdContext?: IJsonLdContextDefinitionElement[];
		},
		consumerPid: string,
		cursor?: string,
		limit?: number,
		trustPayload?: unknown
	): Promise<IDataAssetItemListResult> {
		Guards.object<IEntitySet>(DataspaceDataPlaneService.CLASS_NAME, nameof(entitySet), entitySet);
		Guards.string(
			DataspaceDataPlaneService.CLASS_NAME,
			nameof(entitySet.entityType),
			entitySet.entityType
		);
		Guards.stringValue(DataspaceDataPlaneService.CLASS_NAME, nameof(consumerPid), consumerPid);

		const trustInfo = await TrustHelper.verifyTrust(
			this._trustComponent,
			trustPayload,
			"getDataAssetEntities"
		);

		const dataConsumerIdentity = trustInfo.identity;
		Guards.stringValue(
			DataspaceDataPlaneService.CLASS_NAME,
			nameof(dataConsumerIdentity),
			dataConsumerIdentity
		);

		// Use consumerPid to resolve datasetId via Transfer Process
		// This validates the transfer token, state, and extracts datasetId
		const transferContext = await this.validateTransfer(consumerPid, trustPayload);
		const resolvedDatasetId = transferContext.datasetId;

		const serviceDataset = await this.getDatasetFromApps(resolvedDatasetId);

		// Expand entity type if LD context provided
		let finalType: string | undefined = entitySet.entityType;
		if (!Is.undefined(entitySet.jsonLdContext)) {
			const auxiliaryObj = {
				"@context": entitySet.jsonLdContext,
				"@type": entitySet.entityType
			};
			const expanded = (await JsonLdProcessor.expand(auxiliaryObj))[0];
			finalType = expanded["@type"]?.[0];
		}

		if (Is.undefined(finalType)) {
			throw new GuardError(
				DataspaceDataPlaneService.CLASS_NAME,
				"notExpandableType",
				nameof(entitySet.entityType),
				entitySet.entityType
			);
		}

		const datasetId = serviceDataset["@id"];
		Guards.stringValue(DataspaceDataPlaneService.CLASS_NAME, nameof(datasetId), datasetId);
		const app = await this.getAppForDataAssetQuery({ datasetId });

		const handleDataRequest = app.handleDataRequest?.bind(app);
		Guards.function(
			DataspaceDataPlaneService.CLASS_NAME,
			nameof(handleDataRequest),
			handleDataRequest
		);

		const dataRequest: IDataRequest = {
			type: DataRequestType.DataAssetEntities,
			dataAsset: serviceDataset,
			entitySet: {
				entityType: finalType,
				entityId: entitySet.entityId
			}
		};

		const { data, cursor: cursorResult } = await handleDataRequest(dataRequest, cursor, limit);

		let finalData: IJsonLdNodeObject[];
		if (Is.array(data)) {
			finalData = data;
		} else {
			finalData = [data as IJsonLdNodeObject];
		}

		const itemList = {
			"@context": SchemaOrgContexts.Context,
			type: SchemaOrgTypes.ItemList,
			itemListElement: finalData
		};

		let result: IDataAssetItemListResult = {
			itemList,
			cursor: cursorResult
		};

		// Apply policy filters from Agreement
		if (transferContext?.agreement) {
			const filtered = await this.applyPolicyFilters(result, transferContext.agreement);
			if (filtered.itemList) {
				result = filtered;
			} else {
				result.itemList[SchemaOrgTypes.ItemListElement] = [];
			}
		}

		return result;
	}

	/**
	 * Queries a data asset controlled by this Dataspace App.
	 * @param consumerPid The consumer Process ID from the DSP Transfer Process.
	 * Used to resolve datasetId from the Transfer Process.
	 * @param query The filtering query.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @param trustPayload Trust payload to verify the requesters identity.
	 * @returns The item list and optional cursor for pagination via Link headers.
	 */
	public async queryDataAsset(
		consumerPid: string,
		query: IFilteringQuery,
		cursor?: string,
		limit?: number,
		trustPayload?: unknown
	): Promise<IDataAssetItemListResult> {
		Guards.stringValue(DataspaceDataPlaneService.CLASS_NAME, nameof(consumerPid), consumerPid);
		Guards.object(DataspaceDataPlaneService.CLASS_NAME, nameof(query), query);
		Guards.string(DataspaceDataPlaneService.CLASS_NAME, nameof(query.type), query.type);

		const trustInfo = await TrustHelper.verifyTrust(
			this._trustComponent,
			trustPayload,
			"queryDataAsset"
		);

		const dataConsumerIdentity = trustInfo.identity;
		Guards.stringValue(
			DataspaceDataPlaneService.CLASS_NAME,
			nameof(dataConsumerIdentity),
			dataConsumerIdentity
		);

		// Use consumerPid to resolve datasetId via Transfer Process
		// This validates the transfer token, state, and extracts datasetId
		const transferContext = await this.validateTransfer(consumerPid, trustPayload);
		const resolvedDatasetId = transferContext.datasetId;

		const serviceDataset = await this.getDatasetFromApps(resolvedDatasetId);

		const datasetId = serviceDataset["@id"];
		Guards.stringValue(DataspaceDataPlaneService.CLASS_NAME, nameof(datasetId), datasetId);
		const app = await this.getAppForDataAssetQuery({ datasetId });

		if (!app.supportedQueryTypes().includes(query.type)) {
			throw new UnprocessableError(DataspaceDataPlaneService.CLASS_NAME, "queryTypeNotSupported", {
				queryType: query.type
			});
		}

		const dataRequest: IDataRequest = {
			type: DataRequestType.QueryDataAsset,
			dataAsset: serviceDataset,
			query
		};

		const handleDataRequest = app.handleDataRequest?.bind(app);
		Guards.function(
			DataspaceDataPlaneService.CLASS_NAME,
			nameof(handleDataRequest),
			handleDataRequest
		);

		const { data, cursor: cursorResult } = await handleDataRequest(dataRequest, cursor, limit);

		let finalData: IJsonLdNodeObject[];
		if (Is.array(data)) {
			finalData = data;
		} else {
			finalData = [data as IJsonLdNodeObject];
		}

		const itemList = {
			"@context": SchemaOrgContexts.Context,
			type: SchemaOrgTypes.ItemList,
			itemListElement: finalData
		};

		let result: IDataAssetItemListResult = {
			itemList,
			cursor: cursorResult
		};

		// Apply policy filters from Agreement if using consumerPid flow
		if (transferContext?.agreement) {
			const filtered = await this.applyPolicyFilters(result, transferContext.agreement);
			if (filtered.itemList) {
				result = filtered;
			} else {
				result.itemList[SchemaOrgTypes.ItemListElement] = [];
			}
		}

		return result;
	}

	/**
	 * Validate transfer authorization for data requests.
	 * Reads directly from shared TransferProcess entity storage.
	 * @param consumerPid The consumer process ID from the transfer request.
	 * @param trustPayload The trust payload for verification (validates signature and expiry).
	 * @returns The transfer context containing datasetId, agreement, and other transfer details.
	 * @throws GeneralError if transfer process storage is not configured.
	 * @throws NotFoundError if transfer process is not found.
	 * @throws UnauthorizedError if trust verification fails.
	 * @throws GeneralError if transfer is not in STARTED state.
	 */
	public async validateTransfer(
		consumerPid: string,
		trustPayload: unknown
	): Promise<ITransferContext> {
		Guards.stringValue(DataspaceDataPlaneService.CLASS_NAME, nameof(consumerPid), consumerPid);

		// Verify trust payload (validates JWT signature, expiry, and returns verification info)
		// The trust verifier handles all token validation including expiry
		await TrustHelper.verifyTrust(this._trustComponent, trustPayload, "validateTransfer");

		// Direct lookup from shared entity storage by consumerPid (which is the primary key)
		const transferProcess = await this._transferProcessStorage.get(consumerPid);

		if (!transferProcess) {
			throw new NotFoundError(
				DataspaceDataPlaneService.CLASS_NAME,
				"transferProcessNotFound",
				consumerPid
			);
		}

		// Validate state: must be STARTED
		if (transferProcess.state !== DataspaceProtocolTransferProcessStateType.STARTED) {
			throw new GeneralError(DataspaceDataPlaneService.CLASS_NAME, "transferNotInStartedState", {
				currentState: transferProcess.state
			});
		}

		// Validate datasetId is present
		if (!Is.stringValue(transferProcess.datasetId)) {
			throw new GeneralError(DataspaceDataPlaneService.CLASS_NAME, "transferMissingDatasetId");
		}

		return this.buildTransferContext(transferProcess);
	}

	// ============================================================================
	// PRIVATE HELPER METHODS
	// ============================================================================

	/**
	 * Calculates the activity generator from the generator or actor fields.
	 * @param activity The activity.
	 * @returns The generator's identity.
	 * @throws General Error if no identity is found.
	 * @internal
	 */
	private calculateActivityGeneratorIdentity(activity: IActivityStreamsActivity): string {
		if (Is.stringValue(activity.generator)) {
			return activity.generator;
		}

		if (Is.object<IJsonLdNodeObject>(activity.generator) && Is.stringValue(activity.generator.id)) {
			return activity.generator.id;
		}

		if (Is.stringValue(activity.actor)) {
			return activity.actor;
		}

		if (Is.object<IJsonLdNodeObject>(activity.actor) && Is.stringValue(activity.actor.id)) {
			return activity.actor.id;
		}

		throw new GuardError(
			DataspaceDataPlaneService.CLASS_NAME,
			"invalidActivityGeneratorIdentity",
			nameof(activity.generator),
			{
				generator: activity.generator,
				actor: activity.actor
			}
		);
	}

	/**
	 * Process activity task finalization.
	 * @param taskId The Id of the Activity Log Entry.
	 * @param status The final status of the task.
	 * @param payload The execution payload of the task, required to correlate to the Activity Log Entry and update the processing status.
	 * @internal
	 */
	private async finaliseBackgroundTask(
		taskId: string,
		status: TaskStatus,
		payload?: IExecutionPayload
	): Promise<void> {
		if (Is.empty(payload)) {
			return;
		}

		if (status === TaskStatus.Success || status === TaskStatus.Failed) {
			await this.notifyTaskStatusChanged(
				payload.activityLogEntryId,
				payload.activity.id,
				payload.dataspaceAppId,
				taskId,
				status
			);

			await this.finaliseActivityLogEntry(payload.activityLogEntryId);
		}
	}

	/**
	 * Notify registered callbacks about a task status change.
	 * @param activityLogEntryId The Id of the Activity Log Entry.
	 * @param activityId The Id of the Activity.
	 * @param dataspaceAppId The Id of the Dataspace App associated with the task.
	 * @param taskId The Id of the task.
	 * @param taskStatus The new status of the task.
	 * @internal
	 */
	private async notifyTaskStatusChanged(
		activityLogEntryId: string,
		activityId: string | undefined,
		dataspaceAppId: string,
		taskId: string,
		taskStatus: TaskStatus
	): Promise<void> {
		for (const callback of Object.values(this._activityLogStatusCallbacks)) {
			await callback({
				activityLogEntryId,
				activityId,
				taskProcessingStatus: {
					dataspaceAppId,
					taskId,
					taskStatus
				}
			});
		}
	}

	/**
	 * Finalizes the Activity Log Entry by checking if all associated tasks have completed and, if so, updating the entry to be retained for the configured retention period.
	 * @param activityLogEntryId The Id of the Activity Log Entry to finalize.
	 * @returns The Activity Log Entry with updated retention details if applicable.
	 * @internal
	 */
	private async finaliseActivityLogEntry(activityLogEntryId: string): Promise<IActivityLogEntry> {
		const entry = await this.getActivityLogEntry(activityLogEntryId);
		if (
			this._retainActivityLogsFor !== -1 &&
			(entry.status === ActivityProcessingStatus.Completed ||
				entry.status === ActivityProcessingStatus.Error)
		) {
			const retainUntil = Date.now() + this._retainActivityLogsFor;
			const updatedEntry: ActivityLogDetails = {
				id: entry.id,
				activityId: entry.activityId,
				generator: entry.generator,
				dateCreated: entry.dateCreated,
				dateModified: entry.dateModified,
				retainUntil
			};
			await this._entityStorageActivityLogs.set(updatedEntry);
		}

		return entry;
	}

	/**
	 * Cleans up the activity log by deleting those entries that no longer shall be retained.
	 * @internal
	 */
	private async cleanupActivityLog(): Promise<void> {
		if (this._cleanUpProcessOngoing) {
			await this._logging?.log({
				level: "debug",
				message: "cleanUpOngoing",
				source: DataspaceDataPlaneService.CLASS_NAME
			});
			return;
		}
		this._cleanUpProcessOngoing = true;

		let numRecordsDeleted = 0;

		if (this._partitionContextIds?.includes(ContextIdKeys.Tenant)) {
			// The cleanup must be done by tenant as the data is partitioned
			try {
				let cursor;
				do {
					const result: { tenants: ITenant[]; cursor?: string } | undefined =
						await this._tenantAdmin?.query(undefined, cursor);
					cursor = result?.cursor;
					if (!Is.empty(result)) {
						for (const tenantId of result.tenants.map(t => t.id)) {
							const localContextIds = (await ContextIdStore.getContextIds()) ?? {};
							localContextIds[ContextIdKeys.Tenant] = tenantId;

							await ContextIdStore.run(localContextIds, async () => {
								numRecordsDeleted += await this.cleanupActivityLogPartition();
							});
						}
					}
				} while (Is.stringValue(cursor));
			} catch (error) {
				await this._logging?.log({
					level: "error",
					message: "cleanupFailed",
					ts: Date.now(),
					source: DataspaceDataPlaneService.CLASS_NAME,
					error: BaseError.fromError(error)
				});
			}
		} else {
			numRecordsDeleted += await this.cleanupActivityLogPartition();
		}

		await this._logging?.log({
			level: "debug",
			message: "activityLogCleanedUp",
			source: DataspaceDataPlaneService.CLASS_NAME,
			data: {
				numRecordsDeleted
			}
		});

		this._cleanUpProcessOngoing = false;
	}

	/**
	 * Cleans up the activity log partition for the current context ids.
	 * @returns The number of records deleted in this partition.
	 * @internal
	 */
	private async cleanupActivityLogPartition(): Promise<number> {
		let numRecordsDeleted = 0;

		try {
			let cursor: string | undefined;
			const now = Date.now();

			do {
				const result = await this._entityStorageActivityLogs.query({
					conditions: [
						{
							property: "retainUntil",
							value: 0,
							comparison: ComparisonOperator.GreaterThan
						},
						{
							property: "retainUntil",
							value: now,
							comparison: ComparisonOperator.LessThan
						}
					],
					logicalOperator: LogicalOperator.And
				});
				cursor = result.cursor;

				for (const entity of result.entities) {
					const logEntryDetails = await this.getActivityLogEntry(entity.id as string);
					if (
						logEntryDetails.status === ActivityProcessingStatus.Completed ||
						logEntryDetails.status === ActivityProcessingStatus.Error
					) {
						await this._entityStorageActivityLogs.remove(entity.id as string);
						await this._entityStorageActivityTasks.remove(entity.id as string);
						numRecordsDeleted++;
					}
				}
			} while (Is.stringValue(cursor));
		} catch (error) {
			await this._logging?.log({
				level: "error",
				message: "cleanupFailed",
				source: DataspaceDataPlaneService.CLASS_NAME,
				error: BaseError.fromError(error)
			});
		}
		return numRecordsDeleted;
	}

	/**
	 * Calculates the (Activity, Object, Target) query set.
	 * @param activity The object representing the Activity.
	 * @returns the (Activity, Object, Target) query set.
	 * @internal
	 */
	private async calculateActivityQuerySet(activity: IDataspaceActivity): Promise<IActivityQuery[]> {
		const activityTypes = await JsonLdHelper.getType(activity);
		let objectTypes: string[] = [];

		const objects = ArrayHelper.fromObjectOrArray<IJsonLdNodeObject>(activity.object);
		for (const object of objects) {
			objectTypes = objectTypes.concat(await JsonLdHelper.getType(object));
		}

		let targetTypes: string[] = [""];
		if (Is.object<IJsonLdNodeObject>(activity.target)) {
			targetTypes = await JsonLdHelper.getType(activity.target);
		}

		const result: IActivityQuery[] = [];

		for (const activityType of activityTypes) {
			for (const objectType of objectTypes) {
				for (const targetType of targetTypes) {
					const query: IActivityQuery = {
						activityType,
						objectType,
						targetType: !Is.stringValue(targetType) ? undefined : targetType
					};

					result.push(query);
				}
			}
		}

		return result;
	}

	/**
	 * Calculates the cleaning task schedule.
	 * @param minutes The period in minutes.
	 * @returns The cleaning task schedule.
	 * @internal
	 */
	private calculateCleaningTaskSchedule(minutes: number): IScheduledTaskTime {
		let minutesRemain = minutes;

		const days = Math.floor(minutesRemain / DataspaceDataPlaneService._MINUTES_PER_DAY);
		minutesRemain %= DataspaceDataPlaneService._MINUTES_PER_DAY;

		const hours = Math.floor(minutesRemain / 60);
		minutesRemain %= 60;

		return { intervalDays: days, intervalHours: hours, intervalMinutes: minutesRemain };
	}

	/**
	 * Returns an App for a (Activity, Object, Target).
	 * @param activityQuery The (Activity, Object, Target) query specified using a FQN.
	 * @returns The Dataspace Data Plane Apps or empty list if nothing is registered.
	 * @internal
	 */
	private getAppForActivityQuery(activityQuery: IActivityQuery): {
		[id: string]: {
			app: IDataspaceApp;
			processingGroupId?: string;
		};
	} {
		const matchingElements: {
			[id: string]: {
				app: IDataspaceApp;
				processingGroupId?: string;
			};
		} = {};
		const appNames = DataspaceAppFactory.names();

		for (const appId of appNames) {
			const app = DataspaceAppFactory.get<IDataspaceApp>(appId);
			const appQueries = app.activitiesHandled();

			for (const appQuery of appQueries) {
				if (
					appQuery.objectType === activityQuery.objectType &&
					(Is.undefined(appQuery.activityType) ||
						appQuery.activityType === activityQuery.activityType) &&
					(Is.undefined(appQuery.targetType) || appQuery.targetType === activityQuery.targetType)
				) {
					matchingElements[appId] = {
						app,
						processingGroupId: appQuery.processingGroupId
					};
				}
			}
		}

		return matchingElements;
	}

	/**
	 * Get a dataset by its ID. Resolves via the tenant-supplied dataspace app
	 * datasets stored by the Control Plane.
	 * @param datasetId The dataset identifier (@id)
	 * @returns The dataset
	 * @throws NotFoundError if no app handles this dataset
	 * @internal
	 */
	private async getDatasetFromApps(datasetId: string): Promise<IDataspaceProtocolDataset> {
		Guards.stringValue(DataspaceDataPlaneService.CLASS_NAME, nameof(datasetId), datasetId);

		const fromAppDataset = await this._dataspaceAppDatasetStorage.get(datasetId);
		if (!Is.empty(fromAppDataset)) {
			return {
				...fromAppDataset.dataset,
				"@id": datasetId
			} as unknown as IDataspaceProtocolDataset;
		}

		throw new NotFoundError(DataspaceDataPlaneService.CLASS_NAME, "noAppRegistered", datasetId, {
			datasetId
		});
	}

	/**
	 * Returns an App for a Data Asset query (datasetId, ...).
	 * @param dataAssetQuery The data asset query.
	 * @returns The Dataspace Data Plane App ID.
	 * @internal
	 */
	private async getAppForDataAssetQuery(dataAssetQuery: IDataAssetQuery): Promise<IDataspaceApp> {
		const matchingElements: IDataspaceApp[] = [];
		const matchingIds: string[] = [];

		// Storage primary key is the dataset's @id, so a single get() resolves it.
		const fromAppDataset = await this._dataspaceAppDatasetStorage.get(dataAssetQuery.datasetId);
		if (!Is.empty(fromAppDataset)) {
			const app = DataspaceAppFactory.get<IDataspaceApp>(fromAppDataset.appId);
			matchingElements.push(app);
			matchingIds.push(fromAppDataset.appId);
		}

		if (matchingElements.length > 1) {
			const error = new ConflictError(
				DataspaceDataPlaneService.CLASS_NAME,
				"tooManyAppsRegistered",
				dataAssetQuery.datasetId,
				matchingIds,
				{
					datasetId: dataAssetQuery.datasetId
				}
			);
			await this._logging?.log({
				source: DataspaceDataPlaneService.CLASS_NAME,
				level: "error",
				message: "tooManyAppsRegistered",
				error,
				data: {
					datasetId: dataAssetQuery.datasetId
				}
			});
			throw error;
		}

		if (!Is.arrayValue(matchingElements)) {
			const error = new NotFoundError(
				DataspaceDataPlaneService.CLASS_NAME,
				"noAppRegistered",
				dataAssetQuery.datasetId,
				{
					datasetId: dataAssetQuery.datasetId
				}
			);
			await this._logging?.log({
				source: DataspaceDataPlaneService.CLASS_NAME,
				level: "error",
				message: "noAppRegistered",
				error,
				data: {
					datasetId: dataAssetQuery.datasetId
				}
			});
			throw error;
		}

		return matchingElements[0];
	}

	/**
	 * Prepare an activity for retry by updating metadata and returning apps to skip.
	 * @param activityLogEntryId The activity log entry ID.
	 * @param existingEntry The existing activity log entry with error status.
	 * @returns Array of app IDs that already succeeded and should be skipped.
	 * @internal
	 */
	private async prepareForRetry(
		activityLogEntryId: string,
		existingEntry: IActivityLogEntry
	): Promise<string[]> {
		const appsToRetry =
			existingEntry.tasks
				?.filter(t => t.status === ActivityTaskStatus.Failed)
				.map(t => t.dataspaceAppId) ?? [];

		if (!Is.arrayValue(appsToRetry)) {
			throw new NotFoundError(
				DataspaceDataPlaneService.CLASS_NAME,
				"noFailedTasksToRetry",
				activityLogEntryId
			);
		}

		const successfulApps =
			existingEntry.tasks
				?.filter(t => t.status === ActivityTaskStatus.Success)
				.map(t => t.dataspaceAppId) ?? [];

		await this._logging?.log({
			level: "debug",
			source: DataspaceDataPlaneService.CLASS_NAME,
			message: "replacingFailedTasks",
			data: {
				activityLogEntryId,
				appsToRetry,
				successfulApps
			}
		});

		const logEntry = await this._entityStorageActivityLogs.get(activityLogEntryId);
		if (logEntry) {
			logEntry.dateModified = new Date().toISOString();
			// Extend retention to allow retry to complete
			if (this._retainActivityLogsFor !== -1) {
				logEntry.retainUntil = Date.now() + this._retainActivityLogsFor;
			}
			await this._entityStorageActivityLogs.set(logEntry);
		}

		return successfulApps;
	}

	/**
	 * Build transfer context from a TransferProcessEntity.
	 * @param transferProcess The transfer process entity.
	 * @returns The transfer context for use by data access methods.
	 * @internal
	 */
	private buildTransferContext(transferProcess: TransferProcess): ITransferContext {
		// Build the IDataspaceProtocolAgreement from stored data
		// The entity stores agreementId and policies separately
		//
		// NOTE: Currently policies are cached in the TransferProcessEntity at transfer start time.
		// Eventually, this should fetch fresh policies from Rights Management (PAP) using:
		//   const freshAgreement = await this._policyAdministrationPoint.get(transferProcess.agreementId);
		// This would ensure policies are always up-to-date and support dynamic policy updates.
		const agreement: IDataspaceProtocolAgreement = {
			"@context": OdrlContexts.Context,
			"@type": "Agreement",
			"@id": transferProcess.agreementId,
			target: transferProcess.datasetId,
			// Provider is the assigner, consumer is the assignee
			assigner: transferProcess.providerIdentity ?? "",
			assignee: transferProcess.consumerIdentity ?? ""
		};

		// Extract policies from the stored Agreement
		// Extract permission, prohibition, and obligation
		if (Is.arrayValue(transferProcess.policies)) {
			const storedAgreement = transferProcess.policies[0] as
				| IDataspaceProtocolAgreement
				| undefined;
			if (storedAgreement) {
				agreement.permission = storedAgreement.permission;
				agreement.prohibition = storedAgreement.prohibition;
				agreement.obligation = storedAgreement.obligation;
			}
		}

		const state = transferProcess.state;
		const dataAddress = transferProcess.dataAddress;

		return {
			consumerPid: transferProcess.consumerPid,
			providerPid: transferProcess.providerPid,
			agreement,
			datasetId: transferProcess.datasetId,
			offerId: transferProcess.offerId,
			state,
			consumerIdentity: transferProcess.consumerIdentity,
			providerIdentity: transferProcess.providerIdentity,
			dataAddress
		};
	}

	/**
	 * Apply ODRL policy enforcement to query results.
	 * Delegates to the Policy Enforcement Point (PEP) which coordinates
	 * PDP, arbiters, and enforcement processors.
	 * @param result The data asset item list result to filter.
	 * @param agreement The ODRL Agreement containing policies.
	 * @returns The result with policies applied.
	 * @internal
	 */
	private async applyPolicyFilters(
		result: IDataAssetItemListResult,
		agreement?: IDataspaceProtocolAgreement
	): Promise<IDataAssetItemListResult> {
		if (!agreement || !this._policyEnforcementPoint) {
			return result;
		}

		const processed =
			await this._policyEnforcementPoint.interceptWithPolicy<IDataAssetItemListResult>(
				agreement,
				result
			);

		if (Is.arrayValue(agreement.obligation)) {
			await this.logObligations(agreement.obligation, agreement["@id"]);
		}

		return processed;
	}

	/**
	 * Log ODRL obligations for auditing purposes.
	 * Obligations are duties that must be fulfilled as part of the agreement.
	 * @param obligations The obligation rules from the Agreement.
	 * @param agreementId The agreement ID for reference.
	 * @internal
	 */
	private async logObligations(
		obligations: IDataspaceProtocolAgreement["obligation"],
		agreementId: string
	): Promise<void> {
		if (!Is.arrayValue(obligations)) {
			return;
		}

		for (const obligation of obligations) {
			await this._logging?.log({
				level: "info",
				source: DataspaceDataPlaneService.CLASS_NAME,
				message: "policyObligationTriggered",
				data: {
					agreementId,
					action: obligation.action,
					target: obligation.target,
					assignee: obligation.assignee
				}
			});
		}
	}

	/**
	 * Processes a task for an activity, by creating a background task and registering the handler.
	 * @param activityLogEntryId The ID of the activity log entry.
	 * @param activity The activity to be processed.
	 * @param handlerApps The handler applications for the activity.
	 * @param dataspaceAppId The ID of the handler application.
	 * @param taskEntries The list of activity log entries.
	 * @param isRetry Indicates if this is a retry of a previous task.
	 * @returns True if the task was processed inline.
	 * @internal
	 */
	private async processTask(
		activityLogEntryId: string,
		activity: IActivityStreamsActivity,
		handlerApps: { [id: string]: { app: IDataspaceApp; processingGroupId?: string } },
		dataspaceAppId: string,
		taskEntries: IActivityTaskEntry[],
		isRetry: boolean
	): Promise<boolean> {
		const handlerApp = handlerApps[dataspaceAppId].app;
		const processingGroupId = handlerApps[dataspaceAppId].processingGroupId;

		const payload: IExecutionPayload = {
			activityLogEntryId,
			activity: activity as IDataspaceActivity,
			dataspaceAppId
		};

		// If there is no processing group we execute the task inline without creating a background task
		const isInlineTask = !Is.stringValue(processingGroupId);
		if (isInlineTask) {
			const handleActivity = handlerApp?.handleActivity?.bind(handlerApp);
			if (!Is.function(handleActivity)) {
				throw new GeneralError(DataspaceDataPlaneService.CLASS_NAME, "missingHandleActivity", {
					dataspaceAppId
				});
			}
			let taskError;
			let taskResult;
			try {
				taskResult = await handleActivity(activity as IDataspaceActivity);
			} catch (error) {
				taskError = BaseError.fromError(error);
			}

			const now = Date.now();
			const taskEntry: IActivityTaskEntry = {
				taskId: RandomHelper.generateUuidV7("compact"),
				dataspaceAppId,
				processingGroupId,
				result: taskResult,
				startDate: new Date(now).toISOString(),
				endDate: new Date(now).toISOString(),
				status: Is.empty(taskError) ? ActivityTaskStatus.Success : ActivityTaskStatus.Failed,
				error: taskError?.toJsonObject()
			};
			taskEntries.push(taskEntry);

			await this.notifyTaskStatusChanged(
				payload.activityLogEntryId,
				payload.activity.id,
				payload.dataspaceAppId,
				taskEntry.taskId,
				taskEntry.status
			);
		} else {
			const processingGroups = handlerApp.processingGroups?.() ?? {};
			if (Is.empty(processingGroups[processingGroupId])) {
				throw new GeneralError(DataspaceDataPlaneService.CLASS_NAME, "invalidProcessingGroupId", {
					processingGroupId
				});
			}

			const processingGroupOptions = processingGroups[processingGroupId];

			const taskType = `${dataspaceAppId}${processingGroupId ? `-${processingGroupId}` : ""}`;

			const taskId = await this._backgroundTaskComponent.create<IExecutionPayload>(
				taskType,
				payload,
				{
					retainFor: this._retainTasksFor,
					retryCount: processingGroupOptions?.retryCount ?? this._retryCount
				}
			);

			if (!this._registeredTaskTypes.includes(taskType)) {
				this._registeredTaskTypes.push(taskType);

				await this._backgroundTaskComponent.registerHandler<IExecutionPayload, unknown>(
					taskType,
					"@twin.org/dataspace-app-runner",
					"appRunner",
					async task => {
						await this.finaliseBackgroundTask(task.id, task.status, task.payload);
					},
					{
						maxWorkerCount: processingGroupOptions?.concurrentTasks,
						idleShutdownTimeout: processingGroupOptions?.idleShutdownTimeout,
						initialiseMethod: "appRunnerStart",
						shutdownMethod: "appRunnerEnd"
					}
				);
			}

			taskEntries.push({
				taskId,
				dataspaceAppId,
				processingGroupId,
				status: ActivityTaskStatus.Pending
			});

			await this._logging?.log({
				level: "info",
				source: DataspaceDataPlaneService.CLASS_NAME,
				message: "scheduledTask",
				data: {
					taskId,
					dataspaceAppId,
					isRetry
				}
			});
		}

		return isInlineTask;
	}

	/**
	 * Constructs the activity log entry with processing status and associated tasks.
	 * @param activityLog The activity log details retrieved from storage.
	 * @param activityTasks The activity tasks associated with the log entry, if any.
	 * @returns The complete activity log entry with status and tasks.
	 * @internal
	 */
	private async constructLogEntry(
		activityLog: ActivityLogDetails,
		activityTasks: ActivityTask | undefined
	): Promise<IActivityLogEntry> {
		let tasks: IActivityTaskEntry[] | undefined;

		// For calculating the processing status. `Registering` if we cannot determine the activity tasks yet
		let status: ActivityProcessingStatus = ActivityProcessingStatus.Registering;

		// Now query the associated tasks
		// If activity tasks is undefined it is because the corresponding store has not been persisted yet
		if (!Is.undefined(activityTasks)) {
			tasks = [];

			const typeCount: {
				[status in TaskStatus]: number;
			} = {
				[TaskStatus.Pending]: 0,
				[TaskStatus.Processing]: 0,
				[TaskStatus.Success]: 0,
				[TaskStatus.Failed]: 0,
				[TaskStatus.Cancelled]: 0
			};

			for (const entity of activityTasks.associatedTasks) {
				let entry: IActivityTaskEntry | undefined;
				if (!Is.stringValue(entity.processingGroupId)) {
					// If there is no process group, the task was processed inline so the task status is already available in the entity
					typeCount[entity.status]++;
					entry = entity;
				} else {
					const taskDetails = await this._backgroundTaskComponent.get<IExecutionPayload, unknown>(
						entity.taskId
					);
					if (!Is.empty(taskDetails)) {
						typeCount[taskDetails.status]++;

						switch (taskDetails.status) {
							case TaskStatus.Success:
								entry = {
									...entity,
									status: ActivityTaskStatus.Success,
									result: taskDetails.result,
									startDate: taskDetails?.dateCreated,
									endDate: taskDetails?.dateCompleted
								};
								break;

							case TaskStatus.Pending:
								entry = { ...entity, status: ActivityTaskStatus.Pending };
								break;

							case TaskStatus.Processing:
								entry = {
									...entity,
									status: ActivityTaskStatus.Processing,
									startDate: taskDetails.dateCreated
								};
								break;

							case TaskStatus.Failed:
								entry = {
									...entity,
									status: ActivityTaskStatus.Failed,
									error: taskDetails.error
								};
								break;

							case TaskStatus.Cancelled:
								// Nothing to do for cancelled tasks
								break;
						}
					}
				}

				if (!Is.empty(entry)) {
					tasks.push(entry);
				}
			}
			if (typeCount[TaskStatus.Failed] > 0) {
				status = ActivityProcessingStatus.Error;
			} else if (typeCount[TaskStatus.Processing] > 0) {
				status = ActivityProcessingStatus.Running;
			} else if (typeCount[TaskStatus.Pending] > 0) {
				status = ActivityProcessingStatus.Pending;
			} else {
				status = ActivityProcessingStatus.Completed;
			}
		}
		return { ...activityLog, status, tasks };
	}
}
