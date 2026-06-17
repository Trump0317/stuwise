# M3 前后端对接规格

> 每个功能从 API → composable → 组件的完整实现链路

---

## 1. 对话发送与展示（ChatPanel）

### 1.1 数据流

```
用户输入 → ChatInput.vue (emit "send")
  → useAgent.send(text)
    → POST /api/prompt { text }     ← 后端: promptRoute
    → GET  /api/events (SSE)        ← 后端: eventsRoute
      → SSE 事件流 → handleEvent()  → timeline ref
        → ChatView.vue → MessageItem.vue 渲染
```

### 1.2 SSE 事件 → 前端消息映射

| SSE 事件 | ChatMessage 字段 | 渲染类型 |
|----------|-----------------|---------|
| `message_start` (role:assistant) | `{ id, role, content:"", isStreaming:true }` | `subtype: "normal"` |
| `message_delta` (text_delta) | `content += delta` | 追加文字 |
| `message_end` | `isStreaming = false` | 去掉光标 |
| `tool_execution_start` | `{ id, role, subtype:"tool_call", toolName, toolStatus:"running" }` | `subtype: "tool_call"` |
| `tool_execution_end` | `toolStatus = isError ? "error" : "done"` | 更新状态 |
| `agent_start` | `isRunning = true` | — |
| `agent_end` | `isRunning = false` | 关闭 SSE |

### 1.3 后端已有，前端需做

| 步骤 | 文件 |
|------|------|
| 恢复 `useAgent.send()` 中 SSE 事件处理 | `useAgent.ts` |
| ChatInput 连接 send() | `ChatInput.vue` → emit |
| ChatPanel 连接 messages 数据 | `ChatPanel.vue` props |
| MessageItem 处理 tool_status/done/error 样式 | `MessageItem.vue` |

---

## 2. 会话管理（Sidebar）

### 2.1 列表 + 切换 + 新建 + 删除

```
Sidebar.vue (管理 selectedId)
  onMounted → GET /api/session
    → sessions[] → PinnedSection / SessionSection
  click SessionItem → emit("select", id)
    → PUT /api/session/:id      ← 切换 harness
    → GET /api/session/:id      ← 加载消息
    → timeline.value = toTimeline(messages)
  click "新建会话" → POST /api/session
    → 刷新列表 + 切换到新会话
  click 删除 → DELETE /api/session/:id
    → 刷新列表
```

### 2.2 重命名

```
SessionItem right-click → "重命名"
  → 弹出 input → 确认后
  → PUT /api/session/:id/name { name: "..." }   ← 需新增
  → 更新 sessions[] 中对应 session.name
```

### 2.3 置顶

```
SessionItem right-click → "置顶"
  → PUT /api/session/:id/pin { pinned: true }   ← 需新增
  → 更新 sessions[] 中对应 session.pinned
  → pinned sessions 移到 PinnedSection
```

### 2.4 后端已有 vs 需新增

| 功能 | API | 状态 |
|------|-----|------|
| 列表 | GET /api/session | ✅ |
| 历史 | GET /api/session/:id | ✅ |
| 新建 | POST /api/session | ✅ |
| 删除 | DELETE /api/session/:id | ✅ |
| 切换 | PUT /api/session/:id | ✅ |
| 重命名 | PUT /api/session/:id/name | ❌ M3-10 |
| 置顶 | PUT /api/session/:id/pin | ❌ M3-10 |

### 2.5 session_info 持久化

重命名和置顶通过 `session_info` entry 存在 JSONL 中：

```typescript
// server/harness/session.ts
async function renameSession(id: string, name: string) {
  const s = await repo.open(meta);
  // appendEntry({ type: "session_info", name })
}

async function pinSession(id: string, pinned: boolean) {
  const s = await repo.open(meta);
  // appendEntry({ type: "session_info", name: currentName, pinned })
}
```

读取时，`GET /api/session` 需要从 JSONL 中提取最新的 `session_info` entry 来获取 `name` 和 `pinned` 字段。

---

## 3. 技能与工具（SkillsPanel）

### 3.1 数据流

```
SkillsPanel.vue (onMounted)
  → GET /api/skills
    → { data: { skills: [{name, description, enabled}] } }
      → SkillTab: 只显示 type==="skill" 的
      → ToolTab: 只显示 type==="tool" 的
      或: 区分字段 skillType: "skill" | "tool"
```

### 3.2 开关

```
click SkillItem toggle
  → PUT /api/skills/:name
    → { data: { name, enabled } }
  → 更新本地 skills[]
```

### 3.3 后端需扩展

当前 `/api/skills` 返回所有加载的 Skill（如 note-management）。需要：
- 区分 skill vs tool（当前用 category 字段或硬编码）
- 工具列表来源：`tools/index.ts` 导出的 9 个工具名

**方案**：`GET /api/skills` 返回时补充 `type: "skill" | "tool"` 字段，工具从 `tools/index.ts` 读取。

```typescript
// 返回格式
{
  skills: [
    { name: "note-management", type: "skill", description: "...", enabled: true },
  ],
  tools: [
    { name: "read", type: "tool", label: "读取文件", enabled: true },
    { name: "write", type: "tool", label: "写入文件", enabled: true },
    // ...
  ]
}
```

---

## 4. 产物（OutputsPanel）

### 4.1 数据流

```
OutputsPanel.vue (onMounted / onSwitch)
  → GET /api/outputs?type=all   ← 需新增 M3-10
    → { data: { outputs: [{name, path, type, time, size}] } }
  → AllTab: 全部显示
  → ImageTab: 过滤 type==="image"
  → FileTab: 过滤 type==="file"
  → LinkTab: 过滤 type==="link"
```

### 4.2 后端实现

```typescript
// server/harness/outputs.ts
async function listOutputs(type: string) {
  // 递归扫描 data/ 目录（排除 .gitkeep）
  // 根据扩展名分类: .md/.txt → file, .png/.jpg → image
  // 链接从 JSONL tool_execution web_fetch 记录提取
  return outputs;
}
```

### 4.3 文件类型映射

| 扩展名 | type |
|--------|------|
| .md, .txt, .json, .js, .ts, .py, .css, .html | file |
| .png, .jpg, .jpeg, .gif, .webp, .svg | image |
| 链接（JSONL 中 web_fetch 结果） | link |

---

## 5. 配置（ConfigPanel 弹窗）

### 5.1 数据流

```
click ⚙ → showConfig = true → ConfigPanel.vue 显示
  onMounted → GET /api/config
    → { data: { provider, modelId, hasApiKey } }
  编辑 → 保存 → PUT /api/config { apiKey, modelId }
    → { data: { provider, modelId, hasApiKey } }
```

### 5.2 后端状态

- ✅ GET/PUT /api/config 已实现
- API Key 热更新（下一个请求生效）
- 模型热切换（harness.setModel()）

---

## 6. 健康状态（ChatInput token 显示）

### 6.1 数据流

```
ChatInput.vue onMounted
  → GET /api/health
    → { data: { tokens, compactNeeded } }
  → setInterval(fetch, 15s)
  → 显示 "~{tokens} tokens"
```

### 6.2 后端状态

- ✅ GET /api/health 已实现
- ✅ Token 估算（读 JSONL 文本长度 / 2.5）

---

## 7. 前端 composable 架构（恢复后）

### 7.1 文件结构

```
composables/
  useAgent.ts         ← 入口
  useSession.ts       ← sessions/currentSessionId/loadSession/...
  useSkills.ts        ← skills/fetchSkills/toggleSkill
  constants.ts        ← TOOL_LABELS
```

### 7.2 useAgent 公共接口

```typescript
function useAgent() {
  return {
    // 状态
    timeline, sessions, currentSessionId, skills,
    isRunning, error, lastSentText,

    // 对话
    send(text), abort(), steer(text),

    // 会话管理
    createSession(), deleteSession(id), switchSession(id),

    // 技能
    toggleSkill(name),

    // 初始化
    init(),
  };
}
```

---

## 8. 实施顺序

| 步骤 | 内容 | 依赖 |
|------|------|------|
| 1 | M3-10：后端 rename/pin/outputs 端点 | — |
| 2 | 恢复 useAgent（移除静态数据，接入 API） | 1 |
| 3 | ChatPanel 连接 send() + SSE | 2 |
| 4 | Sidebar 连接 sessions API | 2 |
| 5 | SkillsPanel 连接 skills API | 2 |
| 6 | OutputsPanel 连接 outputs API | 1, 2 |
| 7 | ConfigPanel 连接 config API | 2 |
| 8 | ChatInput 连接 health API | 2 |
| 9 | M3-9：端到端验证 | 全部 |
