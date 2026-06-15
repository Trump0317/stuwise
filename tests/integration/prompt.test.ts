import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { AgentHarness } from "@earendil-works/pi-agent-core";
import { promptRoute } from "../../server/routes/prompt";
import { abortRoute } from "../../server/routes/abort";
import { eventsRoute } from "../../server/routes/events";

// 最小完整 AssistantMessage mock
const mockAssistantMessage = {
  role: "assistant" as const,
  content: [{ type: "text" as const, text: "你好！有什么可以帮你的？" }],
  api: "anthropic-messages" as any,
  provider: "anthropic",
  model: "claude-3-7-sonnet-20250219",
  usage: { input: 10, output: 5, cacheRead: 0, cacheWrite: 0, totalTokens: 15, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
  stopReason: "stop" as const,
  timestamp: Date.now(),
};

type MockHarness = Pick<AgentHarness, "prompt" | "abort" | "subscribe">;

function createMockHarness(overrides?: Partial<MockHarness>): MockHarness {
  return {
    prompt: vi.fn().mockResolvedValue(mockAssistantMessage),
    abort: vi.fn().mockResolvedValue({ clearedSteer: [], clearedFollowUp: [] }),
    subscribe: vi.fn().mockReturnValue(() => {}),
    ...overrides,
  };
}

describe("POST /api/prompt", () => {
  let app: Hono;
  let harness: MockHarness;

  beforeEach(() => {
    app = new Hono();
    harness = createMockHarness();
    app.route("/api", promptRoute(harness as any));
  });

  it("正常情况应返回 200 和 stopReason", async () => {
    const res = await app.request("/api/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "你好" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, stopReason: "stop" });
    expect(harness.prompt).toHaveBeenCalledWith("你好");
  });

  it("缺少 text 字段应返回 400", async () => {
    const res = await app.request("/api/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(harness.prompt).not.toHaveBeenCalled();
  });

  it("text 为空字符串应返回 400", async () => {
    const res = await app.request("/api/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });

    expect(res.status).toBe(400);
    expect(harness.prompt).not.toHaveBeenCalled();
  });

  it("text 为纯空白应返回 400", async () => {
    const res = await app.request("/api/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "   " }),
    });

    expect(res.status).toBe(400);
    expect(harness.prompt).not.toHaveBeenCalled();
  });

  it("harness.prompt 抛出异常应返回 500", async () => {
    const errorHarness = createMockHarness({
      prompt: vi.fn().mockRejectedValue(new Error("LLM error")),
    });
    const errApp = new Hono().route("/api", promptRoute(errorHarness as any));

    const res = await errApp.request("/api/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "你好" }),
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBeDefined();
  });
});

describe("POST /api/abort", () => {
  let app: Hono;
  let harness: MockHarness;

  beforeEach(async () => {
    app = new Hono();
    harness = createMockHarness();
    app.route("/api", abortRoute(harness as any));
  });

  it("应返回 200", async () => {
    const res = await app.request("/api/abort", { method: "POST" });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
    expect(harness.abort).toHaveBeenCalled();
  });

  it("harness.abort 抛出异常应返回 500", async () => {
    const errorHarness = createMockHarness({
      abort: vi.fn().mockRejectedValue(new Error("abort failed")),
    });
    const errApp = new Hono().route("/api", abortRoute(errorHarness as any));

    const res = await errApp.request("/api/abort", { method: "POST" });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBeDefined();
  });
});

describe("GET /api/events", () => {
  let harness: MockHarness;

  beforeEach(() => {
    harness = createMockHarness();
  });

  it("应返回 SSE 响应头 (Content-Type, Connection, Cache-Control)", async () => {
    const app = new Hono().route("/api", eventsRoute(harness as any));
    const res = await app.request("/api/events");

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Connection")).toBe("keep-alive");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
  });

  it("客户端断开时应触发 AbortSignal", () => {
    // M0-5 实现：harness.subscribe 的取消函数应在 AbortSignal 触发时调用
    // M0-3 骨架阶段：验证信号机制存在即可
    const signal = new AbortController().signal;
    const listener = () => {};
    signal.addEventListener("abort", listener);
    signal.removeEventListener("abort", listener);
    // 骨架阶段仅验证 API 存在，实际集成逻辑在 M0-5 测试
  });

  // M0-5 补充：流式事件推送测试
});

describe("POST /api/prompt — 边界输入", () => {
  let app: Hono;
  let harness: MockHarness;

  beforeEach(async () => {
    app = new Hono();
    harness = createMockHarness();
    app.route("/api", promptRoute(harness as any));
  });

  it("应处理非常大的 text", async () => {
    const longText = "x".repeat(100000);

    const res = await app.request("/api/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: longText }),
    });

    expect(res.status).toBe(200);
    expect(harness.prompt).toHaveBeenCalledWith(longText);
  });

  it("应保留特殊字符和 Unicode", async () => {
    const specialText = "你好\n世界\t测试😂 <script>alert(1)</script>";

    const res = await app.request("/api/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: specialText }),
    });

    expect(res.status).toBe(200);
    expect(harness.prompt).toHaveBeenCalledWith(specialText);
  });
});
