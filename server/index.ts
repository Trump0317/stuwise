import "dotenv/config";

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { existsSync } from "node:fs";
import { createHarness, getHarness } from "./harness";
import { config } from "./config";
import { promptRoute } from "./routes/prompt";
import { eventsRoute } from "./routes/events";
import { abortRoute } from "./routes/abort";
import { compactRoute } from "./routes/compact";
import { skillsRoute } from "./routes/skills";
import { sessionRoute } from "./routes/session";
import { steerRoute } from "./routes/steer";
import { configRoute } from "./routes/config";
import { healthRoute } from "./routes/health";
import { outputsRoute } from "./routes/outputs";

// 解决 CJS 打包兼容：用 __dirname 替代 import.meta.url
const serverDir = (() => {
  try { return import.meta.url ? new URL(".", import.meta.url).pathname : process.cwd(); }
  catch { return process.cwd(); }
})();

const clientDir = (() => {
  const candidates = [
    `${serverDir}client`,
    `${serverDir}../dist/client`,
    `${process.cwd()}/dist/client`,
    `${process.cwd()}/client`,
  ];
  for (const d of candidates) {
    try { if (existsSync(d)) return d; } catch {}
  }
  return null;
})();

async function main() {
  await createHarness({
    provider: config.model.provider,
    modelId: config.model.modelId,
    apiKey: config.getApiKey(),
  });

  const app = new Hono();

  app.route("/api", promptRoute());
  app.route("/api", eventsRoute(() => getHarness()));
  app.route("/api", abortRoute());
  app.route("/api", compactRoute());
  app.route("/api", skillsRoute());
  app.route("/api", sessionRoute());
  app.route("/api", steerRoute());
  app.route("/api", configRoute());
  app.route("/api", healthRoute());
  app.route("/api", outputsRoute());

  if (clientDir) {
    app.use("/*", serveStatic({ root: clientDir }));
    app.get("/*", serveStatic({ path: "index.html", root: clientDir }));
  }

  serve({ fetch: app.fetch, port: config.port }, (info) => {
    console.log(`Stuwise server: http://localhost:${info.port}`);
  });
}

main().catch((err) => {
  console.error("启动失败:", err);
  process.exit(1);
});
