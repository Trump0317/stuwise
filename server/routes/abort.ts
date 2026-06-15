import { Hono } from "hono";

export function abortRoute(harness: { abort: () => Promise<unknown> }) {
  const app = new Hono();

  app.post("/abort", async (c) => {
    try {
      await harness.abort();
      return c.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      return c.json({ ok: false, error: message }, 500);
    }
  });

  return app;
}
