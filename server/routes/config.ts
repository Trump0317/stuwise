import { Hono } from "hono";
import { getConfig, updateConfig } from "../harness";

export function configRoute() {
  const app = new Hono();

  app.get("/config", (c) => {
    return c.json(getConfig());
  });

  app.put("/config", async (c) => {
    try {
      const body = await c.req.json();
      const result = await updateConfig(body);
      return c.json({ ok: true, config: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      return c.json({ ok: false, error: message }, 500);
    }
  });

  return app;
}
