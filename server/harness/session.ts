import type { Session, JsonlSessionMetadata, AgentMessage } from "@earendil-works/pi-agent-core";
import { buildHarness } from "./build";
import { $ } from "./state";
import type { SessionInfo } from "../types";

function cr() { if (!$.repo) throw new Error("未初始化"); return $.repo; }

export async function listSessions(): Promise<SessionInfo[]> {
  const r = cr(); const list = await r.list(); const out: SessionInfo[] = [];
  for (const m of list) {
    try {
      const s = await r.open(m); const e = await s.getEntries();
      out.push({ id: m.id, createdAt: m.createdAt, cwd: (m as JsonlSessionMetadata).cwd, messageCount: e.filter((x) => x.type === "message").length });
    } catch { out.push({ id: m.id, createdAt: m.createdAt, cwd: (m as JsonlSessionMetadata).cwd, messageCount: 0 }); }
  }
  return out;
}

export async function createSession(): Promise<SessionInfo> {
  const s = await cr().create({ cwd: $.sessionDir });
  const meta = await s.getMetadata();
  return { id: meta.id, createdAt: meta.createdAt, cwd: (meta as JsonlSessionMetadata).cwd, messageCount: 0 };
}

export async function deleteSession(id: string): Promise<void> {
  const r = cr(); const list = await r.list(); const t = list.find((m) => m.id === id);
  if (!t) throw new Error(`Session ${id} 不存在`);
  await r.delete(t);
}

export async function switchSession(id: string): Promise<SessionInfo> {
  const r = cr(); const list = await r.list(); const t = list.find((m) => m.id === id);
  if (!t) throw new Error(`Session ${id} 不存在`);
  const s = await r.open(t);
  const h = await buildHarness(s);
  $.harnessRef!.current = h;
  const meta = await s.getMetadata();
  $.currentSessionPath = (meta as JsonlSessionMetadata).path;
  const entries = await s.getEntries();
  return { id: meta.id, createdAt: meta.createdAt, cwd: (meta as JsonlSessionMetadata).cwd, messageCount: entries.filter((e) => e.type === "message").length };
}

export async function getSessionMessages(id: string): Promise<AgentMessage[]> {
  const r = cr(); const list = await r.list(); const t = list.find((m) => m.id === id);
  if (!t) throw new Error(`Session ${id} 不存在`);
  const s = await r.open(t); const entries = await s.getEntries();
  return entries.filter((e): e is { type: "message"; message: AgentMessage } & typeof e => e.type === "message").map((e) => e.message);
}
