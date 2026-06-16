import { describe, it, expect, vi } from "vitest";
import { createEditTool } from "../../../tools/edit";
import type { ExecutionEnv } from "@earendil-works/pi-agent-core";
import { FileError } from "@earendil-works/pi-agent-core";

function mockEnv(overrides: Partial<ExecutionEnv> = {}): ExecutionEnv {
  return {
    cwd: "/test",
    readTextFile: vi.fn().mockResolvedValue({ ok: true, value: "hello world" }),
    writeFile: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
    ...overrides,
  } as unknown as ExecutionEnv;
}

describe("createEditTool", () => {
  it("应返回 AgentTool 对象", () => {
    const env = mockEnv();
    const tool = createEditTool(env);
    expect(tool.name).toBe("edit");
    expect(tool.label).toBe("编辑文件");
    expect(tool.description).toBeTruthy();
    expect(tool.parameters).toBeDefined();
  });

  it("单次替换应正确", async () => {
    const env = mockEnv({
      readTextFile: vi.fn().mockResolvedValue({
        ok: true,
        value: "hello world",
      }),
    });

    const tool = createEditTool(env);
    const result = await tool.execute("call-1", {
      path: "/test/file.txt",
      edits: [{ oldText: "hello", newText: "hi" }],
    });

    expect(env.readTextFile).toHaveBeenCalledWith("/test/file.txt", undefined);
    expect(env.writeFile).toHaveBeenCalledWith("/test/file.txt", "hi world", undefined);
    expect(result.content).toEqual([{ type: "text", text: "已应用 1 处修改" }]);
  });

  it("多次替换应正确", async () => {
    const env = mockEnv({
      readTextFile: vi.fn().mockResolvedValue({
        ok: true,
        value: "aaa bbb ccc",
      }),
    });

    const tool = createEditTool(env);
    const result = await tool.execute("call-1", {
      path: "/test/file.txt",
      edits: [
        { oldText: "aaa", newText: "xxx" },
        { oldText: "bbb", newText: "yyy" },
      ],
    });

    expect(env.writeFile).toHaveBeenCalledWith("/test/file.txt", "xxx yyy ccc", undefined);
    expect(result.content).toEqual([{ type: "text", text: "已应用 2 处修改" }]);
  });

  it("oldText 不唯一时应抛出错误", async () => {
    const env = mockEnv({
      readTextFile: vi.fn().mockResolvedValue({
        ok: true,
        value: "a b a",
      }),
    });

    const tool = createEditTool(env);
    await expect(
      tool.execute("call-1", {
        path: "/test/file.txt",
        edits: [{ oldText: "a", newText: "x" }],
      }),
    ).rejects.toThrow("不唯一");
  });

  it("oldText 未找到时应抛出错误", async () => {
    const env = mockEnv();

    const tool = createEditTool(env);
    await expect(
      tool.execute("call-1", {
        path: "/test/file.txt",
        edits: [{ oldText: "nonexistent", newText: "x" }],
      }),
    ).rejects.toThrow("未找到");
  });

  it("edits 数组空时应返回 0 处修改", async () => {
    const env = mockEnv();

    const tool = createEditTool(env);
    const result = await tool.execute("call-1", {
      path: "/test/file.txt",
      edits: [],
    });

    expect(env.writeFile).not.toHaveBeenCalled();
    expect(result.content).toEqual([{ type: "text", text: "已应用 0 处修改" }]);
  });

  it("文件读取失败时应抛出错误", async () => {
    const env = mockEnv({
      readTextFile: vi.fn().mockResolvedValue({
        ok: false,
        error: new FileError("not_found", "file not found", "/test/missing.txt"),
      }),
    });

    const tool = createEditTool(env);
    await expect(
      tool.execute("call-1", {
        path: "/test/missing.txt",
        edits: [{ oldText: "x", newText: "y" }],
      }),
    ).rejects.toThrow();
  });
});
