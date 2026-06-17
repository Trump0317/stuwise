import { Hono } from "hono";
import { getConfig, shouldCompact, getCurrentSessionPath } from "../harness";
import fs from "node:fs/promises";
import type { HealthInfo } from "../types";

const startTime = Date.now();

async function estimateTokens(): Promise<number> {
  const path = getCurrentSessionPath();
  if (!path) return 0;
  try {
    const content = await fs.readFile(path, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    let total = 0;
    for (let i = 1; i < lines.length; i++) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.type === "message" && entry.message) {
          const c = entry.message.content;
          let text = "";
          if (typeof c === "string") text = c;
          else if (Array.isArray(c)) text = c.filter((p: any) => p.type === "text").map((p: any) => p.text || "").join("");
          total += Math.ceil((text || "").length / 2.5);
        }
      } catch { /* skip */ }
    }
    return total;
  } catch { return 0; }
}

export function healthRoute() {
  const app = new Hono();

  app.get("/health", async (c) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const compactNeeded = await shouldCompact();
    const tokens = await estimateTokens();
    const cfg = getConfig();

    const data: HealthInfo = {
      status: "ok", uptime,
      model: `${cfg.provider}/${cfg.modelId}`,
      tokens, compactNeeded,
    };
    return c.json({ ok: true, data });
  });

  return app;
}
