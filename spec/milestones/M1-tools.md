# M1：工具系统 `[ ]`

> 目标：接入 9 个通用工具（文件 + 搜索 + 命令 + 网络），前端展示工具调用状态。

## 任务清单

| # | 任务 | 状态 | 依赖 |
|---|------|------|------|
| M1-1 | 文件工具：read, write, edit, ls | [ ] | — |
| M1-2 | 搜索工具：grep, find | [ ] | — |
| M1-3 | 命令工具：bash | [ ] | — |
| M1-4 | 网络工具：web_search, web_fetch | [ ] | — |
| M1-5 | 工具注册 + harness 集成 | [ ] | M1-1 ~ M1-4 |
| M1-6 | 前端工具调用状态展示 (ToolCall.vue) | [ ] | M1-5 |
| M1-7 | 端到端集成验证 | [ ] | 全部 |

---

## M1-1：文件工具 read / write / edit / ls

### 范围

实现 4 个文件操作工具，满足 `AgentTool` 接口。

### 依赖

- `@earendil-works/pi-agent-core` 的 `AgentTool` 接口
- TypeBox (`@sinclair/typebox`) 定义参数 schema
- Node.js `fs/promises`、`path`

### AgentTool 接口

```typescript
export interface AgentTool<TParameters extends TSchema = TSchema, TDetails = any> extends Tool<TParameters> {
  label: string;
  prepareArguments?: (args: unknown) => Static<TParameters>;
  execute: (toolCallId: string, params: Static<TParameters>, signal?: AbortSignal, onUpdate?: AgentToolUpdateCallback<TDetails>) => Promise<AgentToolResult<TDetails>>;
  executionMode?: ToolExecutionMode;
}
```

`Tool<TParameters>` 来自 pi-ai，包含 `name`、`description`、`parameters`（TypeBox schema）。

### 工具规格

#### read

| 属性 | 值 |
|------|-----|
| name | `read` |
| label | `读取文件` |
| 参数 | `path: string`, `offset?: number`, `limit?: number` |
| 功能 | 读取文件内容，文本和图片均可。自动截断（50KB / 2000 行）。大文件用 offset/limit 分片 |
| 返回 | `{ content: [{ type: "text", text: "..." }] }` |

#### write

| 属性 | 值 |
|------|-----|
| name | `write` |
| label | `写入文件` |
| 参数 | `path: string`, `content: string` |
| 功能 | 创建或覆盖文件，自动创建父目录 |
| 返回 | `{ content: [{ type: "text", text: "文件已写入" }] }` |

#### edit

| 属性 | 值 |
|------|-----|
| name | `edit` |
| label | `编辑文件` |
| 参数 | `path: string`, `edits: { oldText: string, newText: string }[]` |
| 功能 | 精确文本替换，oldText 必须唯一匹配。支持一次多个编辑 |
| 返回 | `{ content: [{ type: "text", text: "已应用 N 处修改" }] }` |

#### ls

| 属性 | 值 |
|------|-----|
| name | `ls` |
| label | `列出目录` |
| 参数 | `path?: string` |
| 功能 | 列出目录内容，默认当前目录 |
| 返回 | `{ content: [{ type: "text", text: "file1\nfile2\n..." }] }` |

### 测试策略

- 每个工具编写单元测试
- 创建临时目录和文件模拟文件系统操作
- 测试正常情况 + 异常情况（文件不存在、权限等）

### 验收条件

- [ ] 4 个工具通过单元测试
- [ ] AgentHarness 传入 `tools: [read, write, edit, ls]` 后 Agent 能调用这些工具
- [ ] SSE 事件流包含 `tool_call` 和 `tool_result` 事件

---

## M1-2：搜索工具 grep / find

### 范围

实现 grep（文本搜索）和 find（文件名搜索）工具。

### 工具规格

#### grep

| 属性 | 值 |
|------|-----|
| name | `grep` |
| label | `搜索文本` |
| 参数 | `pattern: string`, `path?: string` |
| 功能 | 在指定目录下递归搜索文本匹配，返回文件名和匹配行 |
| 返回 | `{ content: [{ type: "text", text: "path:line_num: matched line\n..." }] }` |

#### find

| 属性 | 值 |
|------|-----|
| name | `find` |
| label | `查找文件` |
| 参数 | `pattern: string`, `path?: string` |
| 功能 | 在指定目录下按文件名 pattern 查找文件 |
| 返回 | `{ content: [{ type: "text", text: "/path/to/file\n..." }] }` |

### 验收条件

- [ ] grep 和 find 通过单元测试
- [ ] SSE 流中能看到搜索工具的执行

---

## M1-3：命令工具 bash

### 范围

实现 bash 工具，允许 Agent 执行 shell 命令。

### 工具规格

| 属性 | 值 |
|------|-----|
| name | `bash` |
| label | `执行命令` |
| 参数 | `command: string`, `timeout?: number` |
| 功能 | 在服务器工作目录执行命令，捕获 stdout/stderr。默认超时 30s |
| 返回 | `{ content: [{ type: "text", text: "stdout..." }], details: { exitCode, stderr } }` |

### 安全限制

- 超时默认 30s，最大 120s
- 不支持交互式命令

### 验收条件

- [ ] bash 工具通过单元测试（mock exec）
- [ ] 超时机制正常工作

---

## M1-4：网络工具 web_search / web_fetch

### 范围

实现网络搜索和网页抓取工具。

### 依赖

- DuckDuckGo Lite（`lite.duckduckgo.com`，零依赖，正则解析 HTML）
- Node.js `fetch` 抓取网页并提取纯文本

### 工具规格

#### web_search

| 属性 | 值 |
|------|-----|
| name | `web_search` |
| label | `搜索网络` |
| 参数 | `query: string`, `max_results?: number` |
| 功能 | 通过 DuckDuckGo API 搜索，返回标题、URL、摘要 |
| 返回 | `{ content: [{ type: "text", text: "1. Title (URL)\n   Snippet\n..." }] }` |

#### web_fetch

| 属性 | 值 |
|------|-----|
| name | `web_fetch` |
| label | `抓取网页` |
| 参数 | `url: string` |
| 功能 | 抓取网页内容，提取纯文本，剔除 HTML 标签 |
| 返回 | `{ content: [{ type: "text", text: "..." }] }` |

### 验收条件

- [ ] web_search 和 web_fetch 通过单元测试（mock HTTP）
- [ ] 能搜索真实网络内容

---

## M1-5：工具注册 + harness 集成

### 范围

创建 `tools/index.ts`，注册所有工具，集成到 harness 工厂。

### 实现

M1 阶段用工厂函数批量创建，后续可改为插件式加载（从 `tools/` 目录自动发现）。

```typescript
// tools/index.ts
export function createAllTools(): AgentTool[] {
  return [
    createReadTool(),
    createWriteTool(),
    createEditTool(),
    createLsTool(),
    createGrepTool(),
    createFindTool(),
    createBashTool(),
    createWebSearchTool(),
    createWebFetchTool(),
  ];
}
```

更新 `server/harness.ts` 的 `createHarness()`：

```typescript
const tools = createAllTools();
return new AgentHarness({ ...options, tools });
```

### 验收条件

- [ ] `createAllTools()` 返回 9 个工具
- [ ] harness 构造时 tools 参数正确传入
- [ ] 集成测试：发送 prompt 后 Agent 能调用工具

---

## M1-6：前端工具调用状态展示

### 范围

新增 `ToolCall.vue` 组件（在 `ChatView.vue` 中嵌入），处理 SSE 中的 `tool_call` 和 `tool_result` 事件。

### 组件设计

```
[消息气泡]
   ├── 用户消息          你好，帮我看看 data/ 目录有什么
   ├── ToolCall          列出目录 (running...)
   │   └── 结果: file1.txt, file2.txt
   ├── 用户消息（可选）   继续
   └── Assistant 消息    data/ 目录下有 file1.txt...
```

### useAgent 扩展

```typescript
// 新增类型
interface ToolCallStatus {
  id: string;
  name: string;
  label: string;
  input: Record<string, unknown>;
  state: "running" | "done" | "error";
  result?: { content: Array<{ type: string; text?: string }>; isError: boolean };
}

// useAgent 新增字段
const toolCalls = ref<Map<string, ToolCallStatus>>(new Map());
```

### SSE 事件处理

```typescript
case "tool_call":
  // 插入 tool call 卡片
  toolCalls.set(event.toolCallId, {
    id: event.toolCallId,
    name: event.toolName,
    label: toolLabel(event.toolName),
    input: event.input,
    state: "running",
  });
  break;

case "tool_result":
  // 更新 tool call 卡片
  toolCalls.set(event.toolCallId, {
    ...existing,
    state: event.isError ? "error" : "done",
    result: { content: event.content, isError: event.isError },
  });
  break;
```

### ToolCall.vue

```vue
<template>
  <div class="tool-call" :class="{ error: status.state === 'error' }">
    <div class="tool-header">
      <span class="tool-icon">{{ icon }}</span>
      <span class="tool-label">{{ status.label }}</span>
      <span class="tool-state">{{ stateText }}</span>
    </div>
    <div v-if="status.state !== 'running'" class="tool-result">
      {{ resultText }}
    </div>
  </div>
</template>
```

### 验收条件

- [ ] ToolCall.vue 渲染 tool_call 事件
- [ ] running → done/error 状态切换流畅
- [ ] 工具结果折叠展开
- [ ] 样式与其他消息气泡协调

---

## M1-7：端到端集成验证

### 验证清单

- [ ] `npm run dev` 启动，浏览器打开
- [ ] 发送「列出 data/notes/ 目录」→ Agent 调用 ls 工具 → 显示结果
- [ ] 发送「创建一个笔记 test.md」→ Agent 调用 write 工具 → 文件创建成功
- [ ] 发送「搜索所有提到 hello 的文件」→ Agent 调用 grep 工具 → 显示匹配
- [ ] 发送「搜索 Vue 3 的最新文档」→ Agent 调用 web_search → 显示结果
- [ ] 9 个工具都能正常调用和显示
- [ ] Console 无错误
- [ ] bug 记录到 spec/bug/M1-bug.md
