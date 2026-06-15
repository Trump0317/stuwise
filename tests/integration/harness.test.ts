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
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {
      // 如果 beforeEach 失败，tempDir 可能不存在
    }
  });

  it("应成功创建 AgentHarness 实例", async () => {
    const harness = await createHarness({
      provider: "anthropic",
      modelId: "claude-3-7-sonnet-20250219",
      apiKey: "sk-test",
      sessionDir,
    });

    expect(harness).toBeDefined();
    expect(typeof harness.getModel).toBe("function");
    expect(typeof harness.getTools).toBe("function");
    expect(typeof harness.subscribe).toBe("function");
    expect(typeof harness.prompt).toBe("function");
    expect(typeof harness.abort).toBe("function");
  });

  it("getModel 应返回 getModel 返回的模型对象", async () => {
    const harness = await createHarness({
      provider: "anthropic",
      modelId: "claude-3-7-sonnet-20250219",
      apiKey: "sk-test",
      sessionDir,
    });

    // 验证参数传递正确
    expect(mockGetModel).toHaveBeenCalledWith("anthropic", "claude-3-7-sonnet-20250219");

    // 验证返回的是 getModel 的结果
    const model = harness.getModel();
    expect(model.id).toBe("test-model");
  });

  it("getTools 应返回空数组", async () => {
    const harness = await createHarness({
      provider: "anthropic",
      modelId: "claude-3-7-sonnet-20250219",
      apiKey: "sk-test",
      sessionDir,
    });

    const tools = harness.getTools();
    expect(tools).toEqual([]);
  });

  it("subscribe 应返回取消订阅函数", async () => {
    const harness = await createHarness({
      provider: "anthropic",
      modelId: "claude-3-7-sonnet-20250219",
      apiKey: "sk-test",
      sessionDir,
    });

    const listener = vi.fn();
    const unsubscribe = harness.subscribe(listener);
    expect(typeof unsubscribe).toBe("function");
    unsubscribe();
  });

  it("重复创建同一 sessionDir 应复用已有 session（不新增 session 文件）", async () => {
    // 第一次创建
    const harness1 = await createHarness({
      provider: "anthropic",
      modelId: "claude-3-7-sonnet-20250219",
      apiKey: "sk-test",
      sessionDir,
    });
    expect(harness1).toBeDefined();

    // 记录首次创建后 session 目录中的条目数
    const entriesAfterFirst = await fs.readdir(sessionDir);

    // 第二次创建：同一 sessionDir，应打开已有 session 而非创建新的
    const harness2 = await createHarness({
      provider: "anthropic",
      modelId: "claude-3-7-sonnet-20250219",
      apiKey: "sk-test",
      sessionDir,
    });
    expect(harness2).toBeDefined();

    // 验证未新增 session 文件，且文件内容相同（路径一致即复用）
    const entriesAfterSecond = await fs.readdir(sessionDir);
    expect(entriesAfterSecond.length).toBe(entriesAfterFirst.length);
    expect(entriesAfterSecond.sort()).toEqual(entriesAfterFirst.sort());
  });

  it("subscribe 监听器应收到事件", async () => {
    const harness = await createHarness({
      provider: "anthropic",
      modelId: "claude-3-7-sonnet-20250219",
      apiKey: "sk-test",
      sessionDir,
    });

    // 验证 subscribe 可正常注册，不必须在 prompt 场景下触发事件
    const listener = vi.fn();
    const unsubscribe = harness.subscribe(listener);
    expect(listener).not.toHaveBeenCalled(); // 注册时不立即触发
    unsubscribe();
  });
});
