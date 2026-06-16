import type { AgentTool, AgentToolResult } from "@earendil-works/pi-agent-core";
import { Type, type Static } from "typebox";

const MAX_CHARS = 50 * 1024;
const TRUNCATE_SUFFIX = "\n...(截断)";

function stripHtml(html: string): string {
  return html
    // 移除 script 和 style 元素及其内容
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    // 移除所有 HTML 标签
    .replace(/<[^>]*>/g, "")
    // 解码常见 HTML 实体
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // 压缩连续空白行
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncateText(text: string): string {
  if (text.length <= MAX_CHARS) return text;
  return text.slice(0, MAX_CHARS - TRUNCATE_SUFFIX.length) + TRUNCATE_SUFFIX;
}

export function createWebFetchTool(): AgentTool {
  const WebFetchParams = Type.Object({
    url: Type.String({ description: "要抓取的网页 URL（需包含 http:// 或 https://）" }),
  });

  type Params = Static<typeof WebFetchParams>;

  return {
    name: "web_fetch",
    label: "抓取网页",
    description: "抓取网页内容并提取纯文本。移除所有 HTML 标签、脚本和样式。",
    parameters: WebFetchParams,

    async execute(
      _toolCallId: string,
      params: unknown,
      _signal?: AbortSignal,
    ): Promise<AgentToolResult<void>> {
      const { url } = params as Params;

      const resp = await fetch(url);

      if (!resp.ok) {
        throw new Error(`网页抓取失败: HTTP ${resp.status}`);
      }

      const html = await resp.text();
      const text = truncateText(stripHtml(html));

      return {
        content: [{ type: "text", text }],
        details: undefined as void,
      };
    },
  };
}
