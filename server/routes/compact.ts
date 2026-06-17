import { Hono } from "hono";
import { getHarness } from "../harness";

export function compactRoute() {
  const app = new Hono();

  app.post("/compact", async (c) => {
    try {
      const result = await getHarness().compact();
      return c.json({
        ok: true,
        data: { summary: result.summary, tokensBefore: result.tokensBefore },
      });
    } catch (err) {
      return c.json({ ok: false, error: (err as Error).message }, 500);
    }
  });

  return app;
}
