import type { AgentMessage, JsonlSessionMetadata, SessionTreeEntry } from "@earendil-works/pi-agent-core";
import { buildHarness } from "./build";
import { $ } from "./state";
import type { SessionInfo } from "../types";

function cr() {
  if (!$.repo) throw new Error("SessionRepo 未初始化");
  return $.repo;
}

/** 列出所有 Session（含 name 和 pinned 状态） */
export async function listSessions(): Promise<SessionInfo[]> {
  const r = cr(); const list = await r.list(); const out: SessionInfo[] = [];
  for (const m of list) {
    try {
      const s = await r.open(m);
      const entries = await s.getEntries() as SessionTreeEntry[];
      const msgCount = entries.filter((x) => x.type === "message").length;

      // 从后往前扫描：name 来自 SessionInfoEntry，pinned 来自 CustomEntry
      let name: string | undefined;
      let pinned: boolean | undefined;
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i]!;
        if (entry.type === "session_info" && name === undefined) {
          name = entry.name;
        }
        if (entry.type === "custom" && entry.customType === "pin" && pinned === undefined) {
          pinned = (entry as any).data?.pinned;
        }
        if (name !== undefined && pinned !== undefined) break;
      }
      out.push({
        id: m.id, createdAt: m.createdAt,
        cwd: (m as JsonlSessionMetadata).cwd, messageCount: msgCount, name, pinned,
      });
    } catch {
      out.push({
        id: m.id, createdAt: m.createdAt,
        cwd: (m as JsonlSessionMetadata).cwd, messageCount: 0,
      });
    }
  }
  return out;
}

/** 创建新 Session */
export async function createSession(): Promise<SessionInfo> {
  const r = cr(); const s = await r.create({ cwd: "./data/sessions" });
  const m = await s.getMetadata();
  return { id: m.id, createdAt: m.createdAt, cwd: (m as JsonlSessionMetadata).cwd, messageCount: 0 };
}

/** 删除 Session */
export async function deleteSession(id: string): Promise<void> {
  const r = cr(); const list = await r.list();
  const t = list.find((m: JsonlSessionMetadata) => m.id === id);
  if (!t) throw new Error(`Session ${id} 不存在`);
  await r.delete(t);
  if ($.currentSessionPath === t.path) $.currentSessionPath = null;
}

/** 切换到指定 Session（重建 harness） */
export async function switchSession(id: string): Promise<void> {
  const r = cr(); const list = await r.list();
  const t = list.find((m: JsonlSessionMetadata) => m.id === id);
  if (!t) throw new Error(`Session ${id} 不存在`);
  $.currentSessionPath = t.path;
  $.currentSessionId = id;
  const s = await r.open(t);
  const harness = await buildHarness(s);
  if ($.harnessRef) $.harnessRef.current = harness;
}

/** 从 JSONL 读取 Session 消息历史 */
export async function getSessionMessages(id: string): Promise<AgentMessage[]> {
  const r = cr(); const list = await r.list();
  const t = list.find((m: JsonlSessionMetadata) => m.id === id);
  if (!t) throw new Error(`Session ${id} 不存在`);
  const s = await r.open(t);
  const entries = await s.getEntries() as SessionTreeEntry[];
  return entries
    .filter((e): e is SessionTreeEntry & { type: "message" } => e.type === "message")
    .map((e) => (e as any).message as AgentMessage);
}

/** 重命名会话 — 写 SessionInfoEntry */
export async function renameSession(id: string, name: string): Promise<void> {
  const r = cr(); const list = await r.list();
  const t = list.find((m: JsonlSessionMetadata) => m.id === id);
  if (!t) throw new Error(`Session ${id} 不存在`);
  const s = await r.open(t);
  await s.appendSessionName(name.trim());
}

/** 置顶/取消置顶 — 写 CustomEntry(customType="pin") */
export async function pinSession(id: string, pinned: boolean): Promise<void> {
  const r = cr(); const list = await r.list();
  const t = list.find((m: JsonlSessionMetadata) => m.id === id);
  if (!t) throw new Error(`Session ${id} 不存在`);
  const s = await r.open(t);
  await s.appendCustomEntry("pin", { pinned });
}
