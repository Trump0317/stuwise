import { describe, it, expect, vi } from "vitest";
import { createWriteTool } from "../../../tools/write";
import type { ExecutionEnv } from "@earendil-works/pi-agent-core";
import { FileError } from "@earendil-works/pi-agent-core";

function mockEnv(overrides: Partial<ExecutionEnv> = {}): ExecutionEnv {
  return {
    cwd: "/test",
    writeFile: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
    absolutePath: vi.fn(async (p: string) => ({ ok: true, value: `/absolute${p}` })),
    joinPath: vi.fn(async (...parts: string[]) => ({ ok: true, value: parts.join("/") })),
    ...overrides,
  } as unknown as ExecutionEnv;
}

describe("createWriteTool", () => {
  it("应返回 AgentTool 对象，包含 name、label、description、parameters", () => {
    const env = mockEnv();
    const tool = createWriteTool(env);
    expect(tool.name).toBe("write");
    expect(tool.label).toBe("写入文件");
    expect(tool.description).toBeTruthy();
    expect(tool.parameters).toBeDefined();
  });

  it("正常写入文件应返回成功", async () => {
    const env = mockEnv();
    const tool = createWriteTool(env);

    const result = await tool.execute("call-1", {
      path: "/test/new.txt",
      content: "hello",
    });

    expect(env.writeFile).toHaveBeenCalledWith("/test/new.txt", "hello", undefined);
    expect(result.content).toEqual([
      { type: "text", text: "文件已写入: /test/new.txt" },
    ]);
  });

  it("写入失败时应抛出错误", async () => {
    const env = mockEnv({
      writeFile: vi.fn().mockResolvedValue({
        ok: false,
        error: new FileError("permission_denied", "permission denied", "/test/readonly.txt"),
      }),
    });

    const tool = createWriteTool(env);
    await expect(
      tool.execute("call-1", { path: "/test/readonly.txt", content: "x" }),
    ).rejects.toThrow();
  });

  it("应支持覆盖已有文件", async () => {
    const env = mockEnv();
    const tool = createWriteTool(env);

    await tool.execute("call-1", { path: "/test/existing.txt", content: "new content" });

    expect(env.writeFile).toHaveBeenCalledWith(
      "/test/existing.txt",
      "new content",
      undefined,
    );
  });
});
