import {
  AgentHarness,
  JsonlSessionRepo,
  loadSkills,
  formatSkillsForSystemPrompt,
} from "@earendil-works/pi-agent-core";
import { NodeExecutionEnv } from "@earendil-works/pi-agent-core/node";
import { getModel, type Model } from "@earendil-works/pi-ai";
import type { Session, JsonlSessionMetadata, AgentMessage } from "@earendil-works/pi-agent-core";
import { createAllTools } from "../tools/index.js";
import fs from "node:fs/promises";

export interface CreateHarnessOptions {
  provider: string;
  modelId: string;
  apiKey: string;
  sessionDir?: string;
  systemPrompt?: string;
}

export interface SessionInfo {
  id: string;
  createdAt: string;
  cwd: string;
  messageCount: number;
}

const DEFAULT_SYSTEM_PROMPT = "你是一个友好的学生助理，帮助用户处理日常学习任务。请用中文回复。";
const DEFAULT_SESSION_DIR = "./data/sessions";
const COMPACT_THRESHOLD = 80;

/** 当前 harness 引用，支持动态切换 */
let harnessRef: { current: AgentHarness } | null = null;

/** 当前会话路径（用于 compact 检查） */
let currentSessionPath: string | null = null;

/** Skill 启用状态映射 */
const skillEnabled = new Map<string, boolean>();

/** 所有已加载的 Skill */
let _allSkills: Array<{ name: string; description: string; content: string; filePath: string }> = [];

/** 运行时可变配置 */
let _apiKey: string = "";
let _modelConfig = { provider: "", modelId: "" };

function getRepo(env: NodeExecutionEnv, sessionDir: string): JsonlSessionRepo {
  return new JsonlSessionRepo({ fs: env, sessionsRoot: sessionDir });
}

/** 获取当前 harness */
export function getHarness(): AgentHarness {
  if (!harnessRef?.current) throw new Error("Harness 未初始化");
  return harnessRef.current;
}

// === compact 检查 ===

export async function shouldCompact(): Promise<boolean> {
  if (!currentSessionPath) return false;
  try {
    const content = await fs.readFile(currentSessionPath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    return lines.length - 1 > COMPACT_THRESHOLD;
  } catch {
    return false;
  }
}

export async function autoCompactSession(harness: AgentHarness) {
  const needed = await shouldCompact();
  if (!needed) return null;
  try {
    console.log("[compact] 会话条目超过阈值，自动压缩...");
    const result = await harness.compact();
    console.log(`[compact] 完成: ${result.summary.substring(0, 80)}...`);
    return result;
  } catch (err) {
    console.error("[compact] 自动压缩失败:", err);
    return null;
  }
}

// === 内部辅助 ===

let _options: CreateHarnessOptions;
let _env: NodeExecutionEnv;
let _repo: JsonlSessionRepo;
let _sessionDir: string;

async function buildHarness(session: Session<JsonlSessionMetadata>): Promise<AgentHarness> {
  const model = (getModel as any)(_modelConfig.provider, _modelConfig.modelId) as Model<any>;

  const { skills, diagnostics } = await loadSkills(_env, "./skills");
  for (const d of diagnostics) console.warn(`[Skill] ${d.message}`);

  // 存储所有 skill，初始化启用状态
  _allSkills = skills.map((s) => ({ name: s.name, description: s.description, content: s.content, filePath: s.filePath }));
  for (const s of _allSkills) {
    if (!skillEnabled.has(s.name)) skillEnabled.set(s.name, true);
  }

  // 过滤启用的 skill
  const enabledSkills = skills.filter((s) => skillEnabled.get(s.name) !== false);

  const basePrompt = _options.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const skillBlock = formatSkillsForSystemPrompt(enabledSkills);
  const systemPrompt = [basePrompt, skillBlock].filter(Boolean).join("\n\n");

  return new AgentHarness({
    env: _env,
    session,
    model,
    tools: createAllTools(_env),
    systemPrompt,
    resources: { skills: enabledSkills },
    getApiKeyAndHeaders: async () => ({ apiKey: _apiKey }),
  });
}

// === 公共 API ===

/** 初始化（启动时调用一次） */
export async function createHarness(options: CreateHarnessOptions): Promise<AgentHarness> {
  _options = options;
  _apiKey = options.apiKey;
  _modelConfig = { provider: options.provider, modelId: options.modelId };
  _env = new NodeExecutionEnv({ cwd: process.cwd() });
  _sessionDir = options.sessionDir || DEFAULT_SESSION_DIR;
  _repo = getRepo(_env, _sessionDir);

  const sessions = await _repo.list();
  let session: Session<JsonlSessionMetadata>;
  if (sessions.length > 0) {
    session = await _repo.open(sessions[0]);
  } else {
    session = await _repo.create({ cwd: _sessionDir });
  }

  const meta = await session.getMetadata();
  currentSessionPath = (meta as JsonlSessionMetadata).path;

  const harness = await buildHarness(session);
  harnessRef = { current: harness };
  return harness;
}

/** 列出所有 session */
export async function listSessions(): Promise<SessionInfo[]> {
  const metaList = await _repo.list();
  const result: SessionInfo[] = [];
  for (const meta of metaList) {
    try {
      const session = await _repo.open(meta);
      const entries = await session.getEntries();
      const msgCount = entries.filter((e) => e.type === "message").length;
      result.push({
        id: meta.id,
        createdAt: meta.createdAt,
        cwd: (meta as JsonlSessionMetadata).cwd,
        messageCount: msgCount,
      });
    } catch {
      result.push({
        id: meta.id,
        createdAt: meta.createdAt,
        cwd: (meta as JsonlSessionMetadata).cwd,
        messageCount: 0,
      });
    }
  }
  return result;
}

/** 新建 session */
export async function createSession(): Promise<SessionInfo> {
  const session = await _repo.create({ cwd: _sessionDir });
  const meta = await session.getMetadata();
  return {
    id: meta.id,
    createdAt: meta.createdAt,
    cwd: (meta as JsonlSessionMetadata).cwd,
    messageCount: 0,
  };
}

/** 删除 session */
export async function deleteSession(id: string): Promise<void> {
  const metaList = await _repo.list();
  const target = metaList.find((m) => m.id === id);
  if (!target) throw new Error(`Session ${id} 不存在`);
  await _repo.delete(target);
}

/** 切换 session */
export async function switchSession(id: string): Promise<SessionInfo> {
  const metaList = await _repo.list();
  const target = metaList.find((m) => m.id === id);
  if (!target) throw new Error(`Session ${id} 不存在`);

  const session = await _repo.open(target);
  const harness = await buildHarness(session);
  harnessRef!.current = harness;

  const meta = await session.getMetadata();
  currentSessionPath = (meta as JsonlSessionMetadata).path;

  const entries = await session.getEntries();
  return {
    id: meta.id,
    createdAt: meta.createdAt,
    cwd: (meta as JsonlSessionMetadata).cwd,
    messageCount: entries.filter((e) => e.type === "message").length,
  };
}

// === Skill 管理 ===

/** 获取所有 Skill（含启用状态） */
export function getSkillsWithStatus(): Array<{ name: string; description: string; enabled: boolean }> {
  return _allSkills.map((s) => ({
    name: s.name,
    description: s.description,
    enabled: skillEnabled.get(s.name) !== false,
  }));
}

/** 切换 Skill 启用状态 */
export async function toggleSkill(name: string): Promise<boolean> {
  const current = skillEnabled.get(name) !== false;
  skillEnabled.set(name, !current);

  // 更新 harness resources
  const harness = getHarness();
  const resources = harness.getResources();
  const skills = resources.skills || [];
  if (current) {
    // 禁用：移除该 skill
    const filtered = skills.filter((s) => s.name !== name);
    harness.setResources({ ...resources, skills: filtered });
  } else {
    // 启用：添加该 skill
    const skill = _allSkills.find((s) => s.name === name);
    if (skill) {
      harness.setResources({ ...resources, skills: [...skills, skill] });
    }
  }

  return !current;
}

// === 配置管理 ===

export interface RuntimeConfig {
  provider: string;
  modelId: string;
  hasApiKey: boolean;
}

export function getConfig(): RuntimeConfig {
  return {
    provider: _modelConfig.provider,
    modelId: _modelConfig.modelId,
    hasApiKey: !!_apiKey,
  };
}

export async function updateConfig(config: {
  apiKey?: string;
  provider?: string;
  modelId?: string;
}): Promise<RuntimeConfig> {
  let modelChanged = false;

  if (config.apiKey !== undefined) {
    _apiKey = config.apiKey;
  }
  if (config.provider !== undefined) {
    _modelConfig.provider = config.provider;
    modelChanged = true;
  }
  if (config.modelId !== undefined) {
    _modelConfig.modelId = config.modelId;
    modelChanged = true;
  }

  if (modelChanged && harnessRef?.current) {
    const model = (getModel as any)(_modelConfig.provider, _modelConfig.modelId) as Model<any>;
    await harnessRef.current.setModel(model);
  }

  return getConfig();
}

/** 获取 session 对话历史 */
export async function getSessionMessages(id: string): Promise<AgentMessage[]> {
  const metaList = await _repo.list();
  const target = metaList.find((m) => m.id === id);
  if (!target) throw new Error(`Session ${id} 不存在`);

  const session = await _repo.open(target);
  const entries = await session.getEntries();
  return entries
    .filter((e): e is { type: "message"; message: AgentMessage } & typeof e => e.type === "message")
    .map((e) => e.message);
}
