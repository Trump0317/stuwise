import { describe, it, expect, vi, beforeEach } from "vitest";

const mockModel = {
  id: "claude-3-7-sonnet-20250219",
  name: "Claude Sonnet 3.7",
  api: "anthropic-messages" as const,
  provider: "anthropic",
  baseUrl: "https://api.anthropic.com",
  reasoning: true,
  input: ["text", "image"] as ("text" | "image")[],
  cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  contextWindow: 200000,
  maxTokens: 8192,
} as any;

const mockSessionMetadata = {
  id: "session-1",
  createdAt: "2025-01-01T00:00:00.000Z",
  cwd: "./data/sessions",
  path: "./data/sessions/session.jsonl",
};

function createMockRepo(options: { existingSessions?: typeof mockSessionMetadata[] } = {}) {
  return {
    list: vi.fn().mockResolvedValue(options.existingSessions ?? []),
    create: vi.fn().mockResolvedValue({}),
    open: vi.fn().mockResolvedValue({}),
  };
}

vi.mock("@earendil-works/pi-ai", () => ({
  getModel: vi.fn(),
}));

vi.mock("@earendil-works/pi-agent-core", () => {
  const MockAgentHarness = vi.fn(function (this: any, options: any) {
    this._options = options;
    this.getModel = vi.fn().mockReturnValue(options?.model ?? mockModel);
    this.getTools = vi.fn().mockReturnValue(options?.tools ?? []);
    this.subscribe = vi.fn().mockReturnValue(() => {});
    this.prompt = vi.fn();
    this.abort = vi.fn();
  });
  return {
    AgentHarness: MockAgentHarness,
    JsonlSessionRepo: vi.fn(),
  };
});

vi.mock("@earendil-works/pi-agent-core/node", () => ({
  NodeExecutionEnv: vi.fn().mockImplementation(() => ({ _isMockEnv: true })),
}));

import { createHarness } from "../../server/harness";
import { getModel } from "@earendil-works/pi-ai";
import { JsonlSessionRepo, AgentHarness } from "@earendil-works/pi-agent-core";
import { NodeExecutionEnv } from "@earendil-works/pi-agent-core/node";

const baseOptions = {
  provider: "anthropic",
  modelId: "claude-3-7-sonnet-20250219",
  apiKey: "sk-test",
};

describe("createHarness — 核心功能", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getModel).mockReturnValue(mockModel);
    vi.mocked(JsonlSessionRepo).mockImplementation(() => createMockRepo() as any);
  });

  it("应返回 AgentHarness 实例", async () => {
    const harness = await createHarness(baseOptions);
    expect(harness).toBeDefined();
    expect(AgentHarness).toHaveBeenCalledTimes(1);
  });

  it("应调用 getModel 传入正确的 provider 和 modelId", async () => {
    await createHarness({ provider: "openai", modelId: "gpt-4o", apiKey: "sk-xxx" });
    expect(getModel).toHaveBeenCalledWith("openai", "gpt-4o");
  });

  it("应将 getModel 返回的 model 传给 AgentHarness", async () => {
    const customModel = { ...mockModel, id: "custom-model" };
    vi.mocked(getModel).mockReturnValue(customModel);

    await createHarness(baseOptions);
    const harnessOptions = vi.mocked(AgentHarness).mock.calls[0][0];
    expect(harnessOptions.model).toBe(customModel);
  });

  it("工具列表应为空", async () => {
    await createHarness(baseOptions);
    const harnessOptions = vi.mocked(AgentHarness).mock.calls[0][0];
    expect(harnessOptions.tools).toEqual([]);
  });

  it("应使用 NodeExecutionEnv 创建执行环境", async () => {
    await createHarness(baseOptions);
    expect(NodeExecutionEnv).toHaveBeenCalledWith({ cwd: process.cwd() });
  });

  it("JsonlSessionRepo 应传入 fs(env) 和 sessionsRoot", async () => {
    await createHarness(baseOptions);
    expect(JsonlSessionRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        fs: expect.any(Object),
        sessionsRoot: "./data/sessions",
      })
    );
  });
});

describe("createHarness — Session 生命周期", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getModel).mockReturnValue(mockModel);
  });

  it("无已有 session 时应调用 create 创建新 session", async () => {
    const mockRepo = createMockRepo({ existingSessions: [] });
    vi.mocked(JsonlSessionRepo).mockImplementation(() => mockRepo as any);

    await createHarness(baseOptions);

    expect(mockRepo.list).toHaveBeenCalled();
    expect(mockRepo.create).toHaveBeenCalledWith({ cwd: "./data/sessions" });
    expect(mockRepo.open).not.toHaveBeenCalled();
  });

  it("有已有 session 时应调用 open 打开已有 session", async () => {
    const mockRepo = createMockRepo({ existingSessions: [mockSessionMetadata] });
    vi.mocked(JsonlSessionRepo).mockImplementation(() => mockRepo as any);

    await createHarness(baseOptions);

    expect(mockRepo.list).toHaveBeenCalled();
    expect(mockRepo.open).toHaveBeenCalledWith(mockSessionMetadata);
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("自定义 sessionDir 应为 create 和 JsonlSessionRepo 使用", async () => {
    const mockRepo = createMockRepo({ existingSessions: [] });
    vi.mocked(JsonlSessionRepo).mockImplementation(() => mockRepo as any);

    await createHarness({ ...baseOptions, sessionDir: "/custom/sessions" });

    expect(JsonlSessionRepo).toHaveBeenCalledWith(
      expect.objectContaining({ sessionsRoot: "/custom/sessions" })
    );
    expect(mockRepo.create).toHaveBeenCalledWith({ cwd: "/custom/sessions" });
  });

  it("不传 sessionDir 时应使用默认值 ./data/sessions", async () => {
    const mockRepo = createMockRepo({ existingSessions: [] });
    vi.mocked(JsonlSessionRepo).mockImplementation(() => mockRepo as any);

    await createHarness(baseOptions); // 不传 sessionDir

    expect(JsonlSessionRepo).toHaveBeenCalledWith(
      expect.objectContaining({ sessionsRoot: "./data/sessions" })
    );
  });
});

describe("createHarness — System Prompt 和 API Key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getModel).mockReturnValue(mockModel);
    vi.mocked(JsonlSessionRepo).mockImplementation(() => createMockRepo() as any);
  });

  it("默认 System Prompt 应包含学生助理和中文", async () => {
    await createHarness(baseOptions);
    const harnessOptions = vi.mocked(AgentHarness).mock.calls[0][0];
    expect(harnessOptions.systemPrompt).toContain("学生助理");
    expect(harnessOptions.systemPrompt).toContain("中文");
  });

  it("应支持自定义 System Prompt", async () => {
    const customPrompt = "自定义提示词";
    await createHarness({ ...baseOptions, systemPrompt: customPrompt });
    const harnessOptions = vi.mocked(AgentHarness).mock.calls[0][0];
    expect(harnessOptions.systemPrompt).toBe(customPrompt);
  });

  it("getApiKeyAndHeaders 应返回 apiKey", async () => {
    await createHarness({ ...baseOptions, apiKey: "sk-my-key" });
    const harnessOptions = vi.mocked(AgentHarness).mock.calls[0][0];
    const fn = harnessOptions.getApiKeyAndHeaders!;
    const result = await fn(mockModel);
    expect(result).toEqual({ apiKey: "sk-my-key" });
  });

  it("空 apiKey 时 getApiKeyAndHeaders 应返回空字符串", async () => {
    await createHarness({ ...baseOptions, apiKey: "" });
    const harnessOptions = vi.mocked(AgentHarness).mock.calls[0][0];
    const fn = harnessOptions.getApiKeyAndHeaders!;
    const result = await fn(mockModel);
    expect(result).toEqual({ apiKey: "" });
  });
});
