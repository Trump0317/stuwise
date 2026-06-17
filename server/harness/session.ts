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
      const msgCount = e.filter((x) => x.type === "message").length;
      
      // 提取最新的 session_info（customType = "session_info" 的 custom entry）
      let name: string | undefined;
      let pinned: boolean | undefined;
      for (let i = e.length - 1; i >= 0; i--) {
        const entry = e[i] as any;
        if (entry.type === "custom" && entry.customType === "session_info") {
          const d = entry.data;
          if (d && name === undefined && typeof d.name === "string") name = d.name;
          if (d && pinned === undefined && typeof d.pinned === "boolean") pinned = d.pinned;
        }
        // 兼容旧格式: type === "session_info"
        if (entry.type === "session_info") {
          if (name === undefined && typeof entry.name === "string") name = entry.name;
          if (pinned === undefined && typeof entry.pinned === "boolean") pinned = entry.pinned;
        }
        if (name !== undefined && pinned !== undefined) break;
      }
      out.push({ id: m.id, createdAt: m.createdAt, cwd: (m as JsonlSessionMetadata).cwd, messageCount: msgCount, name, pinned });
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

export async function renameSession(id: string, name: string): Promise<void> {
  const r = cr(); const list = await r.list(); const t = list.find((m) => m.id === id);
  if (!t) throw new Error(`Session ${id} 不存在`);
  const s = await r.open(t);
  await (s as any).appendCustomEntry("session_info", { name });
}

/** 置顶/取消置顶 */
export async function pinSession(id: string, pinned: boolean): Promise<void> {
  const r = cr(); const list = await r.list(); const t = list.find((m) => m.id === id);
  if (!t) throw new Error(`Session ${id} 不存在`);
  const s = await r.open(t);
  // 先获取当前 name
  const entries = await s.getEntries();
  let currentName: string | undefined;
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i] as any;
    if (e.type === "custom" && e.customType === "session_info" && e.data?.name) {
      currentName = e.data.name;
      break;
    }
    if (e.type === "session_info" && e.name) {
      currentName = e.name;
      break;
    }
  }
  const si: any = { pinned };
  if (currentName) si.name = currentName;
  await (s as any).appendCustomEntry("session_info", si);
}
