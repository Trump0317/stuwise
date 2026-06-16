import type { AgentTool, AgentToolResult, ExecutionEnv } from "@earendil-works/pi-agent-core";
import { Type, type Static } from "typebox";

export function createEditTool(env: ExecutionEnv): AgentTool {
  const EditParams = Type.Object({
    path: Type.String({ description: "文件路径" }),
    edits: Type.Array(
      Type.Object({
        oldText: Type.String({ description: "要替换的原文本（必须在文件中唯一匹配）" }),
        newText: Type.String({ description: "替换后的新文本" }),
      }),
    ),
  });

  type Params = Static<typeof EditParams>;

  return {
    name: "edit",
    label: "编辑文件",
    description:
      "精确文本替换。每个 oldText 必须在文件中唯一出现一次，否则报错。支持一次调用多个编辑。",
    parameters: EditParams,

    async execute(
      _toolCallId: string,
      params: unknown,
      signal?: AbortSignal,
    ): Promise<AgentToolResult<void>> {
      const { path, edits } = params as Params;

      if (edits.length === 0) {
        return {
          content: [{ type: "text", text: "已应用 0 处修改" }],
          details: undefined as void,
        };
      }

      // 读取文件
      const readResult = await env.readTextFile(path, signal);
      if (!readResult.ok) throw readResult.error;

      let text = readResult.value;

      // 应用每个编辑
      for (const edit of edits) {
        const count = countOccurrences(text, edit.oldText);
        if (count === 0) {
          throw new Error(`未找到匹配文本: "${edit.oldText}"`);
        }
        if (count > 1) {
          throw new Error(`oldText 不唯一: "${edit.oldText}" 在文件中出现了 ${count} 次`);
        }
        // 唯一匹配，直接替换
        text = text.replace(edit.oldText, edit.newText);
      }

      // 写回文件
      const writeResult = await env.writeFile(path, text, signal);
      if (!writeResult.ok) throw writeResult.error;

      return {
        content: [{ type: "text", text: `已应用 ${edits.length} 处修改` }],
        details: undefined as void,
      };
    },
  };
}

function countOccurrences(str: string, search: string): number {
  if (search.length === 0) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(search, pos)) !== -1) {
    count++;
    pos += search.length;
  }
  return count;
}
