import "dotenv/config";

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createHarness } from "./harness";
import { config } from "./config";
import { promptRoute } from "./routes/prompt";
import { eventsRoute } from "./routes/events";
import { abortRoute } from "./routes/abort";

const harness = await createHarness({
  provider: config.model.provider,
  modelId: config.model.modelId,
  apiKey: config.getApiKey(),
});

const app = new Hono();

app.route("/api", promptRoute(harness));
app.route("/api", eventsRoute(harness));
app.route("/api", abortRoute(harness));

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Stuwise server: http://localhost:${info.port}`);
});
