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

// 生产/standalone：serve frontend static files
const distClient = new URL("client", import.meta.url).pathname;
const envClient = new URL("../dist/client", import.meta.url).pathname;
const clientDir = existsSync(distClient) ? distClient : existsSync(envClient) ? envClient : null;
if (clientDir) {
  app.use("/*", serveStatic({ root: clientDir }));
  app.get("/*", serveStatic({ path: "index.html", root: clientDir }));
}

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Stuwise server: http://localhost:${info.port}`);
});
