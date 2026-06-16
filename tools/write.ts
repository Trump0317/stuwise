import type { AgentTool, AgentToolResult, ExecutionEnv } from "@earendil-works/pi-agent-core";
import { Type, type Static } from "typebox";

export function createWriteTool(env: ExecutionEnv): AgentTool {
  const WriteParams = Type.Object({
    path: Type.String({ description: "文件路径（绝对或相对路径）" }),
    content: Type.String({ description: "要写入的内容" }),
  });

  type Params = Static<typeof WriteParams>;

  return {
    name: "write",
    label: "写入文件",
    description: "创建或覆盖文件，自动创建父目录。",
    parameters: WriteParams,

    async execute(
      _toolCallId: string,
      params: unknown,
      signal?: AbortSignal,
    ): Promise<AgentToolResult<void>> {
      const { path, content } = params as Params;
      const result = await env.writeFile(path, content, signal);
      if (!result.ok) throw result.error;

      return {
        content: [{ type: "text", text: `文件已写入: ${path}` }],
        details: undefined as void,
      };
    },
  };
}
