import { Hono } from "hono";
import { getHarness, autoCompactSession } from "../harness";

export function promptRoute() {
  const app = new Hono();

  app.post("/prompt", async (c) => {
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "请求体不是有效的 JSON" }, 400);
    }

    const text = body?.text;
    if (!text || typeof text !== "string" || text.trim() === "") {
      return c.json({ ok: false, error: "缺少 text 字段或为空" }, 400);
    }

    try {
      const harness = getHarness();
      await autoCompactSession(harness);
      const result = await harness.prompt(text);
      return c.json({ ok: true, stopReason: result.stopReason });
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      return c.json({ ok: false, error: message }, 500);
    }
  });

  return app;
}
