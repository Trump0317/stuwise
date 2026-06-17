import { Hono } from "hono";
import { listSessions, createSession, deleteSession, switchSession, getSessionMessages } from "../harness";

export function sessionRoute() {
  const app = new Hono();

  app.get("/session", async (c) => {
    const sessions = await listSessions();
    return c.json({ ok: true, data: { sessions } });
  });

  app.post("/session", async (c) => {
    const info = await createSession();
    return c.json({ ok: true, data: { session: info } }, 201);
  });

  app.get("/session/:id", async (c) => {
    const id = c.req.param("id");
    try {
      const messages = await getSessionMessages(id);
      return c.json({ ok: true, data: { messages } });
    } catch (err) {
      return c.json({ ok: false, error: (err as Error).message }, 404);
    }
  });

  app.delete("/session/:id", async (c) => {
    const id = c.req.param("id");
    try {
      await deleteSession(id);
      return c.json({ ok: true, data: {} });
    } catch (err) {
      return c.json({ ok: false, error: (err as Error).message }, 404);
    }
  });

  app.put("/session/:id", async (c) => {
    const id = c.req.param("id");
    try {
      const info = await switchSession(id);
      return c.json({ ok: true, data: { session: info } });
    } catch (err) {
      return c.json({ ok: false, error: (err as Error).message }, 404);
    }
  });

  return app;
}
