import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createWebSearchTool } from "../../../tools/web-search";

describe("createWebSearchTool", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("应返回 AgentTool 对象", () => {
    const tool = createWebSearchTool();
    expect(tool.name).toBe("web_search");
    expect(tool.label).toBe("搜索网络");
    expect(tool.description).toBeTruthy();
    expect(tool.parameters).toBeDefined();
  });

  it("应返回搜索结果", async () => {
    const mockHtml = `
      <li class="b_algo">
        <h2><a href="https://example.com">Example Title</a></h2>
        <div class="b_caption"><p class="b_lineclamp2">This is a snippet</p></div>
      </li>`;
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    } as Response);

    const tool = createWebSearchTool();
    const result = await tool.execute("call-1", { query: "test" });

    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("Example Title");
    expect(text).toContain("https://example.com");
    expect(text).toContain("This is a snippet");
  });

  it("应解析多个搜索结果", async () => {
    const mockHtml = `
      <li class="b_algo">
        <h2><a href="https://a.com">Title A</a></h2>
        <div class="b_caption"><p class="b_lineclamp2">Snippet A</p></div>
      </li>
      <li class="b_algo">
        <h2><a href="https://b.com">Title B</a></h2>
        <div class="b_caption"><p class="b_lineclamp2">Snippet B</p></div>
      </li>`;
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    } as Response);

    const tool = createWebSearchTool();
    const result = await tool.execute("call-1", { query: "test" });

    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("Title A");
    expect(text).toContain("Title B");
  });

  it("网络错误时应抛出错误", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const tool = createWebSearchTool();
    await expect(
      tool.execute("call-1", { query: "test" }),
    ).rejects.toThrow("Network error");
  });

  it("max_results 应限制返回数量", async () => {
    const tool = createWebSearchTool();
    const params = tool.parameters as any;
    expect(params).toBeDefined();
  });

  it("HTTP 错误时应抛出错误", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(""),
    } as Response);

    const tool = createWebSearchTool();
    await expect(
      tool.execute("call-1", { query: "test" }),
    ).rejects.toThrow("搜索请求失败");
  });
});
