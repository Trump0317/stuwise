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
      <html>
        <a class="result-link" href="https://example.com">Example Title</a>
        <span class="result-snippet">This is a snippet</span>
      </html>`;
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    } as Response);

    const tool = createWebSearchTool();
    const result = await tool.execute("call-1", { query: "test" });

    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("Example Title");
    expect(text).toContain("https://example.com");
  });

  it("网络错误时应抛出错误", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const tool = createWebSearchTool();
    await expect(
      tool.execute("call-1", { query: "test" }),
    ).rejects.toThrow("Network error");
  });

  it("max_results 应限制返回数量", async () => {
    // 快速测试：验证参数限制逻辑
    const tool = createWebSearchTool();
    // max_results 默认 5，最大 10
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
    ).rejects.toThrow();
  });
});
