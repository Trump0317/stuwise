import { Hono } from "hono";
import { getSkillsWithStatus, toggleSkill } from "../harness";

export function skillsRoute() {
  const app = new Hono();

  app.get("/skills", (c) => {
    const skills = getSkillsWithStatus();
    return c.json({ ok: true, data: { skills } });
  });

  app.put("/skills/:name", async (c) => {
    const name = c.req.param("name");
    try {
      const enabled = await toggleSkill(name);
      return c.json({ ok: true, data: { name, enabled } });
    } catch (err) {
      return c.json({ ok: false, error: (err as Error).message }, 500);
    }
  });

  return app;
}
