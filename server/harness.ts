import { AgentHarness, JsonlSessionRepo, loadSkills, formatSkillsForSystemPrompt } from "@earendil-works/pi-agent-core";
import { NodeExecutionEnv } from "@earendil-works/pi-agent-core/node";
import { getModel, type Model } from "@earendil-works/pi-ai";
import type { Session, JsonlSessionMetadata } from "@earendil-works/pi-agent-core";
import { createAllTools } from "../tools/index.js";
import fs from "node:fs/promises";

export interface CreateHarnessOptions {
  provider: string;
  modelId: string;
  apiKey: string;
  sessionDir?: string;
  systemPrompt?: string;
}

const DEFAULT_SYSTEM_PROMPT = "你是一个友好的学生助理，帮助用户处理日常学习任务。请用中文回复。";
const DEFAULT_SESSION_DIR = "./data/sessions";

/** 当前 session 的 JSONL 文件路径 */
let currentSessionPath: string | null = null;

/** 会话 entry 数超过此阈值时自动 compact */
const COMPACT_THRESHOLD = 80;

/**
 * 检查当前 session 是否需要 compact。
 * 通过读取 JSONL 文件行数估算，超过阈值返回 true。
 */
export async function shouldCompact(): Promise<boolean> {
  if (!currentSessionPath) return false;
  try {
    const content = await fs.readFile(currentSessionPath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    // 第 1 行是 header，其余是 entries；每个 message-pair 约 2-3 个 entry
    // 保守估算：entries > COMPACT_THRESHOLD 时触发
    return lines.length - 1 > COMPACT_THRESHOLD;
  } catch {
    return false;
  }
}

export async function createHarness(options: CreateHarnessOptions) {
  // provider/modelId 来自运行时配置（环境变量），类型断言绕过泛型约束
  const model = (getModel as any)(options.provider, options.modelId) as Model<any>;
  const env = new NodeExecutionEnv({ cwd: process.cwd() });

  const sessionDir = options.sessionDir || DEFAULT_SESSION_DIR;
  const repo = new JsonlSessionRepo({ fs: env, sessionsRoot: sessionDir });

  const sessions = await repo.list();
  let session: Session<JsonlSessionMetadata>;
  if (sessions.length > 0) {
    session = await repo.open(sessions[0]);
  } else {
    session = await repo.create({ cwd: sessionDir });
  }

  // 记录 session 路径供 compact 检查
  const meta = await session.getMetadata();
  currentSessionPath = (meta as JsonlSessionMetadata).path;

  // 加载 Skills
  const { skills, diagnostics } = await loadSkills(env, "./skills");
  for (const d of diagnostics) {
    console.warn(`[Skill] ${d.message}`);
  }

  // 组装 System Prompt
  const basePrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const skillBlock = formatSkillsForSystemPrompt(skills);
  const systemPrompt = [basePrompt, skillBlock].filter(Boolean).join("\n\n");

  const harness =  new AgentHarness({
    env,
    session,
    model,
    tools: createAllTools(env),
    systemPrompt,
    resources: { skills },
    getApiKeyAndHeaders: async () => ({ apiKey: options.apiKey }),
  });

  return harness;
}

/**
 * 检查当前 session 是否需要 compact，超过阈值自动压缩。
 * 返回 compaction 结果或 null（未触发）
 */
export async function autoCompactSession(harness: AgentHarness) {
  const needed = await shouldCompact();
  if (!needed) return null;

  try {
    console.log("[compact] 会话条目超过阈值，自动压缩...");
    const result = await harness.compact();
    console.log(
      `[compact] 完成: ${result.summary.substring(0, 80)}... (tokensBefore: ${result.tokensBefore})`,
    );
    return result;
  } catch (err) {
    console.error("[compact] 自动压缩失败:", err);
    return null;
  }
}
