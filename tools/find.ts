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
  }
  return files;
}

/**
 * 将简单通配符 pattern 转为正则表达式（仅支持 * 匹配任意字符）
 */
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

/**
 * 获取相对路径（去掉 cwd 前缀）
 */
function relativePath(absolute: string, cwd: string): string {
  return absolute.startsWith(cwd + "/") ? absolute.slice(cwd.length + 1) : absolute;
}

export function createFindTool(env: ExecutionEnv): AgentTool {
  const FindParams = Type.Object({
    pattern: Type.String({ description: "文件名匹配模式（支持 * 通配符，如 *.md、test*.ts）" }),
    path: Type.Optional(Type.String({ description: "搜索起始目录，默认当前目录" })),
  });

  type Params = Static<typeof FindParams>;

  return {
    name: "find",
    label: "查找文件",
    description: "递归查找匹配文件名的文件。支持 * 通配符。",
    parameters: FindParams,

    async execute(
      _toolCallId: string,
      params: unknown,
      signal?: AbortSignal,
    ): Promise<AgentToolResult<void>> {
      const { pattern, path } = params as Params;
      const targetPath = path ?? env.cwd;

      const regex = patternToRegex(pattern);
      const allFiles = await walkFiles(env, targetPath, signal);

      const matched = allFiles
        .filter((f) => regex.test(f.name))
        .map((f) => relativePath(f.path, env.cwd));

      return {
        content: [{ type: "text", text: matched.join("\n") }],
        details: undefined as void,
      };
    },
  };
}
