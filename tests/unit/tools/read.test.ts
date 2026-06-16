import { describe, it, expect, vi } from "vitest";
import { createReadTool } from "../../../tools/read";
import type { ExecutionEnv } from "@earendil-works/pi-agent-core";
import { FileError } from "@earendil-works/pi-agent-core";

function mockEnv(overrides: Partial<ExecutionEnv> = {}): ExecutionEnv {
  return {
    cwd: "/test",
    readTextFile: vi.fn().mockResolvedValue({ ok: true, value: "hello world" }),
    readTextLines: vi.fn().mockResolvedValue({ ok: true, value: ["line1", "line2"] }),
    readBinaryFile: vi.fn().mockResolvedValue({ ok: true, value: new Uint8Array() }),
    absolutePath: vi.fn(async (p: string) => ({ ok: true, value: `/absolute${p}` })),
    joinPath: vi.fn(async (...parts: string[]) => ({ ok: true, value: parts.join("/") })),
    ...overrides,
  } as unknown as ExecutionEnv;
}

describe("createReadTool", () => {
  it("应返回 AgentTool 对象，包含 name、label、description、parameters", () => {
    const env = mockEnv();
    const tool = createReadTool(env);
    expect(tool.name).toBe("read");
    expect(tool.label).toBe("读取文件");
    expect(tool.description).toBeTruthy();
    expect(tool.parameters).toBeDefined();
  });

  it("正常读取文件应返回内容", async () => {
    const env = mockEnv();
    const tool = createReadTool(env);

    const result = await tool.execute("call-1", { path: "/test/file.txt" });

    expect(env.readTextFile).toHaveBeenCalledWith("/test/file.txt", undefined);
    expect(result.content).toEqual([{ type: "text", text: "hello world" }]);
  });

  it("文件不存在时应抛出错误", async () => {
    const env = mockEnv({
      readTextFile: vi.fn().mockResolvedValue({
        ok: false,
        error: new FileError("not_found", "file not found", "/test/missing.txt"),
      }),
    });

    const tool = createReadTool(env);
    await expect(tool.execute("call-1", { path: "/test/missing.txt" })).rejects.toThrow();
  });

  it("应支持 offset 和 limit 参数", async () => {
    const env = mockEnv({
      readTextLines: vi.fn().mockResolvedValue({
        ok: true,
        value: ["line1", "line2", "line3", "line4", "line5"],
      }),
    });

    const tool = createReadTool(env);
    const result = await tool.execute("call-1", {
      path: "/test/file.txt",
      offset: 3,
      limit: 3,
    });

    expect(env.readTextLines).toHaveBeenCalledWith("/test/file.txt", expect.objectContaining({
      maxLines: 5, // start+count-1 = 3+3-1
      abortSignal: undefined,
    }));
    expect(result.content).toEqual([{ type: "text", text: "line3\nline4\nline5" }]);
  });

  it("内容超 2000 行时应截断", async () => {
    const lines = Array.from({ length: 3000 }, (_, i) => `line${i + 1}`);
    const largeContent = lines.join("\n");
    const env = mockEnv({
      readTextFile: vi.fn().mockResolvedValue({ ok: true, value: largeContent }),
    });

    const tool = createReadTool(env);
    const result = await tool.execute("call-1", { path: "/test/large.txt" });

    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("...(截断)");
  });

  it("内容超 50KB 字符时应截断", async () => {
    // 创建超过 50KB 的内容
    const longLine = "a".repeat(100);
    const lines: string[] = [];
    for (let i = 0; i < 600; i++) {
      lines.push(`${longLine}${i}`);
    }
    const largeContent = lines.join("\n");

    const env = mockEnv({
      readTextFile: vi.fn().mockResolvedValue({
        ok: true,
        value: largeContent,
      }),
    });

    const tool = createReadTool(env);
    const result = await tool.execute("call-1", { path: "/test/large.txt" });

    const text2 = (result.content[0] as { type: string; text: string }).text;
    expect(text2.length).toBeLessThanOrEqual(50 * 1024);
    expect(text2).toContain("...(截断)");
  });

  it("应处理二进制文件（图片）", async () => {
    const binaryData = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG header
    const env = mockEnv({
      readBinaryFile: vi.fn().mockResolvedValue({ ok: true, value: binaryData }),
    });

    const tool = createReadTool(env);
    const result = await tool.execute("call-1", { path: "/test/image.png" });

    // 图片返回 image content
    expect(result.content[0].type).toBe("image");
  });

  it("不传参数应使用默认值（无 offset/limit）", async () => {
    const env = mockEnv();
    const tool = createReadTool(env);

    // 只传 path，不传 offset/limit
    await tool.execute("call-1", { path: "/test/file.txt" });

    expect(env.readTextFile).toHaveBeenCalledWith("/test/file.txt", undefined);
  });
});
