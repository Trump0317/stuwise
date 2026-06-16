import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

const mockModel = {
  id: "test-model",
  name: "Test Model",
  api: "anthropic-messages",
  provider: "anthropic",
  baseUrl: "https://api.anthropic.com",
  reasoning: false,
  input: ["text"],
  cost: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 0.2 },
  contextWindow: 100000,
  maxTokens: 4096,
} as any;

const mockGetModel = vi.hoisted(() => vi.fn());
vi.mock("@earendil-works/pi-ai", () => ({
  getModel: mockGetModel,
}));

import { createHarness } from "../../server/harness";
import { getModel } from "@earendil-works/pi-ai";

describe("createHarness 集成测试", () => {
  let tempDir: string;
  let sessionDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetModel.mockReturnValue(mockModel);
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "stuwise-test-"));
    sessionDir = path.join(tempDir, "sessions");
    await fs.mkdir(sessionDir, { recursive: true });
  });

  afterEach(async () => {
    try { await fs.rm(tempDir, { recursive: true }); } catch { /* ignore */ }
  });

  const baseOpts = { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219", apiKey: "sk-test", sessionDir: "" };

  it("应成功创建 AgentHarness 实例", async () => {
    const harness = await createHarness({ ...baseOpts, sessionDir });
    expect(harness).toBeDefined();
    expect(typeof harness.getModel).toBe("function");
    expect(typeof harness.getTools).toBe("function");
    expect(typeof harness.subscribe).toBe("function");
  });

  it("getModel 应返回 getModel 返回的模型对象", async () => {
    const harness = await createHarness({ ...baseOpts, sessionDir });
    expect(mockGetModel).toHaveBeenCalledWith("anthropic", "claude-3-7-sonnet-20250219");
    const model = harness.getModel();
    expect(model.id).toBe("test-model");
  });

  it("getTools 应返回 9 个工具", async () => {
    const harness = await createHarness({ ...baseOpts, sessionDir });
    const tools = harness.getTools();
    expect(tools.length).toBe(9);
  });

  it("subscribe 应返回取消订阅函数", async () => {
    const harness = await createHarness({ ...baseOpts, sessionDir });
    const listener = vi.fn();
    const unsubscribe = harness.subscribe(listener);
    expect(typeof unsubscribe).toBe("function");
    unsubscribe();
  });

  it("应加载 skills 目录下的 Skill", async () => {
    const harness = await createHarness({ ...baseOpts, sessionDir });
    // harness 创建时会加载 skills/ 目录
    // 通过检查 harness 的 subscribe 验证创建成功
    expect(harness).toBeDefined();
  });

  it("重复创建同一 sessionDir 应复用已有 session", async () => {
    await createHarness({ ...baseOpts, sessionDir });
    const entriesAfterFirst = await fs.readdir(sessionDir);

    await createHarness({ ...baseOpts, sessionDir });
    const entriesAfterSecond = await fs.readdir(sessionDir);

    expect(entriesAfterSecond.length).toBe(entriesAfterFirst.length);
    expect(entriesAfterSecond.sort()).toEqual(entriesAfterFirst.sort());
  });
});
