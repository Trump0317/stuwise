import { Hono } from "hono";
import {
  listSessions,
  createSession,
  deleteSession,
  switchSession,
  getSessionMessages,
} from "../harness";

export function sessionRoute() {
  const app = new Hono();

  // 列出所有 session
  app.get("/session", async (c) => {
    const sessions = await listSessions();
    return c.json({ sessions });
  });

  // 新建 session
  app.post("/session", async (c) => {
    const info = await createSession();
    return c.json({ session: info }, 201);
  });

  // 获取 session 对话历史
  app.get("/session/:id", async (c) => {
    const id = c.req.param("id");
    try {
      const messages = await getSessionMessages(id);
      return c.json({ messages });
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      return c.json({ ok: false, error: message }, 404);
    }
  });

  // 删除 session
  app.delete("/session/:id", async (c) => {
    const id = c.req.param("id");
    try {
      await deleteSession(id);
      return c.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      return c.json({ ok: false, error: message }, 404);
    }
  });

  // 切换 session
  app.put("/session/:id", async (c) => {
    const id = c.req.param("id");
    try {
      const info = await switchSession(id);
      return c.json({ session: info });
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      return c.json({ ok: false, error: message }, 404);
    }
  });

  return app;
}
