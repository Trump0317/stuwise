import { describe, it, expect, vi } from "vitest";
import { createAllTools } from "../../../tools/index";
import type { ExecutionEnv } from "@earendil-works/pi-agent-core";

function mockEnv(): ExecutionEnv {
  return {
    cwd: "/test",
    readTextFile: vi.fn().mockResolvedValue({ ok: true, value: "" }),
    readTextLines: vi.fn().mockResolvedValue({ ok: true, value: [] }),
    readBinaryFile: vi.fn().mockResolvedValue({ ok: true, value: new Uint8Array() }),
    writeFile: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
    listDir: vi.fn().mockResolvedValue({ ok: true, value: [] }),
    exec: vi.fn().mockResolvedValue({ ok: true, value: { stdout: "", stderr: "", exitCode: 0 } }),
  } as unknown as ExecutionEnv;
}

describe("createAllTools", () => {
  it("应返回 9 个 AgentTool", () => {
    const env = mockEnv();
    const tools = createAllTools(env);
    expect(tools).toHaveLength(9);
  });

  it("每个工具应有 name 和 label", () => {
    const env = mockEnv();
    const tools = createAllTools(env);
    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.label).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.parameters).toBeDefined();
      expect(typeof tool.execute).toBe("function");
    }
  });

  it("应包含所有 9 个工具名的名称", () => {
    const env = mockEnv();
    const tools = createAllTools(env);
    const names = tools.map((t) => t.name);
    expect(names).toContain("read");
    expect(names).toContain("write");
    expect(names).toContain("edit");
    expect(names).toContain("ls");
    expect(names).toContain("grep");
    expect(names).toContain("find");
    expect(names).toContain("bash");
    expect(names).toContain("web_search");
    expect(names).toContain("web_fetch");
  });
});
