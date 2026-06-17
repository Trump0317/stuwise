import { Hono } from "hono";

/**
 * Steer/FollowUp 在 v1.0 中简化为前端操作：
 * - Steer: 编辑最后一条用户消息 → 重新 /api/prompt
 * - FollowUp: 追加追问 → /api/prompt
 *
 * 无后端逻辑，保留端点供前端统一调用。
 */
export function steerRoute() {
  const app = new Hono();

  app.post("/steer", (c) => {
    // 前端实现，后端做透传标记
    return c.json({ ok: true, note: "steer handled by frontend" });
  });

  app.post("/followup", (c) => {
    return c.json({ ok: true, note: "followup handled by frontend" });
  });

  return app;
}
