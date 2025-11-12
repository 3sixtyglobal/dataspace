// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	BackgroundTaskConnectorFactory,
	TaskStatus,
	type IBackgroundTask,
	type IBackgroundTaskConnector,
	type IScheduledTaskTime,
	type ITaskSchedulerComponent
} from "@twin.org/background-task-models";
import { ContextIdHelper, ContextIdKeys, ContextIdStore } from "@twin.org/context";
import {
	BaseError,
	ComponentFactory,
	ConflictError,
	Converter,
	GeneralError,
	GuardError,
	Guards,
	Is,
	NotFoundError,
	RandomHelper,
	UnprocessableError,
	Url,
	Validation,
	type IError,
	type IValidationFailure
} from "@twin.org/core";
import { Blake2b } from "@twin.org/crypto";
import {
	type IJsonLdContextDefinitionElement,
	JsonLdDataTypes,
	JsonLdHelper,
	JsonLdProcessor,
	type IJsonLdNodeObject
} from "@twin.org/data-json-ld";
import {
	ActivityProcessingStatus,
	type IFilteringQuery,
	type IActivityLogDetails,
	type IActivityLogEntry,
	type IActivityLogStatusNotification,
	type IActivityQuery,
	type IDataSpaceConnector,
	type IDataSpaceConnectorApp,
	type IExecutionPayload,
	type ITaskApp,
	type IDataAssetQuery,
	DataSpaceConnectorAppFactory,
	type IDataRequest,
	type IDataAssetItemList,
	type IEntitySet,
	type IDataAssetDescription
} from "@twin.org/data-space-connector-models";
import { EngineCoreFactory } from "@twin.org/engine-models";
import { ComparisonOperator, LogicalOperator } from "@twin.org/entity";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@twin.org/entity-storage-models";
import type {
	IFederatedCatalogueComponent,
	IParticipantEntry,
	IServiceOfferingEntry
} from "@twin.org/federated-catalogue-models";
import type { ILoggingComponent } from "@twin.org/logging-models";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import {
	SchemaOrgContexts,
	SchemaOrgDataTypes,
	SchemaOrgTypes
} from "@twin.org/standards-schema-org";
import { ActivityStreamsDataTypes, type IActivity } from "@twin.org/standards-w3c-activity-streams";
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
	 * Handler registry of Data Space Connector Apps.
	 * @internal
	 */
	private readonly _apps: { appId: string; app: IDataSpaceConnectorApp }[];

	/**
	 * Background Task Connector.
	 * @internal
	 */
	private readonly _backgroundTaskConnector: IBackgroundTaskConnector;

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
	 * The Federated Catalogue Component.
	 * @internal
	 */
	private readonly _federatedCatalogueComponent: IFederatedCatalogueComponent;

	/**
	 * The keys to use from the context ids to create partitions.
	 * @internal
	 */
	private readonly _partitionContextIds?: string[];

	/**
	 * The list of active tenants required for task cleanup.
	 * @internal
	 */
	private readonly _activeTenants: string[];

	/**
	 * Create a new instance of DataSpaceConnector.
	 * @param options The options for the connector.
	 */
	constructor(options: IDataSpaceConnectorServiceConstructorOptions) {
		this._loggingComponentType = options?.loggingComponentType ?? "logging";
		this._loggingService = ComponentFactory.getIfExists<ILoggingComponent>(
			this._loggingComponentType
		);

		this._entityStorageActivityLogs = EntityStorageConnectorFactory.get<
			IEntityStorageConnector<ActivityLogDetails>
		>(options.activityLogEntityStorageType ?? nameofKebabCase<ActivityLogDetails>());

		this._entityStorageActivityTasks = EntityStorageConnectorFactory.get<
			IEntityStorageConnector<ActivityTask>
		>(options.activityTaskEntityStorageType ?? nameofKebabCase<ActivityTask>());

		this._backgroundTaskConnector = BackgroundTaskConnectorFactory.get(
			options?.backgroundTaskConnectorType ?? "background-task"
		);

		this._taskScheduler = ComponentFactory.get<ITaskSchedulerComponent>(
			options?.taskSchedulerComponentType ?? "task-scheduler"
		);

		this._federatedCatalogueComponent = ComponentFactory.get<IFederatedCatalogueComponent>(
			options?.federatedCatalogueComponentType ?? "federated-catalogue"
		);

		this._apps = [];

		JsonLdDataTypes.registerTypes();
		ActivityStreamsDataTypes.registerTypes();
		SchemaOrgDataTypes.registerRedirects();

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
	public async notifyActivity(activity: IActivity): Promise<string> {
		Guards.object<IActivity>(DataSpaceConnectorService.CLASS_NAME, nameof(activity), activity);

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

		// Avoid duplicates
		const entryExists = !Is.undefined(
			await this._entityStorageActivityLogs.get(activityLogEntryId)
		);
		if (entryExists) {
			throw new ConflictError(
				DataSpaceConnectorService.CLASS_NAME,
				"activityAlreadyNotified",
				activityLogEntryId
			);
		}

		// First of all Activity Log Entry is created
		const logEntry: IActivityLogDetails = {
			id: activityLogEntryId,
			activityId: Is.string(activity.id) ? activity.id : undefined,
			generator: this.calculateActivityGeneratorIdentity(activity),
			dateCreated: new Date().toISOString(),
			dateModified: new Date().toISOString()
		};
		await this._entityStorageActivityLogs.set(logEntry);

		const activityQuerySet = await this.calculateActivityQuerySet(compactedObj);

		const tasksScheduled: ITaskApp[] = [];
		for (const query of activityQuerySet) {
			const dataSpaceConnectorAppIds = this.getAppForActivityQuery(query);

			for (const dataSpaceConnectorAppId of dataSpaceConnectorAppIds) {
				const payload: IExecutionPayload = {
					activityLogEntryId,
					activity: compactedObj,
					executorApp: dataSpaceConnectorAppId
				};
				// This is needed because the Background Task component does not support multiple tasks of
				// the same type executing at the same time
				const taskType = Converter.bytesToHex(RandomHelper.generate(16));
				const taskId = await this._backgroundTaskConnector.create<IExecutionPayload>(
					taskType,
					payload,
					{
						retainFor: this._retainTasksFor
					}
				);

				await this._backgroundTaskConnector.registerHandler<IExecutionPayload, unknown>(
					taskType,
					"@twin.org/data-space-connector-app-runner",
					"appRunner",
					async task => {
						await this.finaliseTask(task);
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
						dataSpaceConnectorAppId
					}
				});
			}
		}

		// This might happen after the tasks have been scheduled and actually finalized so there can be temporary
		// inconsistencies in the data that will be eventually solved
		await this._entityStorageActivityTasks.set({
			activityLogEntryId,
			associatedTasks: tasksScheduled
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
				const taskDetails = await this._backgroundTaskConnector.get<IExecutionPayload, unknown>(
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
	 * @returns The entities requested as a JSON-LD Document.
	 */
	public async getDataAssetEntities(
		dataAsset: IDataAssetDescription,
		entitySet: IEntitySet & {
			jsonLdContext?: IJsonLdContextDefinitionElement[];
		},
		cursor?: string,
		limit?: number
	): Promise<IDataAssetItemList> {
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

		const contextIds = await ContextIdStore.getContextIds();
		ContextIdHelper.guard(contextIds, ContextIdKeys.Organization);
		await this.checkParticipantExists(contextIds[ContextIdKeys.Organization]);

		// Now getting the Data Space Connector App that can serve
		if (!Is.undefined(dataAsset.dataServiceId)) {
			const dataServiceEntry = await this.checkDataServiceExists(dataAsset.dataServiceId);

			let finalType: string | undefined = entitySet.entityType;
			if (!Is.undefined(entitySet.jsonLdContext)) {
				// Let's expand the entity type
				const auxiliaryObj = {
					"@context": entitySet.jsonLdContext,
					"@type": entitySet.entityType
				};
				const expanded = (await JsonLdProcessor.expand(auxiliaryObj))[0];
				finalType = expanded["@type"]?.[0];
			}
			if (Is.undefined(finalType)) {
				await this._loggingService?.log({
					source: DataSpaceConnectorService.CLASS_NAME,
					level: "error",
					message: "notExpandableType",
					data: {
						type: entitySet.entityType
					}
				});
				throw new GuardError(
					DataSpaceConnectorService.CLASS_NAME,
					"notExpandableType",
					nameof(entitySet.entityType),
					entitySet.entityType
				);
			}
			// Check needed if no LD Context is provided and a non fully qualified name appears
			Url.guard(DataSpaceConnectorService.CLASS_NAME, nameof(entitySet.entityType), finalType);

			const dsConnectorApp = await this.getAppForDataAssetQuery({
				serviceId: dataAsset.dataServiceId
			});

			// Now get the Data from the App
			const theApp = DataSpaceConnectorAppFactory.get<IDataSpaceConnectorApp>(dsConnectorApp);
			const handleDataRequest = theApp?.handleDataRequest?.bind(theApp);
			Guards.function(
				DataSpaceConnectorService.CLASS_NAME,
				nameof(handleDataRequest),
				handleDataRequest
			);

			const dataRequest: IDataRequest = {
				type: "DataAssetEntities",
				dataAsset: {
					dataService: dataServiceEntry,
					dataset: []
				},
				entitySet: {
					entityType: finalType,
					entityId: entitySet.entityId
				},
				cursor,
				limit
			};
			const { data, cursor: cursorResult } = await handleDataRequest(dataRequest);

			// We allow the DS Connector App to return just one item
			let finalData: IJsonLdNodeObject[];
			if (Is.array(data)) {
				finalData = data;
			} else {
				finalData = [data as IJsonLdNodeObject];
			}

			// Consider here in the future combine LD Contexts of the items for efficiency reasons
			// in further data processing by the Data Consumer

			// Now with the data it is constructed the final JSON-LD
			const finalResult = {
				"@context": SchemaOrgContexts.ContextRoot,
				type: SchemaOrgTypes.ItemList,
				itemListElement: finalData,
				nextItem: cursorResult
			};

			return JsonLdProcessor.compact(finalResult, finalResult["@context"]);
		}

		// Otherwise we query the Catalogue until finding a Service Offering that can satisfy the query
		return {} as IDataAssetItemList;
	}

	/**
	 * Queries a data asset controlled by this DS Connector App.
	 * @param dataAsset The data asset being referred.
	 * @param query The filtering query.
	 * @param cursor Pagination details - cursor.
	 * @param limit Pagination details - max number of entities.
	 * @returns The entities requested as a JSON-LD Document.
	 */
	public async queryDataAsset(
		dataAsset: IDataAssetDescription,
		query: IFilteringQuery,
		cursor?: string,
		limit?: number
	): Promise<IDataAssetItemList> {
		Guards.object<IDataAssetDescription>(
			DataSpaceConnectorService.CLASS_NAME,
			nameof(dataAsset),
			dataAsset
		);
		Guards.string(
			DataSpaceConnectorService.CLASS_NAME,
			nameof(dataAsset.dataServiceId),
			dataAsset.dataServiceId
		);
		Guards.object(DataSpaceConnectorService.CLASS_NAME, nameof(query), query);
		Guards.string(DataSpaceConnectorService.CLASS_NAME, nameof(query.type), query.type);

		const dataServiceEntry = await this.checkDataServiceExists(dataAsset.dataServiceId);

		const dsConnectorApp = await this.getAppForDataAssetQuery({
			serviceId: dataAsset.dataServiceId
		});

		// Now get the Data from the App
		const theApp = DataSpaceConnectorAppFactory.get<IDataSpaceConnectorApp>(dsConnectorApp);

		if (!theApp.supportedQueryTypes().includes(query.type)) {
			throw new UnprocessableError(DataSpaceConnectorService.CLASS_NAME, "queryTypeNotSupported", {
				queryType: query.type
			});
		}

		const dataRequestApp: IDataRequest = {
			type: "QueryDataAsset",
			dataAsset: {
				dataService: dataServiceEntry,
				dataset: []
			},
			query,
			cursor,
			limit
		};
		const handleDataRequest = theApp?.handleDataRequest?.bind(theApp);
		Guards.function(
			DataSpaceConnectorService.CLASS_NAME,
			nameof(handleDataRequest),
			handleDataRequest
		);

		const { data, cursor: cursorResult } = await handleDataRequest(dataRequestApp);

		// We allow the DS Connector App to return just one item
		let finalData: IJsonLdNodeObject[];
		if (Is.array(data)) {
			finalData = data;
		} else {
			finalData = [data as IJsonLdNodeObject];
		}

		// Consider here in the future combine LD Contexts of the items for efficiency reasons
		// in further data processing by the Data Consumer

		// Now with the data it is constructed the final JSON-LD
		const finalResult = {
			"@context": SchemaOrgContexts.ContextRoot,
			type: SchemaOrgTypes.ItemList,
			itemListElement: finalData,
			nextItem: cursorResult
		};

		return JsonLdProcessor.compact(finalResult, finalResult["@context"]);
	}

	/**
	 * Registers a Data Space Connector App.
	 * @param appId The Id of the App to be registered.
	 * @param app The App to be registered.
	 */
	public async registerApp(appId: string, app: IDataSpaceConnectorApp): Promise<void> {
		Guards.stringValue(DataSpaceConnectorService.CLASS_NAME, nameof(appId), appId);
		Guards.objectValue<IDataSpaceConnectorApp>(
			DataSpaceConnectorService.CLASS_NAME,
			nameof(app),
			app
		);

		const handleActivity = app?.handleActivity?.bind(app);
		const handleDataRequest = app?.handleDataRequest?.bind(app);

		const handleActivityIsFunction = Is.function(handleActivity);
		const handleDataRequestIsFunction = Is.function(handleDataRequest);

		if (!handleActivityIsFunction && !handleDataRequestIsFunction) {
			throw new GeneralError(DataSpaceConnectorService.CLASS_NAME, "invalidDataSpaceConnectorApp", {
				appId
			});
		}
		if (
			(app.activitiesHandled().length > 0 && !handleActivityIsFunction) ||
			(app.dataServicesHandled().length > 0 && !handleDataRequestIsFunction)
		) {
			throw new GeneralError(DataSpaceConnectorService.CLASS_NAME, "invalidDataSpaceConnectorApp", {
				appId
			});
		}

		const currentIndex = this._apps.findIndex(a => a.appId === appId);
		if (currentIndex !== -1) {
			this._apps[currentIndex].app = app;
		} else {
			this._apps.push({ appId, app });
		}

		await this._loggingService?.log({
			level: "info",
			source: DataSpaceConnectorService.CLASS_NAME,
			message: "registeredApp",
			data: {
				appId
			}
		});
	}

	/**
	 * Un-registers a Data Space Connector App.
	 * @param appId The Id of the App to be registered.
	 * @returns Nothing.
	 */
	public async unregisterApp(appId: string): Promise<void> {
		Guards.stringValue(DataSpaceConnectorService.CLASS_NAME, nameof(appId), appId);

		const currentIndex = this._apps.findIndex(a => a.appId === appId);
		if (currentIndex !== -1) {
			this._apps.splice(currentIndex, 1);
		}

		await this._loggingService?.log({
			level: "info",
			source: DataSpaceConnectorService.CLASS_NAME,
			ts: Date.now(),
			message: "unregisteredApp",
			data: {
				appId
			}
		});
	}

	/**
	 * Check that a Participant exists in the Catalogue and returns its entry if found.
	 * @param participantId The participant Id to be checked.
	 * @returns the Participant Entry.
	 */
	private async checkParticipantExists(participantId: string): Promise<IParticipantEntry> {
		let entry;

		try {
			entry = await this._federatedCatalogueComponent.getEntry("LegalPerson", participantId);
		} catch (error) {
			if (BaseError.isErrorName(error, NotFoundError.CLASS_NAME)) {
				await this._loggingService?.log({
					source: DataSpaceConnectorService.CLASS_NAME,
					level: "error",
					message: "participantNotFound",
					error,
					data: {
						notFoundId: error.properties?.notFoundId
					}
				});
			}
			throw error;
		}

		return entry as IParticipantEntry;
	}

	/**
	 * Checks that a Data Service exists and returns its entry if found.
	 * @param dataServiceId The Data Service Id to be checked.
	 * @returns The Data SErvice entry
	 */
	private async checkDataServiceExists(dataServiceId: string): Promise<IServiceOfferingEntry> {
		let entry;
		try {
			entry = await this._federatedCatalogueComponent.getEntry("ServiceOffering", dataServiceId);
		} catch (error) {
			if (BaseError.isErrorName(error, NotFoundError.CLASS_NAME)) {
				await this._loggingService?.log({
					source: DataSpaceConnectorService.CLASS_NAME,
					level: "error",
					message: "dataServiceNotFound",
					error,
					data: {
						notFoundId: error.properties?.notFoundId
					}
				});
			}
			throw error;
		}

		return entry as IServiceOfferingEntry;
	}

	/**
	 * Calculates the activity generator from the generator or actor fields.
	 * @param activity The activity.
	 * @returns The generator's identity.
	 * @throws General Error if no identity is found.
	 * @internal
	 */
	private calculateActivityGeneratorIdentity(activity: IActivity): string {
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
						retainUntil
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
	private async calculateActivityQuerySet(compactedObj: IActivity): Promise<IActivityQuery[]> {
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

		if (Is.undefined(compactedObj.object["@context"])) {
			compactedObj.object["@context"] = compactedObj["@context"];
		}
		const objectExpanded = await JsonLdProcessor.expand(compactedObj.object);
		const objectTypes = objectExpanded[0]["@type"];
		if (!Is.arrayValue<string[]>(objectTypes)) {
			throw new GuardError(
				DataSpaceConnectorService.CLASS_NAME,
				"invalidActivity",
				nameof(compactedObj.object.type),
				compactedObj.object.type
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

		for (const appEntry of this._apps) {
			const appQueries = appEntry.app.activitiesHandled();

			for (const appQuery of appQueries) {
				if (
					appQuery.objectType === activityQuery.objectType &&
					(Is.undefined(appQuery.activityType) ||
						appQuery.activityType === activityQuery.activityType) &&
					(Is.undefined(appQuery.targetType) || appQuery.targetType === activityQuery.targetType)
				) {
					matchingElements.push(appEntry.appId);
				}
			}
		}

		return matchingElements;
	}

	/**
	 * Returns an App for a Data Asset query (dataServiceId, ...).
	 * @param dataAssetQuery The data asset query.
	 * @returns The Data Space Connector Apps or empty list if nothing is registered.
	 * @internal
	 */
	private async getAppForDataAssetQuery(dataAssetQuery: IDataAssetQuery): Promise<string> {
		const matchingElements: string[] = [];

		for (const appEntry of this._apps) {
			const appQueries = appEntry.app.dataServicesHandled();

			for (const appQuery of appQueries) {
				if (appQuery.serviceId === dataAssetQuery.serviceId) {
					matchingElements.push(appEntry.appId);
				}
			}
		}

		if (matchingElements.length > 1) {
			const error = new ConflictError(
				DataSpaceConnectorService.CLASS_NAME,
				"tooManyAppsRegistered",
				dataAssetQuery.serviceId,
				matchingElements,
				{
					dataServiceId: dataAssetQuery.serviceId
				}
			);
			await this._loggingService?.log({
				source: DataSpaceConnectorService.CLASS_NAME,
				level: "error",
				message: "tooManyAppsRegistered",
				error,
				data: {
					dataServiceId: dataAssetQuery.serviceId
				}
			});
			throw error;
		}

		if (matchingElements.length === 0) {
			const error = new NotFoundError(
				DataSpaceConnectorService.CLASS_NAME,
				"noAppRegistered",
				dataAssetQuery.serviceId,
				{
					dataServiceId: dataAssetQuery.serviceId
				}
			);
			await this._loggingService?.log({
				source: DataSpaceConnectorService.CLASS_NAME,
				level: "error",
				message: "noAppRegistered",
				error,
				data: {
					dataServiceId: dataAssetQuery.serviceId
				}
			});
			throw error;
		}

		return matchingElements[0];
	}
}
