import { getEnvApiKey } from "@earendil-works/pi-ai";

const provider = process.env.LLM_PROVIDER || "anthropic";

export const config = {
  port: 3000,
  model: {
    provider,
    modelId: process.env.LLM_MODEL || "claude-3-7-sonnet-20250219",
  },
  sessionDir: "./data/sessions",
  skillsDir: "./skills",

  /** 懒求值：在 harness 创建时才读取环境变量，确保 .env 已加载 */
  getApiKey(): string {
    return getEnvApiKey(provider) || "";
  },
};
