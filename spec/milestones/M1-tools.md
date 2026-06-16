# M1：工具系统 `[ ]`

> 目标：接入 9 个通用工具（文件 + 搜索 + 命令 + 网络），前端展示工具调用状态。

## 任务清单

| # | 任务 | 状态 | 依赖 |
|---|------|------|------|
| M1-1 | read 文件读取工具 | [x] | — |
| M1-2 | write 文件写入工具 | [x] | — |
| M1-3 | edit 文件编辑工具 | [x] | — |
| M1-4 | ls 目录列出工具 | [~] | — |
| M1-5 | grep 文本搜索工具 | [ ] | — |
| M1-6 | find 文件名查找工具 | [ ] | — |
| M1-7 | bash 命令执行工具 | [ ] | — |
| M1-8 | web_search 网络搜索工具 | [ ] | — |
| M1-9 | web_fetch 网页抓取工具 | [ ] | — |
| M1-10 | 工具注册 + harness 集成 | [ ] | M1-1 ~ M1-9 |
| M1-11 | 前端工具调用状态展示 (ToolCall.vue) | [ ] | M1-10 |
| M1-12 | 端到端集成验证 | [ ] | 全部 |

---

## 关键依赖 API

### AgentTool 接口（@earendil-works/pi-agent-core）

```typescript
export interface AgentTool<TParameters extends TSchema = TSchema, TDetails = any> extends Tool<TParameters> {
  label: string;
  prepareArguments?: (args: unknown) => Static<TParameters>;
  execute: (
    toolCallId: string,
    params: Static<TParameters>,
    signal?: AbortSignal,
    onUpdate?: AgentToolUpdateCallback<TDetails>
  ) => Promise<AgentToolResult<TDetails>>;
  executionMode?: ToolExecutionMode;
}

export interface AgentToolResult<T> {
  content: (TextContent | ImageContent)[];
  details: T;
  terminate?: boolean;
}
```

### ExecutionEnv（@earendil-works/pi-agent-core）

```typescript
// ExecutionEnv extends FileSystem, Shell
export interface FileSystem {
  cwd: string;
  absolutePath(path: string, abortSignal?: AbortSignal): Promise<Result<string, FileError>>;
  joinPath(parts: string[], abortSignal?: AbortSignal): Promise<Result<string, FileError>>;
  readTextFile(path: string, abortSignal?: AbortSignal): Promise<Result<string, FileError>>;
  readTextLines(path: string, options?: { maxLines?: number; abortSignal?: AbortSignal }): Promise<Result<string[], FileError>>;
  readBinaryFile(path: string, abortSignal?: AbortSignal): Promise<Result<Uint8Array, FileError>>;
  writeFile(path: string, content: string | Uint8Array, abortSignal?: AbortSignal): Promise<Result<void, FileError>>;
  listDir(path: string, abortSignal?: AbortSignal): Promise<Result<FileInfo[], FileError>>;
  // ... 更多
}

export interface Shell {
  exec(command: string, options?: {
    cwd?: string; env?: Record<string, string>; timeout?: number;
    abortSignal?: AbortSignal; onStdout?: (chunk: string) => void; onStderr?: (chunk: string) => void;
  }): Promise<Result<{ stdout: string; stderr: string; exitCode: number }, ExecutionError>>;
}

// listDir 返回 FileInfo
export interface FileInfo {
  name: string;    // 文件名
  path: string;    // 绝对路径
  kind: "file" | "directory" | "symlink";
  size: number;    // 字节数
  mtimeMs: number; // 修改时间（毫秒时间戳）
}

// Result 是 ok/error 联合类型，不抛异常
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

> **Node 运行时**：用 `new NodeExecutionEnv({ cwd: process.cwd() })` 创建。

### AgentEvent（工具相关）

```typescript
type ToolEvent =
  | { type: "tool_execution_start"; toolCallId: string; toolName: string; args: any }
  | { type: "tool_execution_update"; toolCallId: string; toolName: string; args: any; partialResult: any }
  | { type: "tool_execution_end"; toolCallId: string; toolName: string; result: any; isError: boolean }
```

### TypeBox 参数 schema

```typescript
import { Type } from "@sinclair/typebox";
// Type.String(), Type.Number(), Type.Optional(Type.String()), Type.Object({...})
```

---

## 工具工厂模式

所有工具通过 `createXxxTool(env: ExecutionEnv): AgentTool` 工厂函数创建。env 通过闭包注入，工具执行时通过 env API 访问文件系统 / shell。

```typescript
// 典型结构
export function createReadTool(env: ExecutionEnv): AgentTool {
  return {
    name: "read",
    label: "读取文件",
    description: "...",
    parameters: Type.Object({ path: Type.String(), ... }),
    async execute(_toolCallId, params, signal) {
      const result = await env.readTextFile(params.path, signal);
      if (!result.ok) throw result.error;
      return { content: [{ type: "text", text: result.value }], details: {} };
    },
  };
}
```

**测试**：只需 mock `ExecutionEnv` 接口（`cwd` + 文件操作返回 `Result`），不依赖真实文件系统。

---

## M1-1：read — 文件读取

| 属性 | 值 |
|------|-----|
| name | `read` |
| label | `读取文件` |
| 参数 | `path: string`, `offset?: number`, `limit?: number` |
| 功能 | 读取文件内容。自动截断（50KB / 2000 行）。大文件用 offset/limit 分片 |
| 返回 | `{ content: [{ type: "text", text: "..." }] }` |
| 文件 | `tools/read.ts` |
| 测试 | `tests/unit/tools/read.test.ts` |

### 验收条件

- [x] 通过单元测试（mock ExecutionEnv）
- [x] 正常读取文件返回内容
- [x] 文件不存在时抛出错误（AgentTool 约定：执行异常 → 自动标记 isError）
- [x] 大文件自动截断
- [x] offset/limit 分片正确

---

## M1-2：write — 文件写入

| 属性 | 值 |
|------|-----|
| name | `write` |
| label | `写入文件` |
| 参数 | `path: string`, `content: string` |
| 功能 | 创建或覆盖文件，自动创建父目录 |
| 返回 | `{ content: [{ type: "text", text: "文件已写入: <path>" }] }` |
| 文件 | `tools/write.ts` |
| 测试 | `tests/unit/tools/write.test.ts` |

### 验收条件

- [x] 通过单元测试
- [x] 写入新文件成功，内容正确
- [x] 覆盖已有文件成功
- [x] 父目录不存在时自动创建
- [x] 写入失败时抛出错误

---

## M1-3：edit — 文件编辑

| 属性 | 值 |
|------|-----|
| name | `edit` |
| label | `编辑文件` |
| 参数 | `path: string`, `edits: { oldText: string, newText: string }[]` |
| 功能 | 精确文本替换。每个 oldText 必须唯一匹配，否则抛出错误。一次调用支持多个 edits |
| 返回 | `{ content: [{ type: "text", text: "已应用 N 处修改" }] }` |
| 文件 | `tools/edit.ts` |
| 测试 | `tests/unit/tools/edit.test.ts` |

### 验收条件

- [x] 通过单元测试
- [x] 单次替换正确
- [x] 多次替换正确（每个 oldText 唯一匹配）
- [x] oldText 不唯一时抛出错误
- [x] oldText 未找到时抛出错误
- [x] edits 数组空时无操作

---

## M1-4：ls — 列出目录

| 属性 | 值 |
|------|-----|
| name | `ls` |
| label | `列出目录` |
| 参数 | `path?: string` |
| 功能 | 通过 `env.listDir()` 列出目录内容，默认 cwd |
| 返回 | `{ content: [{ type: "text", text: "file1 (12KB)\ndir/\n..." }] }` |
| 文件 | `tools/ls.ts` |
| 测试 | `tests/unit/tools/ls.test.ts` |

### 验收条件

- [x] 通过单元测试（mock `env.listDir` 返回 `FileInfo[]`）
- [x] 列出文件和子目录，区分 file/directory
- [x] 路径不存在时抛出错误（Result.ok === false）
- [x] 空目录返回空列表

---

## M1-5：grep — 文本搜索

| 属性 | 值 |
|------|-----|
| name | `grep` |
| label | `搜索文本` |
| 参数 | `pattern: string`, `path?: string` |
| 功能 | 在指定目录下递归搜索文本匹配（逐文件 readTextLines + 正则），返回文件名和匹配行 |
| 返回 | `{ content: [{ type: "text", text: "path:line_num: matched line\n..." }] }` |
| 文件 | `tools/grep.ts` |
| 测试 | `tests/unit/tools/grep.test.ts` |

### 验收条件

- [ ] 通过单元测试
- [ ] 递归搜索子目录
- [ ] 返回格式 `path:行号: 内容`
- [ ] 无匹配时返回空（不报错）
- [ ] 路径不存在时抛出错误

---

## M1-6：find — 文件名查找

| 属性 | 值 |
|------|-----|
| name | `find` |
| label | `查找文件` |
| 参数 | `pattern: string`, `path?: string` |
| 功能 | 递归 `listDir` 遍历目录树，按文件名 pattern 匹配（简单通配符：`*` 匹配任意字符） |
| 返回 | `{ content: [{ type: "text", text: "/path/to/file\n..." }] }` |
| 文件 | `tools/find.ts` |
| 测试 | `tests/unit/tools/find.test.ts` |

### 验收条件

- [ ] 通过单元测试（mock `env.listDir` 递归）
- [ ] 简单通配符匹配正确（`*.md`、`test*.ts` 等）
- [ ] 递归搜索子目录
- [ ] 无匹配时返回空
- [ ] 路径不存在时抛出错误

---

## M1-7：bash — 命令执行

| 属性 | 值 |
|------|-----|
| name | `bash` |
| label | `执行命令` |
| 参数 | `command: string`, `timeout?: number` |
| 功能 | 通过 env.exec() 执行命令，捕获 stdout/stderr。默认超时 30s，最大 120s |
| 安全 | 默认超时 30s，最大 120s；不支持交互式 |

```typescript
// 返回格式
return {
  content: [{ type: "text", text: execResult.value.stdout }],
  details: { exitCode: execResult.value.exitCode, stderr: execResult.value.stderr },
};
```

| 文件 | `tools/bash.ts` |
| 测试 | `tests/unit/tools/bash.test.ts` |

### 验收条件

- [ ] 通过单元测试（mock ExecutionEnv.exec）
- [ ] 正常执行返回 stdout
- [ ] 超时时抛出错误
- [ ] 命令失败时返回 exitCode + stderr

---

## M1-8：web_search — 网络搜索

| 属性 | 值 |
|------|-----|
| name | `web_search` |
| label | `搜索网络` |
| 参数 | `query: string`, `max_results?: number`（默认 5，最大 10） |
| 功能 | 通过 DuckDuckGo Lite（`lite.duckduckgo.com`）搜索，零依赖，正则解析 HTML |
| 返回 | `{ content: [{ type: "text", text: "1. Title (URL)\n   Snippet\n..." }] }` |
| 文件 | `tools/web-search.ts` |
| 测试 | `tests/unit/tools/web-search.test.ts` |

> web_search / web_fetch 不需要 ExecutionEnv，直接 fetch 网络资源。

### 验收条件

- [ ] 通过单元测试（mock fetch）
- [ ] 返回标题、URL、摘要
- [ ] 网络错误时抛出错误
- [ ] DuckDuckGo 无结果时返回空

---

## M1-9：web_fetch — 网页抓取

| 属性 | 值 |
|------|-----|
| name | `web_fetch` |
| label | `抓取网页` |
| 参数 | `url: string` |
| 功能 | 抓取网页内容，提取纯文本（去除 HTML 标签、script、style） |
| 返回 | `{ content: [{ type: "text", text: "..." }] }` |
| 文件 | `tools/web-fetch.ts` |
| 测试 | `tests/unit/tools/web-fetch.test.ts` |

### 验收条件

- [ ] 通过单元测试（mock fetch）
- [ ] 提取纯文本，不含 HTML 标签
- [ ] HTTP 错误时抛出错误
- [ ] 截断过长内容（50KB）

---

## M1-10：工具注册 + harness 集成

### 变更文件

- **新增** `tools/index.ts` — `createAllTools(env): AgentTool[]`
- **修改** `server/harness.ts` — 调用 `createAllTools(env)` 传入 harness

```typescript
// tools/index.ts
import type { AgentTool, ExecutionEnv } from "@earendil-works/pi-agent-core";
import { createReadTool } from "./read.ts";
// ... 其余导入

export function createAllTools(env: ExecutionEnv): AgentTool[] {
  return [
    createReadTool(env),
    createWriteTool(env),
    createEditTool(env),
    createLsTool(env),
    createGrepTool(env),
    createFindTool(env),
    createBashTool(env),
    createWebSearchTool(),   // 不需要 env
    createWebFetchTool(),    // 不需要 env
  ];
}
```

```typescript
// server/harness.ts 差异
-  const env = new NodeExecutionEnv({ cwd: process.cwd() });
+  const env = new NodeExecutionEnv({ cwd: process.cwd() });
+  const tools = createAllTools(env);
   // ...
-    tools: [],
+    tools,
```

### 验收条件

- [ ] `createAllTools(env)` 返回 9 个 AgentTool
- [ ] harness 构造时 tools 参数正确传入
- [ ] TypeScript 编译通过

---

## M1-11：前端工具调用状态展示

### 变更文件

- **新增** `client/src/components/ToolCall.vue`
- **修改** `client/src/composables/useAgent.ts`
- **修改** `client/src/components/ChatView.vue`
- **修改** `client/src/types.ts`

### types.ts 扩展

```typescript
export interface ToolCallStatus {
  id: string;
  name: string;
  label: string;
  state: "running" | "done" | "error";
  result?: string;
}
```

### useAgent 扩展

```typescript
const toolCalls = ref<ToolCallStatus[]>([]);

// handleEvent 新增:
case "tool_execution_start":
  toolCalls.value = [...toolCalls.value, {
    id: event.toolCallId,
    name: event.toolName,
    label: getToolLabel(event.toolName),
    state: "running",
  }];
  break;

case "tool_execution_end":
  toolCalls.value = toolCalls.value.map(tc =>
    tc.id === event.toolCallId
      ? { ...tc, state: event.isError ? "error" : "done", result: extractResultText(event.result) }
      : tc
  );
  break;
```

### ToolCall.vue

```vue
<template>
  <div class="tool-call" :class="{ error: status.state === 'error' }">
    <div class="tool-header" @click="expanded = !expanded">
      <span class="tool-icon">{{ icon }}</span>
      <span class="tool-label">{{ status.label }}</span>
      <span class="tool-state">{{ stateText }}</span>
    </div>
    <div v-if="expanded && status.result" class="tool-result">
      <pre>{{ status.result }}</pre>
    </div>
  </div>
</template>
```

### ChatView 集成

在消息列表渲染中，工具调用卡片插入在用户消息和 assistant 回复之间。

### 验收条件

- [ ] ToolCall.vue 正确渲染 tool_execution_start 事件
- [ ] running → done/error 状态切换流畅
- [ ] 工具结果可折叠/展开
- [ ] 样式与其他消息协调

---

## M1-12：端到端集成验证

### 验证清单

- [ ] `npm run dev` 启动，浏览器打开
- [ ] 发送「列出当前目录」→ Agent 调用 ls → 显示结果
- [ ] 发送「创建一个文件 test.md 内容 hello」→ Agent 调用 write → 文件创建成功
- [ ] 发送「搜索所有提到 hello 的文件」→ Agent 调用 grep → 显示匹配
- [ ] 发送「搜索 Vue 3 最新文档」→ Agent 调用 web_search → 显示结果
- [ ] 9 个工具都能正常调用和显示
- [ ] Console 无错误
- [ ] bug 记录到 spec/bug/M1-bug.md
