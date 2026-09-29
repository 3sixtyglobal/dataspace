// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ContextIdStore } from "@twin.org/context";
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

const FILTERED_CLONE = {
	config: { types: { loggingConnector: [{ type: "console" }] } },
	state: {}
};

describe("appRunner - engine clone exclusions", () => {
	let mockEngineStart: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockEngineStart = vi.fn().mockResolvedValue(undefined);
		vi.spyOn(ContextIdStore, "getContextIds").mockResolvedValue({});
		vi.spyOn(ModuleHelper, "execModuleMethod").mockImplementation(async (module, method) => {
			if (method === "EngineCloneHelper.filterCloneComponents") {
				return FILTERED_CLONE;
			}
			return {
				className: () => "MockAppRunnerEngine",
				start: mockEngineStart,
				stop: vi.fn().mockResolvedValue(undefined)
			};
		});
	});

	afterEach(async () => {
		await appRunnerEnd();
		vi.restoreAllMocks();
	});

	function filterCall(): unknown[] | undefined {
		return vi
			.mocked(ModuleHelper.execModuleMethod)
			.mock.calls.find(call => call[1] === "EngineCloneHelper.filterCloneComponents");
	}

	function fromCloneCall(): unknown[] | undefined {
		return vi
			.mocked(ModuleHelper.execModuleMethod)
			.mock.calls.find(call => call[1] === "EngineCoreBuilder.fromClone");
	}

	it("delegates the clone filtering to the engine models module", async () => {
		await appRunnerStart(CLONE_WITH_TYPES, ["^rightsManagement"]);

		expect(filterCall()).toEqual([
			"@twin.org/engine-models",
			"EngineCloneHelper.filterCloneComponents",
			[CLONE_WITH_TYPES, ["^rightsManagement"], true]
		]);
	});

	it("delegates the clone filtering when no patterns are supplied", async () => {
		await appRunnerStart(CLONE_WITH_TYPES);

		expect(filterCall()).toEqual([
			"@twin.org/engine-models",
			"EngineCloneHelper.filterCloneComponents",
			[CLONE_WITH_TYPES, undefined, true]
		]);
	});

	it("builds the engine from the filtered clone", async () => {
		await appRunnerStart(CLONE_WITH_TYPES, ["^rightsManagement"]);

		const call = fromCloneCall();
		expect(call?.[0]).toBe("@twin.org/engine-core");
		expect((call?.[2] as unknown[])[1]).toBe(FILTERED_CLONE);
		expect(mockEngineStart).toHaveBeenCalledTimes(1);
	});

	it("does not filter or build an engine when there is no clone data", async () => {
		await appRunnerStart(undefined, ["^rightsManagement"]);

		expect(ModuleHelper.execModuleMethod).not.toHaveBeenCalled();
		expect(mockEngineStart).not.toHaveBeenCalled();
	});

	it("propagates an error raised while filtering the clone", async () => {
		vi.mocked(ModuleHelper.execModuleMethod).mockImplementation(async (module, method) => {
			if (method === "EngineCloneHelper.filterCloneComponents") {
				throw new Error("invalidExcludeCloneComponent");
			}
			return {
				className: () => "MockAppRunnerEngine",
				start: mockEngineStart,
				stop: vi.fn().mockResolvedValue(undefined)
			};
		});

		await expect(appRunnerStart(CLONE_WITH_TYPES, ["["])).rejects.toThrow(
			"invalidExcludeCloneComponent"
		);
		expect(fromCloneCall()).toBeUndefined();
	});
});
