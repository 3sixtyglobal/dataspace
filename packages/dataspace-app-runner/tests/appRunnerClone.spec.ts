// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ContextIdStore } from "@twin.org/context";
import { EngineCloneMode } from "@twin.org/engine-models";
import { ModuleHelper } from "@twin.org/modules";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { appRunnerEnd, appRunnerStart } from "../src/appRunner.js";

const CLONE_WITH_TYPES = {
	config: {
		types: {
			loggingConnector: [{ type: "console" }],
			identityComponent: [{ type: "service" }],
			rightsManagementPapComponent: [{ type: "service" }],
			rightsManagementPdpComponent: [{ type: "service" }]
		}
	},
	state: {}
};

const CLONE_WITHOUT_TYPES = { config: {}, state: {} };

describe("appRunner - engine clone exclusions", () => {
	let mockEngineStart: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockEngineStart = vi.fn().mockResolvedValue(undefined);
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({});
		vi.spyOn(ModuleHelper, "execModuleMethod").mockImplementation(async () => ({
			className: () => "MockAppRunnerEngine",
			start: mockEngineStart,
			stop: vi.fn().mockResolvedValue(undefined)
		}));
	});

	afterEach(async () => {
		await appRunnerEnd();
		vi.restoreAllMocks();
	});

	function cloneArg(): { config: { types: { [type: string]: unknown } } } {
		const calls = vi.mocked(ModuleHelper.execModuleMethod).mock.calls;
		return calls[0][2]?.[1] as { config: { types: { [type: string]: unknown } } };
	}

	it("passes the clone data through untouched when no patterns are supplied", async () => {
		await appRunnerStart(CLONE_WITH_TYPES);
		expect(cloneArg()).toBe(CLONE_WITH_TYPES);
	});

	it("passes the clone data through untouched when the pattern list is empty", async () => {
		await appRunnerStart(CLONE_WITH_TYPES, []);
		expect(cloneArg()).toBe(CLONE_WITH_TYPES);
	});

	it("removes the component types matching a pattern", async () => {
		await appRunnerStart(CLONE_WITH_TYPES, ["^rightsManagement"]);
		expect(Object.keys(cloneArg().config.types)).toEqual(["loggingConnector", "identityComponent"]);
	});

	it("removes the component types matching any of several patterns", async () => {
		await appRunnerStart(CLONE_WITH_TYPES, ["^rightsManagement", "^loggingConnector$"]);
		expect(Object.keys(cloneArg().config.types)).toEqual(["identityComponent"]);
	});

	it("treats the patterns as unanchored regular expressions", async () => {
		await appRunnerStart(CLONE_WITH_TYPES, ["Component$"]);
		expect(Object.keys(cloneArg().config.types)).toEqual(["loggingConnector"]);
	});

	it("does not mutate the source clone data", async () => {
		await appRunnerStart(CLONE_WITH_TYPES, ["^rightsManagement"]);
		expect(Object.keys(CLONE_WITH_TYPES.config.types)).toHaveLength(4);
	});

	it("retains all component types when no pattern matches", async () => {
		await appRunnerStart(CLONE_WITH_TYPES, ["^noSuchComponent$"]);
		expect(Object.keys(cloneArg().config.types)).toHaveLength(4);
	});

	it("passes the clone data through untouched when it has no types to filter", async () => {
		await appRunnerStart(CLONE_WITHOUT_TYPES, ["^rightsManagement"]);
		expect(cloneArg()).toBe(CLONE_WITHOUT_TYPES);
	});

	it("keeps the entries marked always cloned under a matched key", async () => {
		const cloneWithAlways = {
			config: {
				types: {
					loggingConnector: [{ type: "console" }],
					platformComponent: [{ type: "service", cloneMode: EngineCloneMode.Always }],
					contextIdHandlerComponent: [
						{ type: "did", cloneMode: EngineCloneMode.Always },
						{ type: "tenant", cloneMode: EngineCloneMode.Optional }
					],
					identityComponent: [{ type: "service" }]
				}
			},
			state: {}
		};

		await appRunnerStart(cloneWithAlways, ["Component$"]);

		expect(cloneArg().config.types).toEqual({
			loggingConnector: [{ type: "console" }],
			platformComponent: [{ type: "service", cloneMode: EngineCloneMode.Always }],
			contextIdHandlerComponent: [{ type: "did", cloneMode: EngineCloneMode.Always }]
		});
	});

	it("starts the engine from the filtered clone", async () => {
		await appRunnerStart(CLONE_WITH_TYPES, ["^rightsManagement"]);
		expect(mockEngineStart).toHaveBeenCalledTimes(1);
		expect(cloneArg().config.types).toEqual({
			loggingConnector: [{ type: "console" }],
			identityComponent: [{ type: "service" }]
		});
	});
});
