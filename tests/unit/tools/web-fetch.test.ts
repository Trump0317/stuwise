import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createWebFetchTool } from "../../../tools/web-fetch";

describe("createWebFetchTool", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("应返回 AgentTool 对象", () => {
    const tool = createWebFetchTool();
    expect(tool.name).toBe("web_fetch");
    expect(tool.label).toBe("抓取网页");
    expect(tool.description).toBeTruthy();
    expect(tool.parameters).toBeDefined();
  });

  it("应提取纯文本", async () => {
    const html = `
      <html>
        <head><title>Test</title><style>.x{color:red}</style></head>
        <body>
          <h1>Hello</h1>
          <p>World</p>
          <script>console.log('x')</script>
        </body>
      </html>`;
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    } as Response);

    const tool = createWebFetchTool();
    const result = await tool.execute("call-1", { url: "https://example.com" });

    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("Hello");
    expect(text).toContain("World");
    expect(text).not.toContain("<script>");
    expect(text).not.toContain(".x{color:red}");
  });

  it("HTTP 错误时应抛出错误", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve(""),
    } as Response);

    const tool = createWebFetchTool();
    await expect(
      tool.execute("call-1", { url: "https://example.com/404" }),
    ).rejects.toThrow();
  });

  it("网络错误时应抛出错误", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Connection refused"));

    const tool = createWebFetchTool();
    await expect(
      tool.execute("call-1", { url: "https://example.com" }),
    ).rejects.toThrow("Connection refused");
  });

  it("过长内容应截断 50KB", async () => {
    const longText = "a".repeat(60 * 1024);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(longText),
    } as Response);

    const tool = createWebFetchTool();
    const result = await tool.execute("call-1", { url: "https://example.com" });

    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text.length).toBeLessThanOrEqual(50 * 1024);
    expect(text).toContain("...(截断)");
  });
});
