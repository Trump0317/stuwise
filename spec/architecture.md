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
│  │  └── Sidebar.vue     侧边栏        │  │
│  └──────────────┬─────────────────────┘  │
│                 │ fetch + SSE             │
└─────────────────┼────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│           Hono Server (端口 3000)         │
│  ┌────────────────────────────────────┐  │
│  │         server/index.ts            │  │
│  │  GET  /            → 静态文件      │  │
│  │  GET  /api/events  → SSE 事件流    │  │
│  │  POST /api/prompt  → harness.prompt│  │
│  │  POST /api/steer   → harness.steer │  │
│  │  POST /api/abort   → harness.abort │  │
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
│   ├── harness.ts            ← AgentHarness 工厂函数
│   ├── routes/
│   │   ├── prompt.ts
│   │   ├── events.ts
│   │   ├── steer.ts
│   │   └── abort.ts
│   └── config.ts             ← 启动配置
├── client/                   ← Vue 3 前端
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       ├── components/
│       │   ├── ChatView.vue
│       │   ├── ChatInput.vue
│       │   └── ToolCall.vue          ← M0 后引入
│       ├── composables/
│       │   └── useAgent.ts
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
  skillsDir: string;
  systemPrompt?: string;
}) {
  const model = getModel(options.provider, options.modelId);
  const env = new NodeExecutionEnv({ cwd: process.cwd() });

  // Session 生命周期：首次创建，后续打开
  const repo = new JsonlSessionRepo({ fs: env, sessionsRoot: options.sessionDir });
  const sessions = await repo.list();
  let session: Session;
  if (sessions.length > 0) {
    session = await repo.open(sessions[0]);
  } else {
    session = await repo.create({ cwd: options.sessionDir });
  }

  // 从 skills/ 目录加载 Skill（M1 实现，M0 时 skills/ 为空）
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

### client/src/composables/useAgent.ts — 前端状态管理

```typescript
export function useAgent() {
  const messages = ref<ChatMessage[]>([]);
  const isRunning = ref(false);
  const error = ref<string | null>(null);
  // M0 后扩展：toolCalls: Map<string, ToolCallStatus>

  async function send(text: string): Promise<void> { ... }
  function abort(): void { ... }
  function clearError(): void { ... }

  return { messages, isRunning, error, send, abort, clearError };
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
