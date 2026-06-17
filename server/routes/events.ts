import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { AgentHarness } from "@earendil-works/pi-agent-core";

/**
 * eventsRoute 接受一个获取当前 harness 的函数，
 * 支持 session 切换后新连接使用新 harness。
 */
export function eventsRoute(getH: () => AgentHarness) {
  const app = new Hono();

  app.get("/events", (c) => {
    return streamSSE(c, async (stream) => {
      const harness = getH();
      const unsub = harness.subscribe((event) => {
        try {
          stream.writeSSE({ data: JSON.stringify(event) });
        } catch {
          // 客户端已断开
        }
      });

      c.req.raw.signal.addEventListener("abort", unsub, { once: true });

      await new Promise<void>((resolve) => {
        c.req.raw.signal.addEventListener("abort", () => resolve(), { once: true });
      });
    });
  });

  return app;
}
