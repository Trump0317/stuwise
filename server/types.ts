/** 共享类型，前后端通用 */

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
