import { AgentHarness, formatSkillsForSystemPrompt } from "@earendil-works/pi-agent-core";
import { loadSkillsLocal } from "../skills-loader";
import { getModel, type Model } from "@earendil-works/pi-ai";
import type { Session, JsonlSessionMetadata } from "@earendil-works/pi-agent-core";
import { createAllTools } from "../../tools/index.js";
import { $ } from "./state";

const DEFAULT_SYSTEM_PROMPT = "你是一个友好的学生助理，帮助用户处理日常学习任务。请用中文回复。";

export async function buildHarness(session: Session<JsonlSessionMetadata>): Promise<AgentHarness> {
  const model = (getModel as any)($.modelConfig.provider, $.modelConfig.modelId) as Model<any>;

  const { skills, diagnostics } = loadSkillsLocal("./skills");
  for (const d of diagnostics) console.warn(`[Skill] ${d.message}`);

  $.allSkills = skills.map((s) => ({ name: s.name, description: s.description, content: s.content, filePath: s.filePath }));
  for (const s of $.allSkills) {
    if (!$.skillEnabled.has(s.name)) $.skillEnabled.set(s.name, true);
  }

  const toolDefs = createAllTools($.env!);
  $.allToolNames = toolDefs.map((t) => t.name);
  for (const name of $.allToolNames) {
    if (!$.toolEnabled.has(name)) $.toolEnabled.set(name, true);
  }

  const enabledSkills = skills.filter((s) => $.skillEnabled.get(s.name) !== false);
  const basePrompt = ($.options?.systemPrompt) || DEFAULT_SYSTEM_PROMPT;
  const skillBlock = formatSkillsForSystemPrompt(enabledSkills);
  const systemPrompt = [basePrompt, skillBlock].filter(Boolean).join("\n\n");

  return new AgentHarness({
    env: $.env!,
    session,
    model,
    tools: toolDefs,
    activeToolNames: $.allToolNames.filter((n) => $.toolEnabled.get(n) !== false),
    systemPrompt,
    resources: { skills: enabledSkills },
    getApiKeyAndHeaders: async () => ({ apiKey: $.apiKey }),
  });
}
