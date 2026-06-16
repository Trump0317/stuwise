import type { AgentTool, AgentToolResult } from "@earendil-works/pi-agent-core";
import { Type, type Static } from "typebox";

const DDG_LITE = "https://lite.duckduckgo.com/lite/";
const DEFAULT_MAX = 5;
const ABSOLUTE_MAX = 10;

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * 解析 DuckDuckGo Lite HTML，提取搜索结果。
 */
function parseResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // 匹配每个结果块：<a class="result-link"> title </a> ... <span class="result-snippet"> snippet </span>
  const blockRegex = /<a[^>]*class="result-link"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<span[^>]*class="result-snippet"[^>]*>([\s\S]*?)<\/span>/gi;

  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    const url = decodeURIComponent(match[1].replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, ""));
    const title = match[2].replace(/<[^>]*>/g, "").trim();
    const snippet = match[3].replace(/<[^>]*>/g, "").trim();

    if (url && title) {
      results.push({ title, url, snippet });
    }
  }

  return results;
}

export function createWebSearchTool(): AgentTool {
  const WebSearchParams = Type.Object({
    query: Type.String({ description: "搜索关键词" }),
    max_results: Type.Optional(
      Type.Number({ description: "最大结果数，默认 5，最大 10" }),
    ),
  });

  type Params = Static<typeof WebSearchParams>;

  return {
    name: "web_search",
    label: "搜索网络",
    description: "通过 DuckDuckGo 搜索网络内容，返回标题、URL 和摘要。无需 API Key。",
    parameters: WebSearchParams,

    async execute(
      _toolCallId: string,
      params: unknown,
      _signal?: AbortSignal,
    ): Promise<AgentToolResult<void>> {
      const { query, max_results } = params as Params;
      const maxResults = Math.min(max_results ?? DEFAULT_MAX, ABSOLUTE_MAX);

      const url = `${DDG_LITE}?q=${encodeURIComponent(query)}`;
      const resp = await fetch(url);

      if (!resp.ok) {
        throw new Error(`搜索请求失败: HTTP ${resp.status}`);
      }

      const html = await resp.text();
      const results = parseResults(html).slice(0, maxResults);

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: "未找到搜索结果" }],
          details: undefined as void,
        };
      }

      const text = results
        .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`)
        .join("\n\n");

      return {
        content: [{ type: "text", text }],
        details: undefined as void,
      };
    },
  };
}
