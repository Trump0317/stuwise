# 架构设计

## 技术选型

| 层 | 技术 | 理由 |
|----|------|------|
| AI 协议 | `@earendil-works/pi-ai` | 封装 9 种 LLM Provider 差异，自带模型发现 `getModel()` |
| Agent 框架 | `@earendil-works/pi-agent-core` (AgentHarness) | 提供 Session 持久化、compaction、hook 系统、工具管理、Skill 加载，零 TUI 耦合 |
| 后端框架 | Hono | 原生 SSE 支持、内置静态文件托管、TypeScript 友好，最小依赖 |
| 前端框架 | Vue 3 + Vite | 渐进式、响应式状态管理、组合式 API（composable）适合 SSE 事件驱动的 UI |
| 持久化 | AgentHarness 内置 `JsonlSessionRepo` | 对话历史 JSONL 存储，无需额外数据库 |

## 技术不选型

| 不选 | 原因 |
|------|------|
| Express / Fastify | Hono 的 SSE 支持更简洁，同样场景下代码量少 30%+ |
| React | Vue 3 的 Composition API 更适合 SSE 流式状态管理，学习曲线更低 |
| coding-agent 直接扩展 | 深度绑定 TUI，改成 Web 约等于重写 |
| 数据库 (SQLite/Postgres) | 单用户本地场景不需要，JSONL 足够 |
| 为每个场景写专用工具 | 违背通用性。场景能力通过 Skill 注入 System Prompt，指导 Agent 用通用工具实现 |

## 架构图

```
┌──────────────────────────────────────────┐
│          Browser (localhost:3000)         │
│  ┌────────────────────────────────────┐  │
│  │         Vue 3 前端 (Vite)          │  │
│  │  App.vue                           │  │
│  │  ├── ChatView.vue    消息列表       │  │
│  │  ├── ChatInput.vue   输入框         │  │
│  │  ├── ToolCall.vue    工具调用展示   │  │
│  │  ├── SessionList.vue 会话列表       │  │
│  │  ├── SkillList.vue   Skill 开关     │  │
│  │  └── ConfigPanel.vue 配置面板       │  │
│  └──────────────┬─────────────────────┘  │
│                 │ fetch + SSE             │
└─────────────────┼────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│           Hono Server (端口 3000)         │
│  ┌────────────────────────────────────┐  │
│  │         server/index.ts            │  │
│  │  API 端点 → 见下方《API 端点清单》   │  │
│  └──────────────┬─────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│           AgentHarness (全局单例)          │
│  ┌────────────────────────────────────┐  │
│  │  env: NodeExecutionEnv(cwd)        │  │
│  │  session: JsonlSessionRepo         │  │
│  │  model: Model<any>                 │  │
│  │  tools: 9 个通用工具               │  │
│  │  resources.skills: 从 skills/ 加载 │  │
│  │  hooks: on(event, handler)         │  │
│  └──────────────┬─────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│            通用工具 (tools/)               │
│  read │ bash │ edit │ write │ grep       │
│  find │ ls   │ web_search │ web_fetch   │
├──────────────────────────────────────────┤
│            场景 Skill (skills/)            │
│  笔记管理 │ 知识库检索 │ 待办管理 │ 排课表 │
└──────────────────────────────────────────┘
```

## 设计原则：通用工具 + 场景 Skill

不创建 `note_read`、`note_write` 等专用工具。而是：

- **工具层** 只提供通用能力（文件操作、搜索、网络）
- **Skill 层** 通过 system prompt 注入指导 Agent 如何在特定场景下使用这些工具

例如笔记管理 Skill 的 SKILL.md 内容：

```markdown
---
name: note-management
description: Manage student notes
---

## 笔记管理

你管理 `data/notes/` 目录下的学生笔记。所有笔记为 markdown 格式。

- 创建笔记：使用 write 工具写入 `data/notes/<标题>.md`
- 读取笔记：使用 read 工具读取
- 编辑笔记：使用 edit 工具精确替换
- 搜索笔记：使用 grep 工具在 `data/notes/` 目录下搜索
- 列出笔记：使用 ls 工具列出 `data/notes/` 目录

命名规范：`YYYY-MM-DD-课程名-主题.md`
```

## 目录结构

```
stuwise/
├── spec/                     ← 规格说明书（本目录）
│   ├── index.md
│   ├── overview.md
│   ├── architecture.md
│   ├── testing.md
│   ├── workflow.md
│   ├── milestones.md
│   └── milestones/
├── server/                   ← Hono 后端
│   ├── index.ts              ← 入口：创建 app + harness + 注册路由
│   ├── harness.ts            ← 入口（56 行），re-export 子模块
│   ├── types.ts              ← 共享类型（SessionInfo/RuntimeConfig/...）
│   ├── harness/              ← harness 子模块（按功能拆分）
│   │   ├── state.ts          ← 内部共享状态（$）
│   │   ├── build.ts          ← buildHarness
│   │   ├── session.ts        ← session CRUD
│   │   ├── skill.ts          ← skill 开关
│   │   ├── config.ts         ← 配置管理
│   │   └── compact.ts        ← 压缩检查
│   ├── routes/
│   │   ├── prompt.ts
│   │   ├── events.ts
│   │   ├── steer.ts
│   │   ├── abort.ts
│   │   ├── skills.ts
│   │   ├── session.ts
│   │   ├── config.ts
│   │   ├── health.ts
│   │   └── compact.ts
│   └── config.ts             ← 启动配置（env 读取）
├── client/                   ← Vue 3 前端
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       ├── components/
│       │   ├── ChatView.vue
│       │   ├── ChatInput.vue
│       │   ├── ToolCall.vue
│       │   ├── SkillList.vue
│       │   ├── SessionList.vue
│       │   └── ConfigPanel.vue
│       ├── composables/
│       │   ├── useAgent.ts      ← 组合入口
│       │   ├── useSession.ts    ← session 管理
│       │   ├── useSkills.ts     ← skill 操作
│       │   └── constants.ts     ← 常量提取
│       └── types.ts
├── tools/                    ← 通用 AgentTool（9 个）
│   ├── index.ts              ← 注册所有工具
│   ├── read.ts
│   ├── bash.ts
│   ├── edit.ts
│   ├── write.ts
│   ├── grep.ts
│   ├── find.ts
│   ├── ls.ts
│   ├── web-search.ts
│   └── web-fetch.ts
├── skills/                   ← 场景 Skill（SKILL.md 文件）
│   ├── note-management/
│   │   └── SKILL.md
│   ├── knowledge-retrieval/
│   │   └── SKILL.md
│   └── todo-management/
│       └── SKILL.md
├── data/                     ← 运行时数据
│   ├── sessions/             ← JSONL 对话历史
│   └── notes/                ← 用户笔记目录
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
├── .env.example
└── AGENTS.md
```

## API 端点清单

### 对话

| 方法 | 路径 | 说明 | 文件 |
|------|------|------|------|
| GET | `/api/events` | SSE 事件流（agent 实时推送） | `server/routes/events.ts` |
| POST | `/api/prompt` | 发送消息 | `server/routes/prompt.ts` |
| POST | `/api/abort` | 中断当前运行 | `server/routes/abort.ts` |
| POST | `/api/steer` | 编辑最后一条消息重新生成 | `server/routes/steer.ts` |
| POST | `/api/followup` | 在最后追加追问 | 同上 |

### Session

| 方法 | 路径 | 说明 | 文件 |
|------|------|------|------|
| GET | `/api/session` | 列出所有 Session | `server/routes/session.ts` |
| POST | `/api/session` | 新建 Session | 同上 |
| GET | `/api/session/:id` | 获取 Session 对话历史 | 同上 |
| DELETE | `/api/session/:id` | 删除 Session + JSONL | 同上 |
| PUT | `/api/session/:id` | 切换当前 Session | 同上 |
| POST | `/api/compact` | 压缩 Session context | `server/routes/compact.ts` |

### Skill

| 方法 | 路径 | 说明 | 文件 |
|------|------|------|------|
| GET | `/api/skills` | 获取 Skill 列表（含启用状态） | `server/routes/skills.ts` |
| PUT | `/api/skills/:name` | 切换 Skill 启用/禁用 | 同上 |

### 配置

| 方法 | 路径 | 说明 | 文件 |
|------|------|------|------|
| GET | `/api/config` | 获取当前配置（provider, modelId, hasApiKey） | `server/routes/config.ts` |
| PUT | `/api/config` | 更新配置（apiKey, provider, modelId） | 同上 |

### 系统

| 方法 | 路径 | 说明 | 文件 |
|------|------|------|------|
| GET | `/api/health` | 健康检查 + Token 用量 | `server/routes/health.ts` |

## 核心模块接口

### server/harness.ts — AgentHarness 工厂

```typescript
import { AgentHarness } from "@earendil-works/pi-agent-core";
import { NodeExecutionEnv } from "@earendil-works/pi-agent-core/node";
import { JsonlSessionRepo, loadSkills } from "@earendil-works/pi-agent-core";
import { createAllTools } from "../tools/index.ts";

export async function createHarness(options: {
  provider: string;
  modelId: string;
  apiKey: string;
  sessionDir: string;
  systemPrompt?: string;
  sessionId?: string;
}) {
  const model = getModel(options.provider, options.modelId);
  const env = new NodeExecutionEnv({ cwd: process.cwd() });

  // Session 生命周期：指定 → 已有 → 新建
  const repo = new JsonlSessionRepo({ fs: env, sessionsRoot: options.sessionDir });
  const sessions = await repo.list();
  let session: Session;
  if (options.sessionId) {
    session = await repo.openById(options.sessionId);
  } else if (sessions.length > 0) {
    session = await repo.open(sessions[0]);
  } else {
    session = await repo.create({ cwd: options.sessionDir });
  }

  // 从 skills/ 目录加载 Skill
  const { skills } = await loadSkills(env, options.skillsDir);

  const tools = createAllTools(env);  // M1 实现，M0 时 tools: []
  const systemPrompt = buildSystemPrompt(options.systemPrompt, skills);

  return new AgentHarness({
    env,
    session,
    model,
    tools,
    systemPrompt,
    resources: { skills },
    getApiKeyAndHeaders: () => ({ apiKey: options.apiKey }),
  });
}
```

### server/index.ts — Hono 入口

```typescript
const app = new Hono();
const harness = await createHarness({...});

app.get("/", serveStatic({ root: "./client/dist" }));

app.get("/api/events", (c) => streamSSE(c, async (stream) => {
  const unsub = harness.subscribe((event) => {
    stream.writeSSE({ data: JSON.stringify(event) });
  });
  c.req.raw.signal.addEventListener("abort", unsub);
  await new Promise(() => {});
}));

app.post("/api/prompt", async (c) => {
  const { text } = await c.req.json();
  const result = await harness.prompt(text);
  return c.json({ ok: true, stopReason: result.stopReason });
});
```

### tools/ — 通用工具接口

```typescript
// tools/index.ts
export function createAllTools(env: ExecutionEnv): AgentTool[] {
  return [
    createReadTool(),
    createBashTool(),
    createEditTool(),
    createWriteTool(),
    createGrepTool(),
    createFindTool(),
    createLsTool(),
    createWebSearchTool(),
    createWebFetchTool(),
  ];
}
```

所有工具都是通用的，不绑定任何业务场景。

### client/src/composables/ — 前端状态管理（4 个 composable）

```typescript
// useSession.ts — session CRUD + 状态
{ sessions, currentSessionId, fetchSessions, loadSession, create, delete, switch }

// useSkills.ts — skill 开关
{ skills, fetchSkills, toggleSkill }

// useAgent.ts — 组合入口
function useAgent() {
  const session = useSession();
  const skill = useSkills();
  const timeline = ref<TimelineItem[]>([]);
  const isRunning = ref(false);

  function init()           { session.fetchSessions(); skill.fetchSkills(); ... }
  function send(text)       { ... }        // SSE + /api/prompt
  function handleEvent(e)   { ... }        // SSE 事件处理
  function steer(text)      { ... }        // 编辑重生成
  function abort()          { ... }        // 中断

  return { timeline, sessions, currentSessionId, skills,
           isRunning, error, send, abort, init,
           createSession, deleteSession, switchSession, steer, toggleSkill };
}
```

## 数据流 — 一次对话请求

```
用户在 ChatInput 输入 "帮我总结今天的笔记"
    │
    ▼
useAgent.send("帮我总结今天的笔记")
    │
    ├── GET  /api/events (建立 SSE 长连接)
    │
    ├── POST /api/prompt { text: "帮我总结..." }
    │         │
    │         ▼
    │   harness.prompt("帮我总结...")
    │         │
    │         ├── System Prompt 中已注入「笔记管理」Skill 指令
    │         │     → Agent 知道用 ls 列出 data/notes/、用 read 读取
    │         │
    │         ├── Agent 调用 ls 工具列出笔记文件
    │         ├── Agent 调用 read 工具读取今天日期的笔记
    │         │
    │         ├── Agent 调用 LLM 生成总结
    │         │
    │         └── 每次事件触发 harness.subscribe 回调
    │               │
    │               ▼
    │         stream.writeSSE({ data: JSON.stringify(event) })
    │               │
    └───────────────┤
                    ▼
    SSE onmessage → useAgent 更新 messages/streaming/toolCalls
                    │
                    ▼
    Vue 响应式渲染 → ChatView 显示消息气泡 + 工具调用状态
```
