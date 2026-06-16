import { AgentHarness, JsonlSessionRepo, loadSkills, formatSkillsForSystemPrompt } from "@earendil-works/pi-agent-core";
import { NodeExecutionEnv } from "@earendil-works/pi-agent-core/node";
import { getModel, type Model } from "@earendil-works/pi-ai";
import type { Session, JsonlSessionMetadata } from "@earendil-works/pi-agent-core";
import { createAllTools } from "../tools/index.js";

export interface CreateHarnessOptions {
  provider: string;
  modelId: string;
  apiKey: string;
  sessionDir?: string;
  systemPrompt?: string;
}

const DEFAULT_SYSTEM_PROMPT = "你是一个友好的学生助理，帮助用户处理日常学习任务。请用中文回复。";
const DEFAULT_SESSION_DIR = "./data/sessions";

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

  // 加载 Skills
  const { skills, diagnostics } = await loadSkills(env, "./skills");
  for (const d of diagnostics) {
    console.warn(`[Skill] ${d.message}`);
  }

  // 组装 System Prompt
  const basePrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const skillBlock = formatSkillsForSystemPrompt(skills);
  const systemPrompt = [basePrompt, skillBlock].filter(Boolean).join("\n\n");

  return new AgentHarness({
    env,
    session,
    model,
    tools: createAllTools(env),
    systemPrompt,
    resources: { skills },
    getApiKeyAndHeaders: async () => ({ apiKey: options.apiKey }),
  });
}
