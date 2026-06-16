import type { AgentTool, AgentToolResult, ExecutionEnv, FileInfo } from "@earendil-works/pi-agent-core";
import { Type, type Static } from "typebox";

async function walkFiles(
  env: ExecutionEnv,
  dir: string,
  signal?: AbortSignal,
): Promise<FileInfo[]> {
  const result = await env.listDir(dir, signal);
  if (!result.ok) throw result.error;

  const files: FileInfo[] = [];
  for (const entry of result.value) {
    if (entry.kind === "directory") {
      const sub = await walkFiles(env, entry.path, signal);
      files.push(...sub);
    } else if (entry.kind === "file") {
      files.push(entry);
    }
    // 跳过 symlink
  }
  return files;
}

export function createGrepTool(env: ExecutionEnv): AgentTool {
  const GrepParams = Type.Object({
    pattern: Type.String({ description: "搜索模式（支持正则表达式）" }),
    path: Type.Optional(Type.String({ description: "搜索目录，默认当前目录" })),
  });

  type Params = Static<typeof GrepParams>;

  return {
    name: "grep",
    label: "搜索文本",
    description: "递归搜索目录中的文本匹配，返回文件名和匹配行。支持正则表达式。",
    parameters: GrepParams,

    async execute(
      _toolCallId: string,
      params: unknown,
      signal?: AbortSignal,
    ): Promise<AgentToolResult<void>> {
      const { pattern, path } = params as Params;
      const targetPath = path ?? env.cwd;

      // 递归收集所有文件
      const allFiles = await walkFiles(env, targetPath, signal);

      // 正则编译
      let regex: RegExp;
      try {
        regex = new RegExp(pattern, "g");
      } catch {
        throw new Error(`无效的正则表达式: "${pattern}"`);
      }

      // 逐文件搜索
      const matches: string[] = [];
      for (const file of allFiles) {
        const linesResult = await env.readTextLines(file.path, {
          abortSignal: signal,
        });
        if (!linesResult.ok) continue; // 跳过无法读取的文件

        const lines = linesResult.value;
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            // 使用相对路径显示（去掉 cwd 前缀）
            const relPath = file.path.startsWith(env.cwd + "/")
              ? file.path.slice(env.cwd.length + 1)
              : file.path;
            matches.push(`${relPath}:${i + 1}: ${lines[i]}`);
            regex.lastIndex = 0; // reset for next test
          }
        }
      }

      return {
        content: [{ type: "text", text: matches.join("\n") }],
        details: undefined as void,
      };
    },
  };
}
