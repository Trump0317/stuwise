/** 内部共享状态，通过可变对象绕过 TS import 只读限制 */

import type { AgentHarness, JsonlSessionRepo } from "@earendil-works/pi-agent-core";
import type { NodeExecutionEnv } from "@earendil-works/pi-agent-core/node";
import type { CreateHarnessOptions } from "../types";

export const $ = {
  options: null as CreateHarnessOptions | null,
  env: null as NodeExecutionEnv | null,
  repo: null as JsonlSessionRepo | null,
  sessionDir: "",
  harnessRef: null as { current: AgentHarness } | null,
  currentSessionPath: null as string | null,
  currentSessionId: null as string | null,
  skillEnabled: new Map<string, boolean>(),
  toolEnabled: new Map<string, boolean>(),
  allSkills: [] as Array<{ name: string; description: string; content: string; filePath: string }>,
  allToolNames: [] as string[],
  apiKey: "",
  modelConfig: { provider: "", modelId: "" },

  init(opts: CreateHarnessOptions, e: NodeExecutionEnv, r: JsonlSessionRepo, dir: string) {
    this.options = opts;
    this.env = e;
    this.repo = r;
    this.sessionDir = dir;
    this.apiKey = opts.apiKey;
    this.modelConfig = { provider: opts.provider, modelId: opts.modelId };
  },
};

export function getHarness(): AgentHarness {
  if (!$.harnessRef?.current) throw new Error("Harness 未初始化");
  return $.harnessRef.current;
}

export function getCurrentSessionPath(): string | null {
  return $.currentSessionPath;
}
