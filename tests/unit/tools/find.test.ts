import { describe, it, expect, vi } from "vitest";
import { createFindTool } from "../../../tools/find";
import type { ExecutionEnv, FileInfo } from "@earendil-works/pi-agent-core";
import { FileError } from "@earendil-works/pi-agent-core";

const dirFiles: FileInfo[] = [
  { name: "a.txt", path: "/test/a.txt", kind: "file", size: 100, mtimeMs: 0 },
  { name: "b.md", path: "/test/b.md", kind: "file", size: 200, mtimeMs: 0 },
  { name: "c.test.ts", path: "/test/c.test.ts", kind: "file", size: 150, mtimeMs: 0 },
  { name: "sub", path: "/test/sub", kind: "directory", size: 0, mtimeMs: 0 },
];

const subFiles: FileInfo[] = [
  { name: "d.md", path: "/test/sub/d.md", kind: "file", size: 50, mtimeMs: 0 },
];

function mockEnv(overrides: Partial<ExecutionEnv> = {}): ExecutionEnv {
  return {
    cwd: "/test",
    listDir: vi.fn(async (path: string) => {
      if (path === "/test") return { ok: true, value: dirFiles };
      if (path === "/test/sub") return { ok: true, value: subFiles };
      return { ok: true, value: [] };
    }),
    ...overrides,
  } as unknown as ExecutionEnv;
}

describe("createFindTool", () => {
  it("应返回 AgentTool 对象", () => {
    const env = mockEnv();
    const tool = createFindTool(env);
    expect(tool.name).toBe("find");
    expect(tool.label).toBe("查找文件");
    expect(tool.description).toBeTruthy();
    expect(tool.parameters).toBeDefined();
  });

  it("应匹配 *.md 文件", async () => {
    const env = mockEnv();
    const tool = createFindTool(env);

    const result = await tool.execute("call-1", {
      pattern: "*.md",
      path: "/test",
    });

    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("b.md");
    expect(text).toContain("sub/d.md");
    expect(text).not.toContain(".txt");
  });

  it("应匹配 test*.ts 文件", async () => {
    const env = mockEnv({
      cwd: "/test",
      listDir: vi.fn(async (path: string): Promise<any> => {
        if (path === "/test") return { ok: true as const, value: [
          { name: "test-helper.ts", path: "/test/test-helper.ts", kind: "file" as const, size: 100, mtimeMs: 0 },
          { name: "b.md", path: "/test/b.md", kind: "file" as const, size: 200, mtimeMs: 0 },
        ] };
        return { ok: true as const, value: [] };
      }),
    }) as unknown as ExecutionEnv;

    const tool = createFindTool(env);

    const result = await tool.execute("call-1", {
      pattern: "test*.ts",
      path: "/test",
    });

    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("test-helper.ts");
    expect(text).not.toContain("b.md");
  });

  it("无匹配时应返回空", async () => {
    const env = mockEnv();
    const tool = createFindTool(env);

    const result = await tool.execute("call-1", {
      pattern: "*.xyz",
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

    const tool = createFindTool(env);
    await expect(
      tool.execute("call-1", { pattern: "*.txt", path: "/nope" }),
    ).rejects.toThrow();
  });

  it("不传 path 时默认用 cwd", async () => {
    const env = mockEnv();
    const tool = createFindTool(env);

    await tool.execute("call-1", { pattern: "*.txt" });

    expect(env.listDir).toHaveBeenCalledWith("/test", undefined);
  });
});
