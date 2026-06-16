import { Hono } from "hono";

export function skillsRoute(harness: {
  getResources?: () => { skills?: Array<{ name: string; description: string }> };
}) {
  const app = new Hono();

  app.get("/skills", (c) => {
    const resources = harness.getResources?.() || {};
    const skills = (resources.skills || []).map((s) => ({
      name: s.name,
      description: s.description,
    }));
    return c.json({ skills });
  });

  return app;
}
