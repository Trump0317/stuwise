# Bug 记录

> M0 端到端测试中暴露的问题及修复。

---

## 1. `.env` 文件未自动加载 🔧 已修复

**现象**：`tsx server/index.ts` 启动后无法读取 `ANTHROPIC_API_KEY`，LLM 返回 `stopReason: "error"`。

**原因**：Node.js 不会自动加载 `.env` 文件。

**方案**：使用 `dotenv` 包，在 `server/index.ts` 顶部 `import "dotenv/config"`，`.env` 在模块加载前生效。

---

## 2. 刷新页面后对话丢失 🔧 已修复

**现象**：F5 刷新后前端消息列表清空。

**原因**：前端 `useAgent` 初始化为空数组，未做持久化。

**方案**：前端用 `localStorage` 持久化消息——初始化时 `loadMessages()` 恢复，`watch(messages, deep)` 自动写入。

**限制**：localStorage 是前端副本，不与后端 JSONL 同步。M0 单会话场景够用，后续多会话管理时扩展 `GET /api/history`。

---

## 3. 部分 assistant 消息 content 为空

**现象**：历史消息中部分 assistant 消息 `content` 为 `""`。

**原因**：SSE 流式传输中客户端刷新或网络波动，`message_start` 创建空消息后流程中断。

**方案**：当前前端不加过滤（M0 阶段可接受）。后续可标记 incomplete 消息。

---

## 4. LLM 返回错误时前端无提示 🔧 已修复

**现象**：API Key 无效时，后端返回 `{ ok: true, stopReason: "error" }`，前端静默终止，不显示任何错误。

**原因**：前端只处理 `!data.ok` 的情况，未处理 `stopReason === "error"` 且无 assistant 消息的场景。

**方案**：在 `send()` 中增加判断——若 `stopReason === "error"` 且未收到 `message_start`，展示"AI 请求失败，请检查 API Key 或网络"错误横幅。同时抽取 `cleanupEventSource()` 消除重复代码。
