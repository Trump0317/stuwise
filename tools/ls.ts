import type { AgentTool, AgentToolResult, ExecutionEnv } from "@earendil-works/pi-agent-core";
import { Type, type Static } from "typebox";

export function createLsTool(env: ExecutionEnv): AgentTool {
  const LsParams = Type.Object({
    path: Type.Optional(Type.String({ description: "目录路径，默认当前工作目录" })),
  });

  type Params = Static<typeof LsParams>;

  return {
    name: "ls",
    label: "列出目录",
    description: "列出目录内容，区分文件和子目录。",
    parameters: LsParams,

    async execute(
      _toolCallId: string,
      params: unknown,
      signal?: AbortSignal,
    ): Promise<AgentToolResult<void>> {
      const { path } = params as Params;
      const targetPath = path ?? env.cwd;

      const result = await env.listDir(targetPath, signal);
      if (!result.ok) throw result.error;

      const entries = result.value;
      const text = entries
        .map((f) => (f.kind === "directory" ? `${f.name}/` : f.name))
        .join("\n");

      return {
        content: [{ type: "text", text }],
        details: undefined as void,
      };
    },
  };
}
