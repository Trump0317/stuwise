import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

export function eventsRoute(harness: { subscribe: (listener: (event: unknown) => void) => () => void }) {
  const app = new Hono();

  app.get("/events", (c) => {
    return streamSSE(c, async (stream) => {
      // M0-5 实现：订阅 harness 事件，通过 stream.writeSSE() 推流
      // const unsub = harness.subscribe((event) => {
      //   stream.writeSSE({ data: JSON.stringify(event) });
      // });
      // c.req.raw.signal.addEventListener("abort", unsub);

      // M0-3 骨架：保持连接直到客户端断开
      await new Promise((resolve) => {
        c.req.raw.signal.addEventListener("abort", resolve, { once: true });
      });
    });
  });

  return app;
}
