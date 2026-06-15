# M0：工程骨架 + 最小可用原型 `[ ]`

> 目标：搭建完整项目骨架，实现端到端最小可用原型——浏览器打开聊天界面，发送消息，Agent 流式回复（纯文本对话，不含工具和 Skill）。

## 任务清单

| # | 任务 | 状态 |
|---|------|------|
| M0-1 | 工程初始化 | [ ] |
| M0-2 | AgentHarness 工厂 + 后端路由 | [ ] |
| M0-3 | Vue 前端骨架 + 聊天 UI | [ ] |
| M0-4 | SSE 事件推流 + 前端状态管理 | [ ] |
| M0-5 | 端到端集成验证 | [ ] |
| M0-6 | 基础 System Prompt + Skill 加载骨架 | [ ] |

---

### M0-1：工程初始化

- **目标**：初始化 Node.js 项目，安装依赖，创建目录结构
- **文件**：`package.json`, `tsconfig.json`, `.gitignore`, 完整目录结构
- **实现**：
  - 写 `package.json`，配置 scripts（`dev`/`build`/`test`）
  - 安装依赖：`@earendil-works/pi-ai`, `@earendil-works/pi-agent-core`, `hono`, `vue`, `vite`, `@vitejs/plugin-vue`, `tsx`
  - 安装测试依赖：`vitest`, `jsdom`, `@vue/test-utils`
  - 创建全部目录：`server/`, `client/`, `tools/`, `skills/`, `data/`, `tests/`
  - 配置 `tsconfig.json`（ESM, strict）
- **验收**：
  - `npm install` 成功
  - `tsx server/index.ts` 启动不报错（空 server）
  - `npx vitest run` 能运行

---

### M0-2：AgentHarness 工厂 + 后端路由

- **目标**：创建 AgentHarness 实例，搭建 Hono 路由骨架（先不接工具和 Skill，纯文本对话）
- **文件**：
  - `server/harness.ts` — `createHarness()` 工厂函数
  - `server/config.ts` — 启动配置（端口、默认模型、数据目录）
  - `server/index.ts` — Hono app 创建 + Vite 开发模式代理
  - `server/routes/prompt.ts` — `POST /api/prompt`
  - `server/routes/events.ts` — `GET /api/events`
  - `server/routes/steer.ts` — `POST /api/steer`
  - `server/routes/abort.ts` — `POST /api/abort`
- **实现**：
  - `createHarness()` 接收 `{ model, apiKey, systemPrompt }`，返回 AgentHarness 实例
  - 使用 `JsonlSessionRepo`，session 持久化到 `data/sessions/`
  - 暂时不注册任何 tools（`tools: []`）
  - System Prompt 简单写死（或从文件读取）
  - `POST /api/prompt` 接收 `{ text }`，调用 `harness.prompt(text)`
- **验收**：
  - 单元测试：`createHarness()` 能成功创建 AgentHarness 实例
  - 集成测试：`POST /api/prompt` 能收到 200 响应（不挂 LLM API key 时报 auth 错属于正常）

---

### M0-3：Vue 前端骨架 + 聊天 UI

- **目标**：搭建 Vue 3 + Vite 前端，实现聊天界面骨架
- **文件**：
  - `client/index.html`
  - `client/vite.config.ts` — 配置 proxy：`/api/*` → Hono :3000
  - `client/src/main.ts`
  - `client/src/App.vue`
  - `client/src/components/ChatView.vue` — 消息列表
  - `client/src/components/ChatInput.vue` — 输入框
  - `client/src/types.ts` — 前端类型定义
- **实现**：
  - 简洁聊天 UI（参考 ChatGPT 布局）：消息列表在上，输入框在下
  - ChatView：渲染消息数组，区分 user / assistant
  - ChatInput：textarea + 发送按钮，Enter 发送，Shift+Enter 换行
  - `<script setup>` Composition API
  - 当前阶段数据写死在前端（mock 几条消息），验证 UI 渲染正常
- **验收**：
  - `npm run dev` 后浏览器打开，能看到聊天界面
  - 有 mock 消息气泡，user 和 assistant 样式不同

---

### M0-4：SSE 事件推流 + 前端状态管理

- **目标**：前端通过 SSE 接收 Agent 事件，流式更新 UI
- **文件**：
  - `client/src/composables/useAgent.ts` — SSE 连接 + 状态管理
  - `client/src/components/StreamMessage.vue` — 流式气泡组件
  - 修改 `server/routes/events.ts` — 实现 SSE 推流
- **实现**：
  - **后端**：
    - `GET /api/events` 建立 SSE 长连接
    - `harness.subscribe()` 回调中 `stream.writeSSE()`
    - 处理客户端断开重连
  - **前端 useAgent()**：
    - `messages: AgentMessage[]` — 已完成的消息
    - `streamingContent: string` — 当前流式文本
    - `isRunning: boolean` — 是否正在执行
    - `send(text)` — 建立 SSE → POST prompt → 等待结束
    - 处理 `message_start` / `message_update` / `message_end` / `agent_end` 事件
  - ChatView 区分：已完成消息 vs 流式消息
  - 回复进行中输入框 disabled，回复完成后恢复
- **验收**：
  - 输入消息发送后，能看到 AI 流式回复
  - 回复过程中输入框不可用
  - 回复完成后输入框恢复

---

### M0-5：端到端集成验证

- **目标**：验证完整链路（浏览器 → Hono → AgentHarness → LLM → SSE → 浏览器），纯文本对话
- **文件**：无新增文件
- **实现**：
  - 配置真实的 API Key + 模型
  - 浏览器发送多条消息，验证：
    - 流式回复正常
    - 多轮对话正常
    - 刷新页面后对话仍在（JsonlSessionRepo 持久化）
  - 前端处理错误状态（LLM 失败时展示错误提示）
  - 处理 abort（开发中 LLM 响应慢时能中断）
- **验收**：
  - 端到端流程完整可用
  - 无 console error
  - 刷新页面不丢失数据

---

### M0-6：基础 System Prompt + Skill 加载骨架

- **目标**：编写基础 System Prompt + 搭建 Skill 加载管线（为 M1 做准备）
- **文件**：
  - `server/prompt.ts` — `buildSystemPrompt()` 函数
  - `skills/` 目录创建（空目录，M1 再写 SKILL.md）
  - 修改 `server/harness.ts` — 集成 `loadSkills()` 调用
- **实现**：
  - 编写基础 System Prompt，包含：
    - Agent 身份（学生助理）
    - 当前日期 + 工作目录
    - 预留 `{skills}` 占位符用于注入 Skill 内容
  - Harness 工厂函数调用 `loadSkills(env, skillsDir)` 加载 Skill
  - 用 `formatSkillsForSystemPrompt(skills)` 生成 XML 块注入 System Prompt
  - 如果 `skills/` 目录为空，不注入 Skill 块
- **验收**：
  - 后端启动时自动扫描 `skills/` 目录
  - 目录为空时 System Prompt 不含 Skill 块
  - 单元测试：`buildSystemPrompt()` 正确拼接 Skill 内容
