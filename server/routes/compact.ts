import { Hono } from "hono";
import { getHarness } from "../harness";

export function compactRoute() {
  const app = new Hono();

  app.post("/compact", async (c) => {
    try {
      const result = await getHarness().compact();
      return c.json({
        ok: true,
        summary: result.summary,
        tokensBefore: result.tokensBefore,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      return c.json({ ok: false, error: message }, 500);
    }
  });

  return app;
}
