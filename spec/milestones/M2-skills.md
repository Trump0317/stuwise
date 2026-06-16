# M2：Skill 系统 `[ ]`

> 目标：实现 Skill 全链路 — 加载 → System Prompt 注入 → 前端可见 → Agent 使用。

## 任务清单

| # | 任务 | 状态 | 依赖 |
|---|------|------|------|
| M2-1 | Skill 加载器 + harness 集成 | [ ] | — |
| M2-2 | 前端 Skill 列表展示 | [ ] | M2-1 |
| M2-3 | 端到端集成验证 | [ ] | 全部 |

---

## 关键依赖 API

### Skill 接口（@earendil-works/pi-agent-core）

```typescript
export interface Skill {
  name: string;                    // 1-64 字，小写+连字符
  description: string;             // ≤1024 字，决定何时使用此 Skill
  content: string;                 // 完整 Skill 指令（Markdown）
  filePath: string;                // SKILL.md 绝对路径
  disableModelInvocation?: boolean;
}
```

### loadSkills

```typescript
export function loadSkills(
  env: ExecutionEnv,
  dirs: string | string[]
): Promise<{ skills: Skill[]; diagnostics: SkillDiagnostic[] }>;
```

### formatSkillsForSystemPrompt

```typescript
export function formatSkillsForSystemPrompt(skills: Skill[]): string;
```

### SKILL.md 格式

```
skills/
└── note-management/
    └── SKILL.md
```

```markdown
---
name: note-management
description: Manage student notes in data/notes/
---

## 笔记管理

...
```

规范：[AgentSkills.io](https://agentskills.io/specification)

---

## M2-1：Skill 加载器 + harness 集成

### 变更文件

- **修改** `server/harness.ts`
- **新增** `skills/note-management/SKILL.md`（示例 Skill，验证全链路用）

### harness 改动

```typescript
import { loadSkills, formatSkillsForSystemPrompt } from "@earendil-works/pi-agent-core";

const DEFAULT_PROMPT = "你是一个友好的学生助理...";

export async function createHarness(options: CreateHarnessOptions) {
  // ... model, env, session ...

  // 加载 Skills
  const { skills, diagnostics } = await loadSkills(env, "./skills");
  for (const d of diagnostics) {
    console.warn(`[Skill] ${d.message}`);
  }

  // 组装 System Prompt
  const skillBlock = formatSkillsForSystemPrompt(skills);
  const systemPrompt = [options.systemPrompt || DEFAULT_PROMPT, skillBlock]
    .filter(Boolean)
    .join("\n\n");

  return new AgentHarness({
    // ...
    systemPrompt,
    resources: { skills },
  });
}
```

### 示例 Skill

`skills/note-management/SKILL.md`：

```markdown
---
name: note-management
description: Manage student notes in data/notes/ — create, read, edit, search notes
---

## 笔记管理

你管理 `data/notes/` 目录下的学生笔记（Markdown 格式）。

- 创建：`write` 工具写入 `data/notes/<标题>.md`
- 读取：`read` 工具
- 编辑：`edit` 工具精确替换
- 搜索：`grep` 工具在 `data/notes/` 下搜索
- 列出：`ls` 工具列出 `data/notes/` 目录

命名规范：`YYYY-MM-DD-课程名-主题.md`
```

### 验收条件

- [ ] `npm run dev` 启动后 skills/ 被加载，diagnostics 无报错
- [ ] System Prompt 包含 Skill 描述块
- [ ] 空 skills/ 目录不报错

---

## M2-2：前端 Skill 列表展示

### 变更文件

- **新增** `client/src/components/SkillList.vue`
- **修改** `client/src/App.vue`

### SkillList.vue

显示已加载的 Skill 标签列表。

```vue
<template>
  <div class="skill-list" v-if="skills.length > 0">
    <span class="skill-badge" v-for="s in skills" :key="s.name">
      {{ s.name }}
    </span>
  </div>
</template>
```

### 数据来源

通过新增 `/api/skills` 端点，或直接从 harness 初始化时传入。

### 验收条件

- [ ] Skill 标签在页面可见
- [ ] 样式协调

---

## M2-3：端到端验证

### 验证清单

- [ ] `npm run dev` 启动
- [ ] Skill 标签在页面可见
- [ ] 发送「帮我创建一个数学笔记：今天学了微积分」→ Agent 使用 note-management Skill + write 工具
- [ ] Console 无错误
- [ ] bug 记录到 spec/bug/M2-bug.md
