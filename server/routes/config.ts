import { Hono } from "hono";
import { getConfig, updateConfig } from "../harness";

export function configRoute() {
  const app = new Hono();

  app.get("/config", (c) => {
    return c.json({ ok: true, data: getConfig() });
  });

  app.put("/config", async (c) => {
    try {
      const body = await c.req.json();
      const result = await updateConfig(body);
      return c.json({ ok: true, data: result });
    } catch (err) {
      return c.json({ ok: false, error: (err as Error).message }, 500);
    }
  });

  return app;
}
