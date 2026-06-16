import type { AgentTool, AgentToolResult, ExecutionEnv } from "@earendil-works/pi-agent-core";
import { Type, type Static } from "typebox";

const MAX_CHARS = 50 * 1024; // 50KB
const MAX_LINES = 2000;

const IMAGE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg",
]);

function isImagePath(path: string): boolean {
  const ext = path.toLowerCase().slice(path.lastIndexOf("."));
  return IMAGE_EXTENSIONS.has(ext);
}

const TRUNCATE_SUFFIX = "\n...(截断)";

function truncateText(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit - TRUNCATE_SUFFIX.length) + TRUNCATE_SUFFIX;
}

function truncateLines(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines), TRUNCATE_SUFFIX.trim()];
}

export function createReadTool(env: ExecutionEnv): AgentTool {
  const ReadParams = Type.Object({
    path: Type.String({ description: "文件路径（绝对或相对路径）" }),
    offset: Type.Optional(Type.Number({ description: "起始行号（1-based）" })),
    limit: Type.Optional(Type.Number({ description: "最大行数" })),
  });

  type Params = Static<typeof ReadParams>;

  return {
    name: "read",
    label: "读取文件",
    description:
      "读取文件内容。支持文本文件（自动截断 50KB/2000 行）和图片。大文件可通过 offset/limit 分片读取。",
    parameters: ReadParams,

    async execute(
      _toolCallId: string,
      params: unknown,
      signal?: AbortSignal,
    ): Promise<AgentToolResult<void>> {
      const { path, offset, limit } = params as Params;

      // 图片文件：二进制读取
      if (isImagePath(path)) {
        const result = await env.readBinaryFile(path, signal);
        if (!result.ok) throw result.error;

        const ext = path.toLowerCase().slice(path.lastIndexOf(".") + 1);
        const mimeType = ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;

        return {
          content: [{
            type: "image",
            data: Buffer.from(result.value).toString("base64"),
            mimeType,
          }],
          details: undefined as void,
        };
      }

      // offset/limit 场景：按行读取
      if (offset !== undefined || limit !== undefined) {
        const start = offset ?? 1;
        const count = limit ?? MAX_LINES;
        const endLine = start + count - 1;

        // 先按行读取到 endLine
        const linesResult = await env.readTextLines(path, {
          maxLines: endLine,
          abortSignal: signal,
        });
        if (!linesResult.ok) throw linesResult.error;

        const allLines = linesResult.value;
        const sliced = allLines.slice(start - 1, start - 1 + count);
        const text = truncateLines(sliced, MAX_LINES).join("\n");
        const finalText = truncateText(text, MAX_CHARS);

        return {
          content: [{ type: "text", text: finalText }],
          details: undefined as void,
        };
      }

      // 全量读取：用 readTextFile
      const fileResult = await env.readTextFile(path, signal);
      if (!fileResult.ok) throw fileResult.error;

      const text = fileResult.value;
      const lines = text.split("\n");

      // 截断
      const truncated = truncateLines(lines, MAX_LINES).join("\n");
      const finalText = truncateText(truncated, MAX_CHARS);

      return {
        content: [{ type: "text", text: finalText }],
        details: undefined as void,
      };
    },
  };
}
