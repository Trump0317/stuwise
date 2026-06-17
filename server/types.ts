/** 共享类型 */

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

export interface RuntimeConfig {
  provider: string;
  modelId: string;
  hasApiKey: boolean;
}

export interface SkillStatus {
  name: string;
  description: string;
  enabled: boolean;
}

export interface HealthInfo {
  status: string;
  uptime: number;
  model: string;
  tokens: number;
  compactNeeded: boolean;
}

/** API 统一响应 */
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string };
export type ApiResponse<T> = ApiOk<T> | ApiErr;
