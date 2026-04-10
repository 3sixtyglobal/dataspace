// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ITenant, ITenantAdminComponent } from "@twin.org/api-models";
import {
	TaskStatus,
	type IBackgroundTask,
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
	type IError,
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
	DataRequestType,
	DataspaceAppFactory,
	DataspaceContexts,
	DataspaceDataTypes,
	DataspaceTypes,
	type IActivityLogDetails,
	type IActivityLogEntry,
	type IActivityLogStatusNotification,
	type IActivityQuery,
	type IDataAssetItemListResult,
	type IDataAssetQuery,
	type IDataRequest,
	type IDataspaceActivity,
	type IDataspaceApp,
	type IDataspaceDataPlaneComponent,
	type IEntitySet,
	type IExecutionPayload,
	type IFilteringQuery,
	type ITaskApp,
	type ITransferContext,
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

		JsonLdDataTypes.registerTypes();
		DataspaceDataTypes.registerTypes();
		SchemaOrgDataTypes.registerRedirects();
		DataspaceProtocolDataTypes.registerRedirects();
		DataspaceProtocolDataTypes.registerTypes();

		this._activityLogStatusCallbacks = {};
		this._partitionContextIds = options?.partitionContextIds;

		this._retainTasksFor =
			DataspaceDataPlaneService._DEFAULT_RETAIN_INTERVAL * DataspaceDataPlaneService._MS_PER_MINUTE;
		this._retainActivityLogsFor =
			DataspaceDataPlaneService._DEFAULT_RETAIN_INTERVAL * DataspaceDataPlaneService._MS_PER_MINUTE;
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
	 * @returns The Activity's Log Entry identifier.
	 */
	public async notifyActivity(activity: IActivityStreamsActivity): Promise<string> {
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
		const existingLogEntry = await this._entityStorageActivityLogs.get(activityLogEntryId);
		let existingSuccessfulApps: string[] = [];
		let isRetry = false;

		if (!Is.undefined(existingLogEntry)) {
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
			const logEntry: IActivityLogDetails = {
				id: activityLogEntryId,
				activityId: Is.string(activity.id) ? activity.id : undefined,
				generator: this.calculateActivityGeneratorIdentity(activity),
				dateCreated: new Date().toISOString(),
				dateModified: new Date().toISOString()
			};
			await this._entityStorageActivityLogs.set(logEntry);
		}

		const activityQuerySet = await this.calculateActivityQuerySet(activity as IDataspaceActivity);

		const tasksScheduled: ITaskApp[] = [];
		const dataspaceAppIds: string[] = [];

		for (const query of activityQuerySet) {
			const appIds = this.getAppForActivityQuery(query);
			for (const appId of appIds) {
				if (!dataspaceAppIds.includes(appId)) {
					dataspaceAppIds.push(appId);
				}
			}
		}

		for (const dataspaceAppId of dataspaceAppIds) {
			// Only process apps that haven't already completed successfully
			if (!existingSuccessfulApps.includes(dataspaceAppId)) {
				const payload: IExecutionPayload = {
					activityLogEntryId,
					activity: activity as IDataspaceActivity,
					executorApp: dataspaceAppId
				};

				const taskType = Converter.bytesToHex(RandomHelper.generate(16));
				const taskId = await this._backgroundTaskComponent.create<IExecutionPayload>(
					taskType,
					payload,
					{
						retainFor: this._retainTasksFor
					}
				);

				await this._backgroundTaskComponent.registerHandler<IExecutionPayload, unknown>(
					taskType,
					"@twin.org/dataspace-app-runner",
					"appRunner",
					async task => {
						await this.finaliseTask(task);
					},
					{
						initialiseMethod: "appRunnerStart",
						shutdownMethod: "appRunnerEnd"
					}
				);

				tasksScheduled.push({
					taskId,
					dataspaceAppId
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
		}

		const existingActivityTasks = isRetry
			? await this._entityStorageActivityTasks.get(activityLogEntryId)
			: undefined;
		const existingTasksToKeep =
			existingActivityTasks?.associatedTasks.filter(t =>
				existingSuccessfulApps.includes(t.dataspaceAppId)
			) ?? [];

		await this._entityStorageActivityTasks.set({
			activityLogEntryId,
			associatedTasks: [...existingTasksToKeep, ...tasksScheduled]
		});

		return activityLogEntryId;
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

		const result = await this._entityStorageActivityLogs.get(logEntryId);
		if (Is.undefined(result)) {
			throw new NotFoundError(
				DataspaceDataPlaneService.CLASS_NAME,
				"activityLogEntryNotFound",
				logEntryId
			);
		}

		let pendingTasks: IActivityLogEntry["pendingTasks"];
		let runningTasks: IActivityLogEntry["runningTasks"];
		let finalizedTasks: IActivityLogEntry["finalizedTasks"];
		let inErrorTasks: IActivityLogEntry["inErrorTasks"];

		// For calculating the processing status. `Registering` if we cannot determine the activity tasks yet
		let status: ActivityProcessingStatus = ActivityProcessingStatus.Registering;

		// Now query the associated tasks
		const activityTasks = await this._entityStorageActivityTasks.get(logEntryId);

		// If activity tasks is undefined it is because the corresponding store has not been persisted yet
		if (!Is.undefined(activityTasks)) {
			pendingTasks = [];
			runningTasks = [];
			finalizedTasks = [];
			inErrorTasks = [];

			for (const entity of activityTasks.associatedTasks) {
				const taskDetails = await this._backgroundTaskComponent.get<IExecutionPayload, unknown>(
					entity.taskId
				);

				if (Is.object(taskDetails)) {
					switch (taskDetails.status) {
						case TaskStatus.Success:
							finalizedTasks.push({
								...entity,
								result: JSON.stringify(taskDetails.result),
								startDate: taskDetails?.dateCreated,
								endDate: taskDetails?.dateCompleted
							});
							break;

						case TaskStatus.Pending:
							pendingTasks.push(entity);
							break;

						case TaskStatus.Processing:
							runningTasks.push({ ...entity, startDate: taskDetails.dateCreated });
							break;

						case TaskStatus.Failed:
							inErrorTasks.push({
								...entity,
								error: taskDetails.error as IError
							});
							break;

						case TaskStatus.Cancelled:
							// Nothing to do for cancelled tasks
							break;
					}
				}
			}
			if (Is.arrayValue(inErrorTasks)) {
				status = ActivityProcessingStatus.Error;
			} else if (Is.arrayValue(runningTasks)) {
				status = ActivityProcessingStatus.Running;
			} else if (Is.arrayValue(pendingTasks)) {
				status = ActivityProcessingStatus.Pending;
			} else {
				status = ActivityProcessingStatus.Completed;
			}
		}
		return { ...result, status, pendingTasks, runningTasks, finalizedTasks, inErrorTasks };
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
		const appId = await this.getAppForDataAssetQuery({ datasetId });

		// getAppForDataAssetQuery already validates app exists
		const app = DataspaceAppFactory.get<IDataspaceApp>(appId);

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
		const appId = await this.getAppForDataAssetQuery({ datasetId });

		const app = DataspaceAppFactory.get<IDataspaceApp>(appId);

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
	 * @param proofEntity The proof entity to process.
	 * @internal
	 */
	private async finaliseTask(task: IBackgroundTask<IExecutionPayload, unknown>): Promise<void> {
		const payload = task.payload;

		if (Is.empty(payload)) {
			return;
		}

		const activityLogEntry = await this._entityStorageActivityLogs.get(payload.activityLogEntryId);
		if (Is.undefined(activityLogEntry)) {
			await this._logging?.log({
				level: "error",
				source: DataspaceDataPlaneService.CLASS_NAME,
				message: "unknownActivityLogEntryId",
				data: {
					activityLogEntryId: payload.activityLogEntryId
				}
			});
		}

		if (task.status === TaskStatus.Success || task.status === TaskStatus.Failed) {
			for (const callback of Object.values(this._activityLogStatusCallbacks)) {
				await callback({
					activityLogEntryId: payload.activityLogEntryId,
					activityId: Is.string(payload.activity.id) ? payload.activity.id : undefined,
					taskProcessingStatus: {
						dataspaceAppId: payload.executorApp,
						taskId: task.id,
						taskStatus: task.status
					}
				});
			}

			// Now let's see if the full activity processing has completed, if so the entry must be marked for retention
			if (this._retainActivityLogsFor !== -1) {
				const entry = await this.getActivityLogEntry(payload.activityLogEntryId);
				if (
					entry.status === ActivityProcessingStatus.Completed ||
					entry.status === ActivityProcessingStatus.Error
				) {
					const retainUntil = Date.now() + this._retainActivityLogsFor;
					await this._entityStorageActivityLogs.set({
						id: entry.id,
						activityId: entry.activityId,
						generator: entry.generator,
						dateCreated: entry.dateCreated,
						dateModified: entry.dateModified,
						retainUntil,
						retryCount: entry.retryCount
					});
				}
			}
		}
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
	private getAppForActivityQuery(activityQuery: IActivityQuery): string[] {
		const matchingElements: string[] = [];
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
					// Avoid duplicates. Only one DS App can be executed per activity
					if (!matchingElements.includes(appId)) {
						matchingElements.push(appId);
					}
				}
			}
		}

		return matchingElements;
	}

	/**
	 * Get a dataset from registered apps by its ID.
	 * @param datasetId The dataset identifier (@id)
	 * @returns The dataset
	 * @throws NotFoundError if no app handles this dataset
	 * @internal
	 */
	private async getDatasetFromApps(datasetId: string): Promise<IDataspaceProtocolDataset> {
		Guards.stringValue(DataspaceDataPlaneService.CLASS_NAME, nameof(datasetId), datasetId);
		const appNames = DataspaceAppFactory.names();

		for (const appId of appNames) {
			const app = DataspaceAppFactory.get<IDataspaceApp>(appId);
			const datasets = await app.datasetsHandled();
			const dataset = datasets.find(d => d["@id"] === datasetId);
			if (dataset) {
				return dataset;
			}
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
	private async getAppForDataAssetQuery(dataAssetQuery: IDataAssetQuery): Promise<string> {
		const matchingElements: string[] = [];
		const appNames = DataspaceAppFactory.names();

		for (const appId of appNames) {
			const app = DataspaceAppFactory.get<IDataspaceApp>(appId);
			const datasets = await app.datasetsHandled();

			for (const dataset of datasets) {
				if (dataset["@id"] === dataAssetQuery.datasetId) {
					matchingElements.push(appId);
				}
			}
		}

		if (matchingElements.length > 1) {
			const error = new ConflictError(
				DataspaceDataPlaneService.CLASS_NAME,
				"tooManyAppsRegistered",
				dataAssetQuery.datasetId,
				matchingElements,
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
		const appsToRetry = existingEntry.inErrorTasks?.map(t => t.dataspaceAppId) ?? [];

		if (!Is.arrayValue(appsToRetry)) {
			throw new NotFoundError(
				DataspaceDataPlaneService.CLASS_NAME,
				"noFailedTasksToRetry",
				activityLogEntryId
			);
		}

		const successfulApps = existingEntry.finalizedTasks?.map(t => t.dataspaceAppId) ?? [];

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
			// Monitoring purposes
			logEntry.retryCount = (logEntry.retryCount ?? 0) + 1;
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
}
