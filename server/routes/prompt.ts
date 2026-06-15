import { Hono } from "hono";

export function promptRoute(harness: { prompt: (text: string) => Promise<{ stopReason: string }> }) {
  const app = new Hono();

  app.post("/prompt", async (c) => {
    try {
      const body = await c.req.json();
      const text = body?.text;

      if (!text || typeof text !== "string" || text.trim() === "") {
        return c.json({ ok: false, error: "缺少 text 字段或为空" }, 400);
      }

      const result = await harness.prompt(text);
      return c.json({ ok: true, stopReason: result.stopReason });
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      return c.json({ ok: false, error: message }, 500);
    }
  });

  return app;
}
