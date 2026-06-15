# M0：工程骨架 + 最小可用原型 `[ ]`

> 目标：搭建完整项目骨架，实现端到端最小可用原型——浏览器打开聊天界面，发送消息，Agent 流式回复（纯文本对话，不含工具和 Skill）。

## 任务清单

| # | 任务 | 状态 |
|---|------|------|
| M0-1 | 工程初始化 | [x] |
| M0-2 | AgentHarness 工厂 | [~] |
| M0-3 | Hono 路由 + 开发代理 | [~] |
| M0-4 | Vue 前端骨架 + 聊天 UI | [~] |
| M0-5 | SSE 事件推流 + 前端状态管理 | [~] |
| M0-6 | 端到端集成验证 | [ ] |

---

### M0-1：工程初始化

- **目标**：初始化 Node.js 项目，安装依赖，创建目录结构，定义 API Key 配置方式
- **文件**：
  - `package.json`
  - `tsconfig.json`
  - `.env.example`
  - 完整目录结构（空目录 + `.gitkeep`）
- **实现**：
  - 写 `package.json`，配置 scripts：
    - `dev`：`concurrently "tsx server/index.ts" "vite --config client/vite.config.ts"`
    - `test`：`npx vitest run`
  - 安装生产依赖：`hono@^4`、`@earendil-works/pi-ai`、`@earendil-works/pi-agent-core`
  - 安装开发依赖：`tsx@^4`、`typescript@^5`、`vitest@^2`、`vue@^3`、`vite@^6`、`@vitejs/plugin-vue@^5`、`concurrently@^9`
  - 创建全部目录（空目录放 `.gitkeep`）：
    ```
    server/  server/routes/  client/src/components/  client/src/composables/
    tools/  skills/  data/sessions/  data/notes/
    tests/unit/  tests/integration/
    ```
  - 配置 `tsconfig.json`：ESM 模块（`module: "ESNext"`，`moduleResolution: "bundler"`），strict 模式，target ES2022
  - 创建 `.env.example`，支持多 provider（API Key 用 pi-ai 标准变量名）：
    ```
    # LLM 配置
    LLM_PROVIDER=anthropic
    LLM_MODEL=claude-3-7-sonnet-20250219
    # API Key 使用对应 provider 的标准环境变量名，pi-ai 的 getEnvApiKey() 自动识别
    ANTHROPIC_API_KEY=sk-ant-xxx
    ```
  - 更新 `.gitignore`：`node_modules/`, `dist/`, `.env`, `data/`（`data/` 是运行时数据，不纳入版本控制）
- **验收**：
  - `npm install` 成功，无报错
  - `npx vitest run` 能运行（即使没有测试文件）
  - 目录结构与 spec 一致

---

### M0-2：AgentHarness 工厂

- **目标**：创建 AgentHarness 工厂函数和启动配置（不上路由，纯逻辑测试）
- **文件**：
  - `server/harness.ts` — `createHarness()` 工厂函数
  - `server/config.ts` — 启动配置（端口、数据目录、模型配置等）
  - `tests/unit/harness.test.ts` — harness 创建测试
  - `tests/integration/harness.test.ts` — 集成测试
- **实现**：
  - `server/config.ts`：
    ```typescript
    import { getEnvApiKey } from "@earendil-works/pi-ai";

    const provider = process.env.LLM_PROVIDER || "anthropic";

    export const config = {
      port: 3000,
      model: { provider, modelId: process.env.LLM_MODEL || "claude-3-7-sonnet-20250219" },
      sessionDir: "./data/sessions",
      skillsDir: "./skills",
      // 懒求值：harness 创建时才读取，确保 .env 已加载
      getApiKey(): string { return getEnvApiKey(provider) || ""; },
    };
    ```
  - `createHarness(options)` 接收 `{ provider, modelId, apiKey, sessionDir?, systemPrompt? }`：
    - 内部调用 `getModel(provider, modelId)` 获取 `Model<any>` 对象
    - 用 `NodeExecutionEnv` 作为 `ExecutionEnv` 传给 harness
    - **Session 生命周期**：
      - `JsonlSessionRepo` 构造函数传入 `{ fs: env, sessionsRoot: sessionDir }`
      - 调用 `repo.list()` 查找已有 session：若有则 `repo.open(metadata)`，若无则 `repo.create({ cwd: sessionDir })`
    - 暂时不注册任何 tools（`tools: []`）
    - System Prompt 默认：`"你是一个友好的学生助理，帮助用户处理日常学习任务。请用中文回复。"`
  - provider/modelId 从环境变量读取（`LLM_PROVIDER`、`LLM_MODEL`），apiKey 由 config.ts 通过 pi-ai 的 `getEnvApiKey()` 自动获取
  - **测试 mock**：构造最小 Model 对象（只需 `id, name, api, provider, baseUrl, contextWindow, maxTokens, cost` 字段），无需真实 API Key
  - 单元测试：验证 `createHarness()` 返回 AgentHarness 实例，tools 为空，session 已创建
  - 集成测试：验证 `getModel()`、`getTools()`、`subscribe()` 能正常调用
- **验收**：
  - 单元测试全部通过
  - 集成测试全部通过

---

### M0-3：Hono 路由 + 开发代理

- **目标**：搭建 Hono 服务器入口，注册 API 路由，配置 Vite 开发代理
- **文件**：
  - `server/index.ts` — Hono app 创建 + 路由注册
  - `server/routes/prompt.ts` — `POST /api/prompt`
  - `server/routes/events.ts` — `GET /api/events`（骨架，M0-5 实现）
  - `server/routes/abort.ts` — `POST /api/abort`
  - `tests/integration/routes/prompt.test.ts` — prompt 路由测试
- **实现**：
  - `server/index.ts`：
    - 调用 `createHarness(config)`创建 harness
    - 注册路由：`promptRoutes(harness)`、`eventsRoutes(harness)`、`abortRoutes(harness)`
    - 启动监听 `config.port`
    - 不处理前端静态文件（开发阶段由 Vite dev server :5173 提供，M0-4 配 proxy）
  - `POST /api/prompt`：
    - 接收 `{ text: string }`
    - 调用 `harness.prompt(text)`
    - 返回 `{ ok: true, stopReason: string }`
    - 错误时返回 `{ ok: false, error: string }`
  - `GET /api/events`：先写骨架，返回 SSE headers + keep-alive 空响应（M0-5 实现推流）
  - `POST /api/abort`：
    - 调用 `harness.abort()`
    - 返回 `{ ok: true }`
  - 集成测试：
    - `POST /api/prompt`：mock harness，验证路由返回 200 和正确响应体
    - `POST /api/abort`：mock harness，验证路由返回 200
    - mock harness 报错时验证返回 500
- **验收**：
  - 集成测试全部通过
  - `npx tsx server/index.ts` 启动后能访问 `http://localhost:3000`

---

### M0-4：Vue 前端骨架 + 聊天 UI

- **目标**：搭建 Vue 3 + Vite 前端，实现聊天界面骨架（写死 mock 数据）
- **文件**：
  - `client/index.html`
  - `client/vite.config.ts` — 配置 proxy：`/api/*` → `http://localhost:3000`
  - `client/src/main.ts`
  - `client/src/App.vue`
  - `client/src/components/ChatView.vue` — 消息列表（已完成消息 + 流式消息）
  - `client/src/components/ChatInput.vue` — 输入框 + 发送按钮
  - `client/src/types.ts` — 前端类型定义
- **实现**：
  - `client/index.html`：标准 HTML5 模板，挂载 `#app`
  - `client/vite.config.ts`：
    - Vite 插件 `@vitejs/plugin-vue`
    - proxy：`/api` → `http://localhost:3000`
    - dev server 端口 5173
  - `client/src/types.ts`：
    ```typescript
    export interface ChatMessage {
      id: string;
      role: "user" | "assistant";
      content: string;
      timestamp: number;
      isStreaming?: boolean;  // 流式消息标记（M0-5 使用）
    }
    
    export interface AgentError {
      message: string;
      timestamp: number;
    }
    ```
  - `App.vue`：整体布局，顶部标题栏 + ChatView + ChatInput
  - `ChatView.vue`：
    - 渲染消息数组，区分 user / assistant 样式（用户右对齐，助手左对齐）
    - 消息内容纯文本渲染（M0 不引入 markdown 依赖，后续有必要再加）
    - 流式消息（`isStreaming: true`）末尾显示闪烁光标
    - 有新消息时自动滚动到底部
    - Props：`messages: ChatMessage[]`、`isRunning: boolean`
  - `ChatInput.vue`：
    - textarea + 发送按钮 + 停止按钮
    - Enter 发送，Shift+Enter 换行
    - 空内容时发送按钮 disabled
    - `isRunning` 时：textarea disabled、发送按钮隐藏、停止按钮显示并可点击
    - Props：`isRunning: boolean`
    - Emits：`send(text: string)`、`abort()`
  - 全部 `<script setup lang="ts">` Composition API
  - **当前阶段**：App.vue 写死 mock 数据（3-5 条 ChatMessage），传入 ChatView 验证 UI
  - ChatInput 的 `isRunning` 由 App.vue 用 `ref(false)` 传入（M0-5 改为 `useAgent().isRunning`）
- **验收**：
  - `npm run dev` 后浏览器打开 `http://localhost:5173`
  - 能看到聊天界面，消息气泡 user/assistant 样式不同
  - 输入框可用，Enter 能「发送」（虽然还没接后端）
  - 空内容时发送按钮 disabled

---

### M0-5：SSE 事件推流 + 前端状态管理

- **目标**：前端通过 SSE 接收 Agent 事件，流式更新 UI
- **文件**：
  - `client/src/composables/useAgent.ts` — SSE 连接 + 状态管理 + send/abort
  - 修改 `client/src/components/ChatInput.vue` — 对接 `useAgent().send()`
  - 修改 `client/src/components/ChatView.vue` — 对接 `useAgent().messages` + 流式消息
  - 修改 `server/routes/events.ts` — 实现 SSE 推流
  - `tests/integration/routes/events.test.ts` — events 路由测试
  - `tests/unit/composables/useAgent.test.ts` — 前端 composable 单元测试
- **实现**：
  - **后端 `GET /api/events`**：
    ```typescript
    return streamSSE(c, async (stream) => {
      // 订阅 harness 事件
      const unsub = harness.subscribe((event) => {
        stream.writeSSE({ data: JSON.stringify(event) });
      });
      // 连接断开时取消订阅
      c.req.raw.signal.addEventListener("abort", unsub);
      // 保持连接
      await new Promise(() => {});
    });
    ```
  - **前端 `useAgent()`**：
    ```typescript
    export function useAgent() {
      const messages = ref<ChatMessage[]>([]);
      const isRunning = ref(false);
      const error = ref<string | null>(null);

      async function send(text: string): Promise<void> {
        // 1. 建立 SSE 连接（GET /api/events，用 EventSource）
        // 2. 发送 POST /api/prompt { text }
        // 3. 处理 SSE 事件，更新 messages / isRunning
      }

      function abort(): void {
        // POST /api/abort
        // 关闭 EventSource 连接
        // 当前流式消息保留在 messages 中（isStreaming 置 false）
      }

      function clearError(): void { error.value = null; }

      return { messages, isRunning, error, send, abort, clearError };
    }
    ```
  - **事件处理逻辑**：
    | 事件 | 处理 |
    |------|------|
    | `agent_start` | `isRunning = true`，`error = null` |
    | `message_start` | 创建空 assistant 消息（`content: ""`, `isStreaming: true`），push 到 messages 末尾 |
    | `message_update` | 若 `event.assistantMessageEvent.type === "text_delta"`，取 `event.assistantMessageEvent.delta` 追加到 messages 最后一项的 content |
    | `message_end` | messages 最后一项的 `isStreaming` 置为 `false` |
    | `agent_end` | `isRunning = false`，关闭 EventSource |
    | EventSource error | `error = "连接断开，请重试"`，`isRunning = false` |
  - **`assistantMessageEvent` 增量文本**：`text_delta` 事件的 `delta` 字段即为增量文本字符串，直接追加即可
  - ChatView：messages 中的 `isStreaming: true` 消息末尾显示闪烁光标
  - ChatInput：`isRunning` 时禁用输入，显示「停止」按钮 → emit `abort()`
  - 集成测试：mock harness 发出预设事件序列，验证 SSE 流格式和事件顺序
  - 单元测试：useAgent 的 `send()` / `abort()` 状态转换逻辑
- **验收**：
  - 输入消息 → SSE 接收 Agent 事件 → 前端流式展示 AI 回复
  - 回复过程中输入框 disabled，可点击停止按钮中止
  - 回复完成后输入框恢复
  - 错误时前端显示错误提示（不崩溃）

---

### M0-6：端到端集成验证

- **目标**：验证完整链路（浏览器 → Hono → AgentHarness → LLM → SSE → 浏览器），纯文本对话
- **文件**：无新增文件（如有小修复，在原有文件修改）
- **实现**：
  - 在 `.env` 文件中配置真实 API Key（使用 provider 对应标准变量名）：
    ```
    LLM_PROVIDER=anthropic
    LLM_MODEL=claude-3-7-sonnet-20250219
    ANTHROPIC_API_KEY=sk-ant-your-real-key
    ```
  - `npm run dev` 启动，浏览器访问 `http://localhost:5173`
  - 浏览器中发送多条消息，逐条验证：
    - [ ] 流式回复正常（逐字出现）
    - [ ] 多轮对话正常（上下文保持）
    - [ ] 刷新页面后对话仍在（JsonlSessionRepo 持久化）
    - [ ] 停止按钮能中止正在进行的回复
    - [ ] LLM 返回错误时前端展示错误信息（不白屏）
    - [ ] 空消息无法发送
    - [ ] 无浏览器 console error
  - 修复过程中发现的 bug
- **验收**：
  - 以上全部 checklist 通过
  - 可演示「打开浏览器 → 聊天 → 刷新不丢数据」的完整流程
