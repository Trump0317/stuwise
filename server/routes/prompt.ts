import { Hono } from "hono";
import { getHarness, autoCompactSession } from "../harness";

export function promptRoute() {
  const app = new Hono();

  app.post("/prompt", async (c) => {
    const body = await c.req.json().catch(() => null);
    const text = body?.text;
    if (!text || typeof text !== "string" || !text.trim()) {
      return c.json({ ok: false, error: "缺少 text 字段或为空" }, 400);
    }

    try {
      const harness = getHarness();
      await autoCompactSession(harness);
      const result = await harness.prompt(text);
      return c.json({ ok: true, data: { stopReason: result.stopReason } });
    } catch (err) {
      return c.json({ ok: false, error: (err as Error).message }, 500);
    }
  });

  return app;
}
