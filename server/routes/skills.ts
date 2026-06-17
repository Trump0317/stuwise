import { Hono } from "hono";
import { getSkillsWithStatus, toggleSkill } from "../harness";

export function skillsRoute() {
  const app = new Hono();

  app.get("/skills", (c) => {
    const skills = getSkillsWithStatus();
    return c.json({ skills });
  });

  app.put("/skills/:name", async (c) => {
    const name = c.req.param("name");
    try {
      const enabled = await toggleSkill(name);
      return c.json({ ok: true, name, enabled });
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      return c.json({ ok: false, error: message }, 500);
    }
  });

  return app;
}
