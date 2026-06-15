import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

export function eventsRoute(harness: {
  subscribe: (listener: (event: unknown) => void) => () => void;
}) {
  const app = new Hono();

  app.get("/events", (c) => {
    return streamSSE(c, async (stream) => {
      const unsub = harness.subscribe((event) => {
        try {
          stream.writeSSE({ data: JSON.stringify(event) });
        } catch {
          // 客户端已断开
        }
      });

      c.req.raw.signal.addEventListener("abort", unsub, { once: true });

      // 保持连接直到客户端断开
      await new Promise<void>((resolve) => {
        c.req.raw.signal.addEventListener("abort", () => resolve(), { once: true });
      });
    });
  });

  return app;
}
