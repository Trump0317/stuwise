import { describe, it, expect, vi } from "vitest";
import { createBashTool } from "../../../tools/bash";
import type { ExecutionEnv } from "@earendil-works/pi-agent-core";
import { ExecutionError } from "@earendil-works/pi-agent-core";

function mockEnv(overrides: Partial<ExecutionEnv> = {}): ExecutionEnv {
  return {
    cwd: "/test",
    exec: vi.fn().mockResolvedValue({
      ok: true,
      value: { stdout: "hello", stderr: "", exitCode: 0 },
    }),
    ...overrides,
  } as unknown as ExecutionEnv;
}

describe("createBashTool", () => {
  it("应返回 AgentTool 对象", () => {
    const env = mockEnv();
    const tool = createBashTool(env);
    expect(tool.name).toBe("bash");
    expect(tool.label).toBe("执行命令");
    expect(tool.description).toBeTruthy();
    expect(tool.parameters).toBeDefined();
  });

  it("正常执行应返回 stdout", async () => {
    const env = mockEnv();
    const tool = createBashTool(env);

    const result = await tool.execute("call-1", { command: "echo hello" });

    expect(env.exec).toHaveBeenCalledWith("echo hello", expect.objectContaining({
      timeout: 30,
    }));
    expect(result.content).toEqual([{ type: "text", text: "hello" }]);
    expect(result.details).toEqual({ exitCode: 0, stderr: "" });
  });

  it("执行失败时应抛出错误", async () => {
    const env = mockEnv({
      exec: vi.fn().mockResolvedValue({
        ok: false,
        error: new ExecutionError("spawn_error", "command not found"),
      }),
    });

    const tool = createBashTool(env);
    await expect(
      tool.execute("call-1", { command: "nonexistent" }),
    ).rejects.toThrow();
  });

  it("应支持自定义 timeout", async () => {
    const env = mockEnv();
    const tool = createBashTool(env);

    await tool.execute("call-1", { command: "sleep 1", timeout: 60 });

    expect(env.exec).toHaveBeenCalledWith("sleep 1", expect.objectContaining({
      timeout: 60,
    }));
  });

  it("timeout 超过 120s 时应截断为 120s", async () => {
    const env = mockEnv();
    const tool = createBashTool(env);

    await tool.execute("call-1", { command: "sleep 999", timeout: 999 });

    expect(env.exec).toHaveBeenCalledWith("sleep 999", expect.objectContaining({
      timeout: 120,
    }));
  });

  it("不传 timeout 时应默认 30s", async () => {
    const env = mockEnv();
    const tool = createBashTool(env);

    await tool.execute("call-1", { command: "ls" });

    expect(env.exec).toHaveBeenCalledWith("ls", expect.objectContaining({
      timeout: 30,
    }));
  });
});
