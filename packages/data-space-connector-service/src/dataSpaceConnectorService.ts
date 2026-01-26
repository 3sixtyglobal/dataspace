// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
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
	ComponentFactory,
	ConflictError,
	Converter,
	GuardError,
	Guards,
	Is,
	NotFoundError,
	RandomHelper,
	UnprocessableError,
	Validation,
	type IError,
	type IValidationFailure
} from "@twin.org/core";
import { Blake2b } from "@twin.org/crypto";
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
	DataSpaceConnectorAppFactory,
	type IActivityLogDetails,
	type IActivityLogEntry,
	type IActivityLogStatusNotification,
	type IActivityQuery,
	type IDataAssetDescription,
	type IDataAssetItemListResult,
	type IDataAssetQuery,
	type IDataRequest,
	type IDataSpaceConnector,
	type IDataSpaceConnectorApp,
	type IEntitySet,
	type IExecutionPayload,
	type IFilteringQuery,
	type ITaskApp
} from "@twin.org/data-space-connector-models";
import { EngineCoreFactory } from "@twin.org/engine-models";
import { ComparisonOperator, LogicalOperator } from "@twin.org/entity";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@twin.org/entity-storage-models";
import type { ILoggingComponent } from "@twin.org/logging-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import {
	DataspaceProtocolDataTypes,
	type IDataspaceProtocolDataset
} from "@twin.org/standards-dataspace-protocol";
import {
	SchemaOrgContexts,
	SchemaOrgDataTypes,
	SchemaOrgTypes
} from "@twin.org/standards-schema-org";
import {
	ActivityStreamsDataTypes,
	type IActivityStreamsActivity
} from "@twin.org/standards-w3c-activity-streams";
import { type ITrustComponent, TrustHelper } from "@twin.org/trust-models";
import type { ActivityLogDetails } from "./entities/activityLogDetails.js";
import type { ActivityTask } from "./entities/activityTask.js";
import type { IDataSpaceConnectorServiceConstructorOptions } from "./models/IDataSpaceConnectorServiceConstructorOptions.js";

/**
 * Data Space Connector Service.
 */
export class DataSpaceConnectorService implements IDataSpaceConnector {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<DataSpaceConnectorService>();

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
	private readonly _loggingService?: ILoggingComponent;

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
	 * The list of active tenants required for task cleanup.
	 * @internal
	 */
	private readonly _activeTenants: string[];

	/**
	 * Create a new instance of DataSpaceConnector.
	 * @param options The options for the connector.
	 */
	constructor(options?: IDataSpaceConnectorServiceConstructorOptions) {
		this._loggingComponentType = options?.loggingComponentType ?? "logging";
		this._loggingService = ComponentFactory.getIfExists<ILoggingComponent>(
			this._loggingComponentType
		);

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

		JsonLdDataTypes.registerTypes();
		ActivityStreamsDataTypes.registerTypes();
		SchemaOrgDataTypes.registerRedirects();
		DataspaceProtocolDataTypes.registerRedirects();
		DataspaceProtocolDataTypes.registerTypes();

		this._activityLogStatusCallbacks = {};
		this._activeTenants = [];
		this._partitionContextIds = options?.partitionContextIds;

		this._retainTasksFor = DataSpaceConnectorService._DEFAULT_RETAIN_INTERVAL * 60 * 1000;
		this._retainActivityLogsFor = DataSpaceConnectorService._DEFAULT_RETAIN_INTERVAL * 60 * 1000;
		this._activityLogCleanUpInterval = DataSpaceConnectorService._DEFAULT_CLEANUP_INTERVAL;
		this._cleanUpProcessOngoing = false;

		const validationErrors: IValidationFailure[] = [];
		if (!Is.empty(options?.config?.retainActivityLogsFor)) {
			Guards.integer(
				DataSpaceConnectorService.CLASS_NAME,
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
				// Retention of internal tasks launched (it has to be expressed in milliseconds)
				// 5 minutes of margin with respect to the Activity Log Entry to ensure proper removal
				this._retainTasksFor = (options.config.retainActivityLogsFor + 5) * 60 * 1000;
				this._retainActivityLogsFor = options.config.retainActivityLogsFor * 60 * 1000;
			}
		}

		if (!Is.empty(options?.config?.activityLogsCleanUpInterval)) {
			Guards.integer(
				DataSpaceConnectorService.CLASS_NAME,
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
			DataSpaceConnectorService.CLASS_NAME,
			nameof(options?.config),
			validationErrors
		);
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return DataSpaceConnectorService.CLASS_NAME;
	}

	/**
	 * The service needs to be started when the application is initialized.
	 * @param nodeLoggingComponentType The node logging component type.
	 */
	public async start(nodeLoggingComponentType?: string): Promise<void> {
		const engine = EngineCoreFactory.getIfExists("engine");
		if (Is.empty(engine) || engine.isClone()) {
			await this._loggingService?.log({
				level: "debug",
				source: DataSpaceConnectorService.CLASS_NAME,
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

			await this._taskScheduler.addTask("data-space-connector-cleanup", taskTime, async () => {
				await this._loggingService?.log({
					level: "debug",
					source: DataSpaceConnectorService.CLASS_NAME,
					message: "scheduledCleanUpTask"
				});

				await this.cleanupActivityLog();
			});

			await this._loggingService?.log({
				level: "debug",
				source: DataSpaceConnectorService.CLASS_NAME,
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
			DataSpaceConnectorService.CLASS_NAME,
			nameof(activity),
			activity
		);

		await this.updateActiveTenants();

		await this._loggingService?.log({
			level: "debug",
			source: DataSpaceConnectorService.CLASS_NAME,
			message: "newActivity",
			data: {
				activityType: activity.type,
				generator: this.calculateActivityGeneratorIdentity(activity)
			}
		});

		// Validate that the Activity notified is encoded using the representation format expected by the Connector
		const validationFailures: IValidationFailure[] = [];
		await JsonLdHelper.validate(activity, validationFailures, { failOnMissingType: true });
		Validation.asValidationError(
			DataSpaceConnectorService.CLASS_NAME,
			nameof(activity),
			validationFailures
		);

		// Avoid using terms not defined in any Ld Context
		const compactedObj = await JsonLdProcessor.compact(activity, activity["@context"]);

		// Calculate Activity Log Entry Id
		const canonical = await JsonLdProcessor.canonize(compactedObj);
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
					DataSpaceConnectorService.CLASS_NAME,
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
					DataSpaceConnectorService.CLASS_NAME,
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

		const activityQuerySet = await this.calculateActivityQuerySet(compactedObj);

		const tasksScheduled: ITaskApp[] = [];
		for (const query of activityQuerySet) {
			const dataSpaceConnectorAppIds = this.getAppForActivityQuery(query);

			for (const dataSpaceConnectorAppId of dataSpaceConnectorAppIds) {
				// Only process apps that haven't already completed successfully
				if (!existingSuccessfulApps.includes(dataSpaceConnectorAppId)) {
					const payload: IExecutionPayload = {
						activityLogEntryId,
						activity: compactedObj,
						executorApp: dataSpaceConnectorAppId
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
						"@twin.org/data-space-connector-app-runner",
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
						dataSpaceConnectorAppId
					});

					await this._loggingService?.log({
						level: "info",
						source: DataSpaceConnectorService.CLASS_NAME,
						message: "scheduledTask",
						data: {
							taskId,
							dataSpaceConnectorAppId,
							isRetry
						}
					});
				}
			}
		}

		const existingActivityTasks = isRetry
			? await this._entityStorageActivityTasks.get(activityLogEntryId)
			: undefined;
		const existingTasksToKeep =
			existingActivityTasks?.associatedTasks.filter(t =>
				existingSuccessfulApps.includes(t.dataSpaceConnectorAppId)
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
		Guards.function(DataSpaceConnectorService.CLASS_NAME, nameof(callback), callback);

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
			DataSpaceConnectorService.CLASS_NAME,
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
		Guards.stringValue(DataSpaceConnectorService.CLASS_NAME, nameof(logEntryId), logEntryId);

		const result = await this._entityStorageActivityLogs.get(logEntryId);
		if (Is.undefined(result)) {
			throw new NotFoundError(
				DataSpaceConnectorService.CLASS_NAME,
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
			if (inErrorTasks.length > 0) {
				status = ActivityProcessingStatus.Error;
			} else if (runningTasks.length > 0) {
				status = ActivityProcessingStatus.Running;
			} else if (pendingTasks.length > 0) {
				status = ActivityProcessingStatus.Pending;
			} else {
				status = ActivityProcessingStatus.Completed;
			}
		}
		return { ...result, status, pendingTasks, runningTasks, finalizedTasks, inErrorTasks };
	}

	/**
	 * Get Data Asset entities. Allows to retrieve entities by their type or id.
	 * @param dataAsset The data asset being referred. It can be left empty and let the system to locate a proper one.
	 * @param entitySet The set of entities to be retrieved.
	 * @param entitySet.jsonLdContext The JSON-LD Context to be used to expand the referred entityType.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @param trustPayload Trust payload to verify the requesters identity.
	 * @returns The entities requested as a JSON-LD Document.
	 */
	public async getDataAssetEntities(
		dataAsset: IDataAssetDescription,
		entitySet: IEntitySet & {
			jsonLdContext?: IJsonLdContextDefinitionElement[];
		},
		cursor?: string,
		limit?: number,
		trustPayload?: unknown
	): Promise<IDataAssetItemListResult> {
		Guards.object<IDataAssetDescription>(
			DataSpaceConnectorService.CLASS_NAME,
			nameof(dataAsset),
			dataAsset
		);
		Guards.object<IEntitySet>(DataSpaceConnectorService.CLASS_NAME, nameof(entitySet), entitySet);
		Guards.string(
			DataSpaceConnectorService.CLASS_NAME,
			nameof(entitySet.entityType),
			entitySet.entityType
		);

		const trustInfo = await TrustHelper.verifyTrust(
			this._trustComponent,
			trustPayload,
			"getDataAssetEntities"
		);

		const dataConsumerIdentity = trustInfo.identity;
		Guards.stringValue(
			DataSpaceConnectorService.CLASS_NAME,
			nameof(dataConsumerIdentity),
			dataConsumerIdentity
		);

		// Require dataset ID to be provided
		if (!Is.array(dataAsset.dataSetId) || dataAsset.dataSetId.length === 0) {
			throw new GuardError(
				DataSpaceConnectorService.CLASS_NAME,
				"datasetIdRequired",
				nameof(dataAsset.dataSetId),
				dataAsset.dataSetId
			);
		}

		const serviceDataset = this.getDatasetFromApps(dataAsset.dataSetId[0]);

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
				DataSpaceConnectorService.CLASS_NAME,
				"notExpandableType",
				nameof(entitySet.entityType),
				entitySet.entityType
			);
		}

		const datasetId = serviceDataset["@id"];
		Guards.stringValue(DataSpaceConnectorService.CLASS_NAME, nameof(datasetId), datasetId);
		const appId = await this.getAppForDataAssetQuery({ datasetId });

		// getAppForDataAssetQuery already validates app exists
		const app = DataSpaceConnectorAppFactory.get<IDataSpaceConnectorApp>(appId);

		const handleDataRequest = app.handleDataRequest?.bind(app);
		Guards.function(
			DataSpaceConnectorService.CLASS_NAME,
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

		return {
			itemList,
			cursor: cursorResult
		};
	}

	/**
	 * Queries a data asset controlled by this DS Connector App.
	 * @param dataAsset The data asset being referred.
	 * @param query The filtering query.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @param trustPayload Trust payload to verify the requesters identity.
	 * @returns The item list and optional cursor for pagination via Link headers.
	 */
	public async queryDataAsset(
		dataAsset: IDataAssetDescription,
		query: IFilteringQuery,
		cursor?: string,
		limit?: number,
		trustPayload?: unknown
	): Promise<IDataAssetItemListResult> {
		Guards.object<IDataAssetDescription>(
			DataSpaceConnectorService.CLASS_NAME,
			nameof(dataAsset),
			dataAsset
		);
		Guards.object(DataSpaceConnectorService.CLASS_NAME, nameof(query), query);
		Guards.string(DataSpaceConnectorService.CLASS_NAME, nameof(query.type), query.type);

		const trustInfo = await TrustHelper.verifyTrust(
			this._trustComponent,
			trustPayload,
			"queryDataAsset"
		);

		const dataConsumerIdentity = trustInfo.identity;
		Guards.stringValue(
			DataSpaceConnectorService.CLASS_NAME,
			nameof(dataConsumerIdentity),
			dataConsumerIdentity
		);

		// Require dataset ID to be provided
		if (!Is.array(dataAsset.dataSetId) || dataAsset.dataSetId.length === 0) {
			throw new GuardError(
				DataSpaceConnectorService.CLASS_NAME,
				"datasetIdRequired",
				nameof(dataAsset.dataSetId),
				dataAsset.dataSetId
			);
		}

		const serviceDataset = this.getDatasetFromApps(dataAsset.dataSetId[0]);

		const datasetId = serviceDataset["@id"];
		Guards.stringValue(DataSpaceConnectorService.CLASS_NAME, nameof(datasetId), datasetId);
		const appId = await this.getAppForDataAssetQuery({ datasetId });

		const app = DataSpaceConnectorAppFactory.get<IDataSpaceConnectorApp>(appId);

		if (!app.supportedQueryTypes().includes(query.type)) {
			throw new UnprocessableError(DataSpaceConnectorService.CLASS_NAME, "queryTypeNotSupported", {
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
			DataSpaceConnectorService.CLASS_NAME,
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

		return {
			itemList,
			cursor: cursorResult
		};
	}

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
			DataSpaceConnectorService.CLASS_NAME,
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
			await this._loggingService?.log({
				level: "error",
				source: DataSpaceConnectorService.CLASS_NAME,
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
						dataSpaceConnectorAppId: payload.executorApp,
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
	 * Updates the list of active tenants for cleanup tasks.
	 * @internal
	 */
	private async updateActiveTenants(): Promise<void> {
		const contextIds = await ContextIdStore.getContextIds();
		const tenantId = contextIds?.[ContextIdKeys.Tenant];
		if (Is.stringValue(tenantId) && !this._activeTenants.includes(tenantId)) {
			this._activeTenants.push(tenantId);
		}
	}

	/**
	 * Cleans up the activity log by deleting those entries that no longer shall be retained.
	 * @internal
	 */
	private async cleanupActivityLog(): Promise<void> {
		if (this._cleanUpProcessOngoing) {
			await this._loggingService?.log({
				level: "debug",
				message: "cleanUpOngoing",
				source: DataSpaceConnectorService.CLASS_NAME
			});
			return;
		}
		this._cleanUpProcessOngoing = true;

		let numRecordsDeleted = 0;

		if (this._partitionContextIds?.includes(ContextIdKeys.Tenant)) {
			// The cleanup must be done tenant by tenant
			// as the data behind the scenes might be partitioned
			for (const tenantId of this._activeTenants) {
				const localContextIds = (await ContextIdStore.getContextIds()) ?? {};
				localContextIds[ContextIdKeys.Tenant] = tenantId;

				await ContextIdStore.run(localContextIds, async () => {
					numRecordsDeleted += await this.cleanupActivityLogPartition();
				});
			}
		} else {
			numRecordsDeleted += await this.cleanupActivityLogPartition();
		}

		await this._loggingService?.log({
			level: "debug",
			message: "activityLogCleanedUp",
			source: DataSpaceConnectorService.CLASS_NAME,
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
		} catch {
			// If cleaning up the retained items fail we don't really care, they will get cleaned up on the next sweep.
		}
		return numRecordsDeleted;
	}

	/**
	 * Calculates the (Activity, Object, Target) query set.
	 * @param compactedObj The compactObj representing the Activity.
	 * @returns the (Activity, Object, Target) query set.
	 * @internal
	 */
	private async calculateActivityQuerySet(
		compactedObj: IActivityStreamsActivity
	): Promise<IActivityQuery[]> {
		const expanded = await JsonLdProcessor.expand({
			"@context": compactedObj["@context"],
			"@type": compactedObj.type
		});
		const expandedDoc = expanded[0];
		const activityTypes = expandedDoc["@type"];
		if (!Is.arrayValue<string[]>(activityTypes)) {
			throw new GuardError(
				DataSpaceConnectorService.CLASS_NAME,
				"invalidActivity",
				nameof(compactedObj.type),
				compactedObj.type
			);
		}

		const objects = ArrayHelper.fromObjectOrArray(compactedObj?.object);
		if (Is.arrayValue(objects)) {
			for (const obj of objects) {
				if (Is.object(obj) && Is.empty(obj["@context"])) {
					obj["@context"] = compactedObj["@context"];
				}
			}
		}

		const objectExpanded = await JsonLdProcessor.expand(compactedObj.object);
		const objectTypes = objectExpanded[0]["@type"];
		if (!Is.arrayValue<string[]>(objectTypes)) {
			throw new GuardError(
				DataSpaceConnectorService.CLASS_NAME,
				"invalidActivity",
				nameof(objectTypes),
				objectTypes
			);
		}

		let targetTypes: string[] = [""];
		if (Is.object(compactedObj.target)) {
			if (Is.undefined(compactedObj.target["@context"])) {
				compactedObj.target["@context"] = compactedObj["@context"];
			}
			const targetExpanded = await JsonLdProcessor.expand(compactedObj.target);
			targetTypes = targetExpanded[0]["@type"] as string[];

			if (!Is.arrayValue<string[]>(targetTypes)) {
				throw new GuardError(
					DataSpaceConnectorService.CLASS_NAME,
					"invalidActivity",
					nameof(compactedObj.target?.type),
					compactedObj.target?.type
				);
			}
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

		const days = Math.floor(minutesRemain / (24 * 60));
		minutesRemain %= 24 * 60;

		const hours = Math.floor(minutesRemain / 60);
		minutesRemain %= 60;

		return { intervalDays: days, intervalHours: hours, intervalMinutes: minutesRemain };
	}

	/**
	 * Returns an App for a (Activity, Object, Target).
	 * @param activityQuery The (Activity, Object, Target) query specified using a FQN.
	 * @returns The Data Space Connector Apps or empty list if nothing is registered.
	 * @internal
	 */
	private getAppForActivityQuery(activityQuery: IActivityQuery): string[] {
		const matchingElements: string[] = [];
		const appNames = DataSpaceConnectorAppFactory.names();

		for (const appId of appNames) {
			const app = DataSpaceConnectorAppFactory.get<IDataSpaceConnectorApp>(appId);
			const appQueries = app.activitiesHandled();

			for (const appQuery of appQueries) {
				if (
					appQuery.objectType === activityQuery.objectType &&
					(Is.undefined(appQuery.activityType) ||
						appQuery.activityType === activityQuery.activityType) &&
					(Is.undefined(appQuery.targetType) || appQuery.targetType === activityQuery.targetType)
				) {
					matchingElements.push(appId);
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
	private getDatasetFromApps(datasetId: string): IDataspaceProtocolDataset {
		Guards.stringValue(DataSpaceConnectorService.CLASS_NAME, nameof(datasetId), datasetId);
		const appNames = DataSpaceConnectorAppFactory.names();

		for (const appId of appNames) {
			const app = DataSpaceConnectorAppFactory.get<IDataSpaceConnectorApp>(appId);
			const datasets = app.datasetsHandled();
			const dataset = datasets.find(d => d["@id"] === datasetId);
			if (dataset) {
				return dataset;
			}
		}

		throw new NotFoundError(DataSpaceConnectorService.CLASS_NAME, "noAppRegistered", datasetId, {
			datasetId
		});
	}

	/**
	 * Returns an App for a Data Asset query (datasetId, ...).
	 * @param dataAssetQuery The data asset query.
	 * @returns The Data Space Connector App ID.
	 * @internal
	 */
	private async getAppForDataAssetQuery(dataAssetQuery: IDataAssetQuery): Promise<string> {
		const matchingElements: string[] = [];
		const appNames = DataSpaceConnectorAppFactory.names();

		for (const appId of appNames) {
			const app = DataSpaceConnectorAppFactory.get<IDataSpaceConnectorApp>(appId);
			const datasets = app.datasetsHandled();

			for (const dataset of datasets) {
				if (dataset["@id"] === dataAssetQuery.datasetId) {
					matchingElements.push(appId);
				}
			}
		}

		if (matchingElements.length > 1) {
			const error = new ConflictError(
				DataSpaceConnectorService.CLASS_NAME,
				"tooManyAppsRegistered",
				dataAssetQuery.datasetId,
				matchingElements,
				{
					datasetId: dataAssetQuery.datasetId
				}
			);
			await this._loggingService?.log({
				source: DataSpaceConnectorService.CLASS_NAME,
				level: "error",
				message: "tooManyAppsRegistered",
				error,
				data: {
					datasetId: dataAssetQuery.datasetId
				}
			});
			throw error;
		}

		if (matchingElements.length === 0) {
			const error = new NotFoundError(
				DataSpaceConnectorService.CLASS_NAME,
				"noAppRegistered",
				dataAssetQuery.datasetId,
				{
					datasetId: dataAssetQuery.datasetId
				}
			);
			await this._loggingService?.log({
				source: DataSpaceConnectorService.CLASS_NAME,
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
		const appsToRetry = existingEntry.inErrorTasks?.map(t => t.dataSpaceConnectorAppId) ?? [];

		if (appsToRetry.length === 0) {
			throw new NotFoundError(
				DataSpaceConnectorService.CLASS_NAME,
				"noFailedTasksToRetry",
				activityLogEntryId
			);
		}

		const successfulApps = existingEntry.finalizedTasks?.map(t => t.dataSpaceConnectorAppId) ?? [];

		await this._loggingService?.log({
			level: "debug",
			source: DataSpaceConnectorService.CLASS_NAME,
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
}
