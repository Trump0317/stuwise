import type { AgentTool, AgentToolResult } from "@earendil-works/pi-agent-core";
import { Type, type Static } from "typebox";

const BING_SEARCH = "https://www.bing.com/search";
const DEFAULT_MAX = 5;
const ABSOLUTE_MAX = 10;

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * 解析 Bing 搜索结果 HTML。
 *
 * Bing 结果结构：
 *   <li class="b_algo">
 *     <h2><a href="URL">TITLE</a></h2>
 *     <div class="b_caption"><p class="b_lineclamp2">SNIPPET</p></div>
 *   </li>
 */
function parseResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // 提取每个结果块 <li class="b_algo" ...> ... </li>
  const blockRegex = /<li\s+class="b_algo"[^>]*>([\s\S]*?)<\/li>/gi;
  let blockMatch: RegExpExecArray | null;

  while ((blockMatch = blockRegex.exec(html)) !== null) {
    const block = blockMatch[1];

    // 提取链接和标题: <h2>?<a ... href="URL" ...>TITLE</a>
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i;
    const linkMatch = block.match(linkRegex);
    if (!linkMatch) continue;

    const url = linkMatch[1].replace(/&amp;/g, "&");
    const title = linkMatch[2].replace(/<[^>]*>/g, "").trim();

    if (!url || !title) continue;

    // 提取摘要: <p class="b_lineclamp2">SNIPPET</p>
    const snippetRegex = /<p\s+class="b_lineclamp\d"[^>]*>([\s\S]*?)<\/p>/i;
    const snippetMatch = block.match(snippetRegex);
    const snippet = snippetMatch
      ? snippetMatch[1].replace(/<[^>]*>/g, "").trim()
      : "";

    results.push({ title, url, snippet });
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
    description: "通过 Bing 搜索网络内容，返回标题、URL 和摘要。无需 API Key。",
    parameters: WebSearchParams,

    async execute(
      _toolCallId: string,
      params: unknown,
      _signal?: AbortSignal,
    ): Promise<AgentToolResult<void>> {
      const { query, max_results } = params as Params;
      const maxResults = Math.min(max_results ?? DEFAULT_MAX, ABSOLUTE_MAX);

      const url = `${BING_SEARCH}?q=${encodeURIComponent(query)}`;
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Stuwise/1.0)",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
      });

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
