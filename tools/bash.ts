import type { AgentTool, AgentToolResult, ExecutionEnv } from "@earendil-works/pi-agent-core";
import { Type, type Static } from "typebox";

const DEFAULT_TIMEOUT = 30;
const MAX_TIMEOUT = 120;

export function createBashTool(env: ExecutionEnv): AgentTool {
  const BashParams = Type.Object({
    command: Type.String({ description: "要执行的 shell 命令" }),
    timeout: Type.Optional(Type.Number({ description: "超时秒数，默认 30s，最大 120s" })),
  });

  type Params = Static<typeof BashParams>;

  return {
    name: "bash",
    label: "执行命令",
    description: "在服务器工作目录执行 shell 命令，返回 stdout/stderr。默认超时 30s。",
    parameters: BashParams,

    async execute(
      _toolCallId: string,
      params: unknown,
      signal?: AbortSignal,
    ): Promise<AgentToolResult<{ exitCode: number; stderr: string }>> {
      const { command, timeout } = params as Params;
      const actualTimeout = Math.min(timeout ?? DEFAULT_TIMEOUT, MAX_TIMEOUT);

      const result = await env.exec(command, {
        timeout: actualTimeout,
        abortSignal: signal,
      });

      if (!result.ok) throw result.error;

      const { stdout, stderr, exitCode } = result.value;

      return {
        content: [{ type: "text", text: stdout }],
        details: { exitCode, stderr },
      };
    },
  };
}
