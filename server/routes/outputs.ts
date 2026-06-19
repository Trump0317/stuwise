import { Hono } from "hono";
import { listOutputs } from "../harness/outputs";

export function outputsRoute() {
  const app = new Hono();

  app.get("/outputs", async (c) => {
    const sessionId = c.req.query("sessionId") || undefined;
    const type = c.req.query("type") || "all";
    const outputs = await listOutputs(sessionId, type);
    return c.json({ ok: true, data: { outputs } });
  });

  return app;
}
