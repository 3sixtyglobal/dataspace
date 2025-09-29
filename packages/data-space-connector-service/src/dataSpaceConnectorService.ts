// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import {
	BackgroundTaskConnectorFactory,
	type IScheduledTaskTime,
	TaskStatus,
	type IBackgroundTask,
	type IBackgroundTaskConnector,
	type ITaskSchedulerComponent
} from "@twin.org/background-task-models";
import {
	ComponentFactory,
	ConflictError,
	Converter,
	GuardError,
	Guards,
	Is,
	NotFoundError,
	RandomHelper,
	StringHelper,
	Validation,
	type IError,
	type IValidationFailure
} from "@twin.org/core";
import { Blake2b } from "@twin.org/crypto";
import {
	JsonLdDataTypes,
	JsonLdHelper,
	JsonLdProcessor,
	type IJsonLdNodeObject
} from "@twin.org/data-json-ld";
import {
	ActivityProcessingStatus,
	type IActivityLogDetails,
	type IActivityLogEntry,
	type IActivityLogStatusNotification,
	type IActivityQuery,
	type IDataSpaceConnector,
	type IDataSpaceConnectorApp,
	type IDataSpaceConnectorAppDescriptor,
	type IExecutionPayload,
	type ITaskApp
} from "@twin.org/data-space-connector-models";
import { EngineCoreFactory, type IEngineCoreTypeConfig } from "@twin.org/engine-models";
import { ComparisonOperator, LogicalOperator } from "@twin.org/entity";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@twin.org/entity-storage-models";
import type { ILoggingComponent } from "@twin.org/logging-models";
import { ModuleHelper } from "@twin.org/modules";
import { nameof, nameofKebabCase } from "@twin.org/nameof";
import { SchemaOrgDataTypes } from "@twin.org/standards-schema-org";
import { ActivityStreamsDataTypes, type IActivity } from "@twin.org/standards-w3c-activity-streams";
import { AppRegistry } from "./appRegistry";
import type { ActivityLogDetails } from "./entities/activityLogDetails";
import type { ActivityTask } from "./entities/activityTask";
import type { IDataSpaceConnectorServiceConstructorOptions } from "./models/IDataSpaceConnectorServiceConstructorOptions";

/**
 * Data Space Connector Service.
 */
export class DataSpaceConnectorService implements IDataSpaceConnector {
	/**
	 * DS Connector App Component Type.
	 * @internal
	 */
	private static readonly _DS_CONNECTOR_APP_COMPONENT_TYPE: string =
		nameof<IDataSpaceConnectorApp>();

	/**
	 * The default cleanup interval in minutes. (1 hour)
	 * @internal
	 */
	private static readonly _DEFAULT_CLEANUP_INTERVAL: number = 60;

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<DataSpaceConnectorService>();

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
	private readonly _appRegistry: AppRegistry;

	/**
	 * Background Task Connector.
	 * @internal
	 */
	private readonly _backgroundTaskConnector: IBackgroundTaskConnector;

	/**
	 * Initial set of Data Space Connector Apps
	 * @internal
	 */
	private readonly _initialDataSpaceConnectorApps?: IDataSpaceConnectorAppDescriptor[];

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

		this._appRegistry = new AppRegistry();

		JsonLdDataTypes.registerTypes();
		ActivityStreamsDataTypes.registerTypes();
		SchemaOrgDataTypes.registerRedirects();

		this._initialDataSpaceConnectorApps = options.config?.dataSpaceConnectorAppDescriptors;

		this._activityLogStatusCallbacks = {};

		this._retainTasksFor = -1;
		this._retainActivityLogsFor = -1;
		this._activityLogCleanUpInterval = DataSpaceConnectorService._DEFAULT_CLEANUP_INTERVAL;
		this._cleanUpProcessOngoing = false;

		const validationErrors: IValidationFailure[] = [];
		if (!Is.undefined(options?.config?.retainActivityLogsFor)) {
			Guards.integer(
				this.CLASS_NAME,
				nameof(options.config.retainActivityLogsFor),
				options.config.retainActivityLogsFor
			);
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

		if (!Is.undefined(options?.config?.activityLogsCleanUpInterval)) {
			Guards.integer(
				this.CLASS_NAME,
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
		Validation.asValidationError(this.CLASS_NAME, nameof(options?.config), validationErrors);
	}

	/**
	 * Start step. It just registers the Data Space Connector Apps initial descriptors.
	 * @param nodeIdentity Node Identity
	 * @param nodeLoggingComponentType Node Logging Component type.
	 */
	public async start(nodeIdentity?: string, nodeLoggingComponentType?: string): Promise<void> {
		if (Is.arrayValue(this._initialDataSpaceConnectorApps)) {
			for (const app of this._initialDataSpaceConnectorApps) {
				await this.registerDataSpaceConnectorApp(app, nodeIdentity, nodeLoggingComponentType);
			}
		}

		const engine = EngineCoreFactory.getIfExists("engine");
		if (Is.empty(engine) || engine.isClone()) {
			this._loggingService?.log({
				level: "debug",
				source: this.CLASS_NAME,
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

			this._taskScheduler.addTask("data-space-connector-cleanup", taskTime, async () => {
				this._loggingService?.log({
					level: "debug",
					source: this.CLASS_NAME,
					message: "scheduledCleanUpTask"
				});

				await this.cleanUpActivityLog();
			});

			this._loggingService?.log({
				level: "debug",
				source: this.CLASS_NAME,
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
		Guards.object<IActivity>(this.CLASS_NAME, nameof(activity), activity);

		this._loggingService?.log({
			level: "debug",
			source: this.CLASS_NAME,
			message: "newActivity",
			data: {
				activityType: activity.type,
				generator: this.calculateActivityGeneratorIdentity(activity)
			}
		});

		// Validate that the Activity notified is encoded using the representation format expected by the Connector
		const validationFailures: IValidationFailure[] = [];
		await JsonLdHelper.validate(activity, validationFailures, { failOnMissingType: true });
		Validation.asValidationError(this.CLASS_NAME, nameof(activity), validationFailures);

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
			throw new ConflictError(this.CLASS_NAME, "activityAlreadyNotified", activityLogEntryId);
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

		const activityQuerySet = await this.calculateQuerySet(compactedObj);

		const tasksScheduled: ITaskApp[] = [];
		for (const query of activityQuerySet) {
			const dataSpaceConnectorApps = this._appRegistry.getAppForActivityQuery(query);

			for (const dataSpaceConnectorApp of dataSpaceConnectorApps) {
				const payload: IExecutionPayload = {
					activityLogEntryId,
					activity: compactedObj,
					executorApp: dataSpaceConnectorApp.id
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

				this._backgroundTaskConnector.registerHandler<IExecutionPayload, unknown>(
					taskType,
					"@twin.org/data-space-connector-app-runner",
					"appRunner",
					async task => {
						await this.finaliseTask(task);
					}
				);

				tasksScheduled.push({
					taskId,
					dataSpaceConnectorAppId: dataSpaceConnectorApp.id
				});

				await this._loggingService?.log({
					level: "info",
					source: this.CLASS_NAME,
					message: "scheduledTask",
					data: {
						taskId,
						dataSpaceConnectorAppId: dataSpaceConnectorApp.id
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
		Guards.function(this.CLASS_NAME, nameof(callback), callback);

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
		Guards.stringValue(this.CLASS_NAME, nameof(subscriptionId), subscriptionId);
		delete this._activityLogStatusCallbacks[subscriptionId];
	}

	/**
	 * Returns the activity processing details of an activity.
	 * @param logEntryId The Id of the Activity Log Entry (a URI).
	 * @returns the Activity Log Entry with the processing details.
	 * @throws NotFoundError if activity log entry is not known.
	 */
	public async getActivityLogEntry(logEntryId: string): Promise<IActivityLogEntry> {
		Guards.stringValue(this.CLASS_NAME, nameof(logEntryId), logEntryId);

		const result = await this._entityStorageActivityLogs.get(logEntryId);
		if (Is.undefined(result)) {
			throw new NotFoundError(this.CLASS_NAME, "activityLogEntryNotFound", logEntryId);
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

				switch (taskDetails?.status) {
					case TaskStatus.Success:
						finalizedTasks.push({
							...entity,
							result: JSON.stringify(taskDetails?.result),
							startDate: taskDetails?.dateCreated,
							endDate: taskDetails?.dateCompleted
						});
						break;

					case TaskStatus.Pending:
						pendingTasks.push(entity);
						break;

					case TaskStatus.Processing:
						runningTasks.push({ ...entity, startDate: taskDetails?.dateCreated });
						break;

					case TaskStatus.Failed:
						inErrorTasks.push({
							...entity,
							error: taskDetails.error as IError
						});
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
	 * Registers a Data Space Connector App.
	 * @param app The App to be registered.
	 * @param nodeIdentity The identity of the Node.
	 * @param nodeLoggingComponentType The Node Logging Component type.
	 */
	public async registerDataSpaceConnectorApp(
		app: IDataSpaceConnectorAppDescriptor,
		nodeIdentity?: string,
		nodeLoggingComponentType?: string
	): Promise<void> {
		Guards.objectValue<IDataSpaceConnectorAppDescriptor>(this.CLASS_NAME, nameof(app), app);

		const activityQuerySet = app.activitiesHandled;

		if (Is.arrayValue(activityQuerySet)) {
			for (const query of activityQuerySet) {
				this._appRegistry.setAppForActivityQuery(query, app);
			}
		}

		const customTypeConfig: IEngineCoreTypeConfig[] = [
			{
				type: `${DataSpaceConnectorService._DS_CONNECTOR_APP_COMPONENT_TYPE}_${app.id}`,
				options: {
					loggingComponentType: this._loggingComponentType,
					config: { dataSpaceConnectorAppId: app.id }
				}
			}
		];

		// Register within the Engine so that it can be cloned in the future
		const engine = EngineCoreFactory.getIfExists("engine");
		if (!Is.undefined(engine)) {
			engine.addTypeInitialiser(
				`${DataSpaceConnectorService._DS_CONNECTOR_APP_COMPONENT_TYPE}_${app.id}`,
				customTypeConfig,
				app.moduleName,
				app.initialiserName ?? "appInitialiser"
			);
		}

		// Instantiate the application so that it will be registered in the ComponentFactory
		await ModuleHelper.execModuleMethod(app.moduleName, app.initialiserName ?? "appInitialiser", [
			engine,
			null,
			{ options: customTypeConfig[0].options },
			null
		]);

		const dsConnectorAppComponent = ComponentFactory.get<IDataSpaceConnectorApp>(
			`${StringHelper.kebabCase(nameof<IDataSpaceConnectorApp>(), true)}-${app.id}`
		);
		if (!Is.undefined(nodeIdentity)) {
			await dsConnectorAppComponent.start?.(nodeIdentity, nodeLoggingComponentType);
		}

		this._loggingService?.log({
			level: "debug",
			message: "startDsConnectorApp",
			source: this.CLASS_NAME,
			data: {
				appId: app.id
			}
		});
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
			this.CLASS_NAME,
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
			this._loggingService?.log({
				level: "error",
				source: this.CLASS_NAME,
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
					this._entityStorageActivityLogs.set({
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
	 * Cleans up the activity log by deleting those entries that no longer shall be retained.
	 * @internal
	 */
	private async cleanUpActivityLog(): Promise<void> {
		if (this._cleanUpProcessOngoing) {
			this._loggingService?.log({
				level: "debug",
				message: "cleanUpOngoing",
				source: this.CLASS_NAME
			});
			return;
		}

		let numRecordsDeleted = 0;

		try {
			this._cleanUpProcessOngoing = true;

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

		this._loggingService?.log({
			level: "debug",
			message: "activityLogCleanedUp",
			source: this.CLASS_NAME,
			data: {
				numRecordsDeleted
			}
		});

		this._cleanUpProcessOngoing = false;
	}

	/**
	 * Calculates the (Activity, Object, Target) query set.
	 * @param compactedObj The compactObj representing the Activity.
	 * @returns the (Activity, Object, Target) query set.
	 * @internal
	 */
	private async calculateQuerySet(compactedObj: IActivity): Promise<IActivityQuery[]> {
		const expanded = await JsonLdProcessor.expand({
			"@context": compactedObj["@context"],
			"@type": compactedObj.type
		});
		const expandedDoc = expanded[0];
		const activityTypes = expandedDoc["@type"];
		if (!Is.arrayValue<string[]>(activityTypes)) {
			throw new GuardError(
				this.CLASS_NAME,
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
				this.CLASS_NAME,
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
					this.CLASS_NAME,
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
}
