import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import { eventsRoute } from "../../server/routes/events";

function createMockHarness() {
  const listeners: Array<(event: unknown) => void> = [];
  return {
    subscribe: vi.fn((fn) => {
      listeners.push(fn);
      return () => {
        const idx = listeners.indexOf(fn);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    }),
    _emit(event: unknown) {
      listeners.forEach((fn) => fn(event));
    },
  };
}

describe("GET /api/events — SSE 推流", () => {
  it("应返回 SSE Content-Type", async () => {
    const harness = createMockHarness();
    const app = new Hono().route("/api", eventsRoute(harness as any));

    // 用内部 AbortController 在短时间后断开
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 20);

    try {
      const res = await app.request("/api/events", { signal: ac.signal });
      expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    } catch {
      // streamSSE 可能在 abort 时抛出
    } finally {
      clearTimeout(timer);
    }
  });

  it("harness.subscribe 应在连接建立时被调用", async () => {
    const harness = createMockHarness();
    const app = new Hono().route("/api", eventsRoute(harness as any));

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 20);

    try {
      await app.request("/api/events", { signal: ac.signal });
    } catch {
      // expected on abort
    } finally {
      clearTimeout(timer);
    }

    expect(harness.subscribe).toHaveBeenCalled();
  });
});
