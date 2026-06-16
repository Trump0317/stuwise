# 开发工作流

## 分支策略

| 前缀 | 用途 | 示例 |
|------|------|------|
| `master` | 里程碑稳定分支（每个 M 完成后合入） | `master` |
| `dev` | 开发集成分支 | `dev` |
| `M0, M1, M2...` | 里程碑阶段分支（从 dev 拉出） | `M0` |
| `fix/` | Bug 修复分支（从 dev 拉出） | `fix/note-save-error` |

**关系**：
```
master ← dev ← Mx
              ← fix/xxx
              ← docs/xxx
```

**流程**：
1. **设计阶段**在 dev 分支进行 → spec 变更审核通过后 commit 到 dev
2. 从 dev 拉 `Mx` 分支 → 进入开发阶段和验收阶段
3. 完成后合并 `Mx → dev`
4. Mx 稳定后合并 `dev → master`

## 里程碑开发流程

每个里程碑按顺序经历三个阶段：**设计 → 开发 → 验收**。里程碑串行推进，不可并行。

### 阶段一：设计

目标：确定里程碑要做什么，spec 通过审核。

```
Step 1  在 spec/milestones/ 下创建（或修改） Mx-xxx.md
        填写目标 + 任务清单 + 每个任务的详细说明
Step 2  更新 spec/milestones.md 加入新里程碑（或修改已有）
Step 3  如涉及架构变更，同步更新 spec/architecture.md
Step 4  阅读本里程碑涉及的依赖库 API（源码或文档），
        确保 spec 中的接口调用、类型、构造方式与实际一致
Step 5  展示所有 spec 变更给开发者
Step 6  开发者审核 → 提出修改意见 → 修改 → 再审核
Step 7  开发者确认通过 → commit spec 变更
```

**审核要点**：
- 任务拆分是否合理（每个任务 1-3 个文件，验收条件明确）
- 架构变更是否必要、是否影响已有里程碑
- 依赖是否清晰（任务之间的前后关系）
- 依赖库 API 调用是否正确（Step 4 的输出）

### 阶段二：开发

目标：按 spec 实现所有任务。

```
Step 1  更新任务状态 [ ] → [~]
Step 2  阅读本任务涉及的依赖库源码/类型定义，确认 API 用法
Step 3  编写代码（后端先写测试，前端直接写组件）
Step 4  用 reviewer 审核变更
Step 5  开发者审核变更（业务逻辑是否符合 spec）
Step 6  开发者确认 → 验证通过（后端跑测试，前端浏览器看效果）
Step 7  对照 spec 逐条检查本任务验收条件
Step 8  更新任务状态 [~] → [x]，git add + commit
```

**关键原则**：
- **依赖库先行**：写代码前必须读依赖库源码，确认 API 签名、构造方式、返回值类型
- **测试先写**（仅后端）：先定义「正确行为是什么」，再实现
- **双审制**：变更由 reviewer（代码正确性）+ 开发者（业务逻辑）各审一次
- **立验立结**：每个任务完成后立刻验收，不允许积压到里程碑末尾
- **最终放行权**：始终在开发者手上
- **每个 commit 对应一个任务**

### 阶段三：验收

目标：确认里程碑目标达成，更新相关 spec。

```
Step 1  对照里程碑文件逐条检查验收条件
Step 2  开发者手动验证（启动服务 + 浏览器测试）
Step 3  检查 spec/overview.md 是否需要更新
        （如新增了核心能力等）
Step 4  检查 spec/architecture.md 是否需要更新
        （如目录结构变化、新增模块等）
Step 5  端到端测试中发现的 bug 记录到 spec/bug/Mx-bug.md
Step 6  全部通过 → 更新里程碑状态为 [x]
Step 7  合并 Mx → dev
```

**验收通过标准**：
- 所有任务 [x] 且 commit 已提交
- 里程碑目标全部实现
- 开发者手动验证通过
- overview.md / architecture.md 与当前实现一致
- 已知 bug 已记录

## 任务状态标记

| 标记 | 含义 |
|------|------|
| `[ ]` | 未开始 |
| `[~]` | 进行中 |
| `[x]` | 已完成 |

## 提交规范

> 本项目的提交规范遵循 [Conventional Commits v1.0.0](https://www.conventionalcommits.org/zh-hans/v1.0.0/)，详见 [spec/commit.md](commit.md)。

### 示例

```bash
git commit -m "init: 初始化项目仓库，添加 spec 和目录结构"
git commit -m "feat(note): 添加笔记 CRUD 工具"
git commit -m "test(note): 为笔记工具添加单元测试"
git commit -m "fix: 修复笔记保存时空指针错误"
git commit -m "docs: 更新 API 文档"
```

### 提交时机

- **每个任务完成后**（避免多个任务混在一个 commit 中）
- **commit 前必须经过开发者审核**，确认变更内容无误后方可提交
- commit 前确认所有测试通过
- 前端任务提交前需在浏览器中手动验证通过

## 运行测试

```bash
# 全部测试
npx vitest run

# 单个文件
npx vitest run tests/unit/tools/note-read.test.ts

# watch 模式
npx vitest

# 开发服务器（前端验证）
npx tsx server/index.ts
```
