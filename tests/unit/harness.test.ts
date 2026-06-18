import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { createHarness, switchSession } from "../../server/harness";
import { $ } from "../../server/harness/state";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

// Mock getModel
const mockModel = {};
const mockGetModel = vi.hoisted(() => vi.fn());
vi.mock("@earendil-works/pi-ai", () => ({
  getModel: mockGetModel,
}));

// Mock pi-agent-core
const MockAgentHarness = vi.hoisted(() =>
  vi.fn(function (this: any, options: any) {
    this._options = options;
    this.getModel = vi.fn().mockReturnValue(options?.model ?? mockModel);
    this.getTools = vi.fn().mockReturnValue(options?.tools ?? []);
    this.subscribe = vi.fn().mockReturnValue(() => {});
    this.prompt = vi.fn();
    this.abort = vi.fn();
    this.getResources = vi.fn().mockReturnValue({ skills: options?.resources?.skills || [] });
    this.setResources = vi.fn();
    this.setModel = vi.fn();
    this.setActiveTools = vi.fn();
  })
);

vi.mock("@earendil-works/pi-agent-core", () => ({
  AgentHarness: MockAgentHarness,
  JsonlSessionRepo: vi.fn(),
  formatSkillsForSystemPrompt: vi.fn().mockReturnValue(""),
}));

vi.mock("@earendil-works/pi-agent-core/node", () => ({
  NodeExecutionEnv: vi.fn().mockImplementation(() => ({ _isMockEnv: true })),
}));

// Mock skills loader — must match path from build.ts (server/harness/build.ts → ../skills-loader)
vi.mock("../../server/skills-loader", () => ({
  loadSkillsLocal: vi.fn().mockReturnValue({ skills: [], diagnostics: [] }),
}));

import { AgentHarness, JsonlSessionRepo, formatSkillsForSystemPrompt } from "@earendil-works/pi-agent-core";
import * as skillsLoader from "../../server/skills-loader";
const { loadSkillsLocal } = skillsLoader as any;

function createMockRepo() {
  const sessions = [{ id: "default", createdAt: new Date().toISOString(), cwd: "./data/sessions", path: "./data/sessions/test.jsonl" }];
  return {
    list: vi.fn().mockResolvedValue(sessions),
    create: vi.fn().mockResolvedValue({ getMetadata: vi.fn().mockResolvedValue(sessions[0]), appendMessage: vi.fn(), appendCustomEntry: vi.fn(), appendSessionName: vi.fn(), getEntries: vi.fn().mockResolvedValue([]) }),
    open: vi.fn().mockResolvedValue({ getMetadata: vi.fn().mockResolvedValue(sessions[0]), appendMessage: vi.fn(), appendCustomEntry: vi.fn(), appendSessionName: vi.fn(), getEntries: vi.fn().mockResolvedValue([]) }),
  };
}

describe("createHarness — 集成测试", () => {
  let tempDir: string;
  let sessionDir: string;
  const baseOptions = { provider: "deepseek", modelId: "deepseek-v4-flash", apiKey: "sk-test", systemPrompt: "测试" };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetModel.mockReturnValue(mockModel);
    vi.mocked(loadSkillsLocal).mockReturnValue({ skills: [], diagnostics: [] });
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "stuwise-tst-"));
    sessionDir = path.join(tempDir, "sessions");
    await fs.mkdir(sessionDir, { recursive: true });
    vi.mocked(JsonlSessionRepo).mockImplementation(() => createMockRepo() as any);
    $.harnessRef = null;
    $.currentSessionPath = null;
    $.repo = null;
  });

  afterAll(async () => {
    try { await fs.rm(tempDir, { recursive: true, force: true }); } catch {}
  });

  it("应成功创建 AgentHarness 并设置 harnessRef", async () => {
    const h = await createHarness({ ...baseOptions, sessionDir });
    expect(MockAgentHarness).toHaveBeenCalled();
    expect($.harnessRef).not.toBeNull();
  });

  it("应调用 loadSkillsLocal 加载 skills 目录", async () => {
    await createHarness({ ...baseOptions, sessionDir });
    expect(loadSkillsLocal).toHaveBeenCalled();
    expect(loadSkillsLocal.mock.calls[0][0]).toBe("./skills");
  });

  it("resources.skills 应为 loadSkillsLocal 返回的 skills", async () => {
    const mockSkills = [{ name: "test", description: "t", content: "# t", filePath: "/t/SKILL.md" }];
    vi.mocked(loadSkillsLocal).mockReturnValue({ skills: mockSkills, diagnostics: [] });
    await createHarness({ ...baseOptions, sessionDir });
    expect(MockAgentHarness.mock.calls[0]![0].resources?.skills).toEqual(mockSkills);
  });
});
