import { describe, it, expect, vi } from "vitest";
import { createGrepTool } from "../../../tools/grep";
import type { ExecutionEnv, FileInfo } from "@earendil-works/pi-agent-core";
import { FileError } from "@earendil-works/pi-agent-core";

const dirFiles: FileInfo[] = [
  { name: "a.txt", path: "/test/a.txt", kind: "file", size: 100, mtimeMs: 0 },
  { name: "b.md", path: "/test/b.md", kind: "file", size: 200, mtimeMs: 0 },
  { name: "sub", path: "/test/sub", kind: "directory", size: 0, mtimeMs: 0 },
];

const subFiles: FileInfo[] = [
  { name: "c.txt", path: "/test/sub/c.txt", kind: "file", size: 50, mtimeMs: 0 },
];

function mockEnv(overrides: Partial<ExecutionEnv> = {}): ExecutionEnv {
  return {
    cwd: "/test",
    listDir: vi.fn(async (path: string) => {
      if (path === "/test") return { ok: true, value: dirFiles };
      if (path === "/test/sub") return { ok: true, value: subFiles };
      return { ok: true, value: [] };
    }),
    readTextLines: vi.fn(async (path: string) => {
      if (path === "/test/a.txt") return { ok: true, value: ["hello world", "foo bar"] };
      if (path === "/test/b.md") return { ok: true, value: ["# Title", "hello again"] };
      if (path === "/test/sub/c.txt") return { ok: true, value: ["nested hello"] };
      return { ok: true, value: [] };
    }),
    ...overrides,
  } as unknown as ExecutionEnv;
}

describe("createGrepTool", () => {
  it("应返回 AgentTool 对象", () => {
    const env = mockEnv();
    const tool = createGrepTool(env);
    expect(tool.name).toBe("grep");
    expect(tool.label).toBe("搜索文本");
    expect(tool.description).toBeTruthy();
    expect(tool.parameters).toBeDefined();
  });

  it("应递归搜索匹配行", async () => {
    const env = mockEnv();
    const tool = createGrepTool(env);

    const result = await tool.execute("call-1", {
      pattern: "hello",
      path: "/test",
    });

    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("a.txt:1: hello world");
    expect(text).toContain("b.md:2: hello again");
    expect(text).toContain("sub/c.txt:1: nested hello");
  });

  it("无匹配时应返回空", async () => {
    const env = mockEnv();
    const tool = createGrepTool(env);

    const result = await tool.execute("call-1", {
      pattern: "nonexistent",
      path: "/test",
    });

    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toBe("");
  });

  it("路径不存在时应抛出错误", async () => {
    const env = mockEnv({
      listDir: vi.fn().mockResolvedValue({
        ok: false,
        error: new FileError("not_found", "not found", "/nope"),
      }),
    });

    const tool = createGrepTool(env);
    await expect(
      tool.execute("call-1", { pattern: "x", path: "/nope" }),
    ).rejects.toThrow();
  });

  it("不传 path 时默认用 cwd", async () => {
    const env = mockEnv();
    const tool = createGrepTool(env);

    await tool.execute("call-1", { pattern: "hello" });

    expect(env.listDir).toHaveBeenCalledWith("/test", undefined);
  });
});
