import { Hono } from "hono";
import type { AgentHarness } from "@earendil-works/pi-agent-core";

export function compactRoute(harness: AgentHarness) {
  const app = new Hono();

  app.post("/compact", async (c) => {
    try {
      const result = await harness.compact();
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
