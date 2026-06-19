import { getModel, type Model } from "@earendil-works/pi-ai";
import { $ } from "./state";
import type { RuntimeConfig } from "../types";

export function getConfig(): RuntimeConfig {
  return { provider: $.modelConfig.provider, modelId: $.modelConfig.modelId, hasApiKey: !!$.apiKey };
}

export async function updateConfig(c: { apiKey?: string; provider?: string; modelId?: string }): Promise<RuntimeConfig> {
  let ch = false;
  if (c.apiKey !== undefined) $.apiKey = c.apiKey;
  if (c.provider !== undefined) { $.modelConfig.provider = c.provider; ch = true; }
  if (c.modelId !== undefined) { $.modelConfig.modelId = c.modelId; ch = true; }
  if (ch && $.harnessRef?.current) {
    try {
      const model = (getModel as any)($.modelConfig.provider, $.modelConfig.modelId);
      if (!model) throw new Error(`模型不存在: ${$.modelConfig.provider}/${$.modelConfig.modelId}`);
      await $.harnessRef.current.setModel(model as Model<any>);
    } catch (err) {
      throw new Error(`模型切换失败: ${(err as Error).message}`);
    }
  }
  return getConfig();
}
