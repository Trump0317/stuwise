import { describe, it, expect, vi } from "vitest";
import { createLsTool } from "../../../tools/ls";
import type { ExecutionEnv, FileInfo } from "@earendil-works/pi-agent-core";
import { FileError } from "@earendil-works/pi-agent-core";

function mockEnv(overrides: Partial<ExecutionEnv> = {}): ExecutionEnv {
  return {
    cwd: "/test",
    listDir: vi.fn().mockResolvedValue({ ok: true, value: [] as FileInfo[] }),
    ...overrides,
  } as unknown as ExecutionEnv;
}

const sampleFiles: FileInfo[] = [
  { name: "a.txt", path: "/test/a.txt", kind: "file", size: 100, mtimeMs: 0 },
  { name: "b.md", path: "/test/b.md", kind: "file", size: 200, mtimeMs: 0 },
  { name: "sub", path: "/test/sub", kind: "directory", size: 0, mtimeMs: 0 },
];

describe("createLsTool", () => {
  it("应返回 AgentTool 对象", () => {
    const env = mockEnv();
    const tool = createLsTool(env);
    expect(tool.name).toBe("ls");
    expect(tool.label).toBe("列出目录");
    expect(tool.description).toBeTruthy();
    expect(tool.parameters).toBeDefined();
  });

  it("列出目录文件和子目录", async () => {
    const env = mockEnv({
      listDir: vi.fn().mockResolvedValue({ ok: true, value: sampleFiles }),
    });

    const tool = createLsTool(env);
    const result = await tool.execute("call-1", { path: "/test" });

    expect(env.listDir).toHaveBeenCalledWith("/test", undefined);
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("a.txt");
    expect(text).toContain("b.md");
    expect(text).toContain("sub/"); // 目录加 /
  });

  it("不传 path 时默认用 cwd", async () => {
    const env = mockEnv({
      listDir: vi.fn().mockResolvedValue({ ok: true, value: [] }),
    });

    const tool = createLsTool(env);
    await tool.execute("call-1", {});

    expect(env.listDir).toHaveBeenCalledWith("/test", undefined);
  });

  it("路径不存在时应抛出错误", async () => {
    const env = mockEnv({
      listDir: vi.fn().mockResolvedValue({
        ok: false,
        error: new FileError("not_found", "directory not found", "/test/nope"),
      }),
    });

    const tool = createLsTool(env);
    await expect(
      tool.execute("call-1", { path: "/test/nope" }),
    ).rejects.toThrow();
  });

  it("空目录应返回空", async () => {
    const env = mockEnv();

    const tool = createLsTool(env);
    const result = await tool.execute("call-1", { path: "/test/empty" });

    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toBe("");
  });
});
