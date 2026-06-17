import { Hono } from "hono";
import { getHarness } from "../harness";

export function abortRoute() {
  const app = new Hono();

  app.post("/abort", async (c) => {
    try {
      await getHarness().abort();
      return c.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      return c.json({ ok: false, error: message }, 500);
    }
  });

  return app;
}
