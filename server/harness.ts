import { AgentHarness, JsonlSessionRepo } from "@earendil-works/pi-agent-core";
import { NodeExecutionEnv } from "@earendil-works/pi-agent-core/node";
import type { Session, JsonlSessionMetadata } from "@earendil-works/pi-agent-core";
import type { CreateHarnessOptions } from "./types";
import { $ } from "./harness/state";
import { buildHarness } from "./harness/build";

export { type SessionInfo, type RuntimeConfig } from "./types";
export { getHarness, getCurrentSessionPath } from "./harness/state";

const DEFAULT_SESSION_DIR = "./data/sessions";

export async function createHarness(options: CreateHarnessOptions): Promise<AgentHarness> {
  const e = new NodeExecutionEnv({ cwd: process.cwd() });
  const dir = options.sessionDir || DEFAULT_SESSION_DIR;
  const r = new JsonlSessionRepo({ fs: e, sessionsRoot: dir });
  $.init(options, e, r, dir);

  const sessions = await r.list();
  let session: Session<JsonlSessionMetadata>;
  if (sessions.length > 0) {
    session = await r.open(sessions[0]);
  } else {
    session = await r.create({ cwd: dir });
  }

  const meta = await session.getMetadata();
  $.currentSessionPath = (meta as JsonlSessionMetadata).path;

  const harness = await buildHarness(session);
  $.harnessRef = { current: harness };
  return harness;
}

// re-export
export { shouldCompact, autoCompactSession } from "./harness/compact";
export { listSessions, createSession, deleteSession, switchSession, getSessionMessages } from "./harness/session";
export { getSkillsWithStatus, toggleSkill } from "./harness/skill";
export { getConfig, updateConfig } from "./harness/config";
