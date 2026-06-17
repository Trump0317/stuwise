import { Hono } from "hono";
import { getHarness } from "../harness";

export function skillsRoute() {
  const app = new Hono();

  app.get("/skills", (c) => {
    const resources = getHarness().getResources();
    const skills = (resources.skills || []).map((s) => ({
      name: s.name,
      description: s.description,
    }));
    return c.json({ skills });
  });

  return app;
}
