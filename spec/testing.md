# 测试策略

## 测试分层

```
        /\
       /E2E\         <- 少量：启动完整服务，浏览器自动化验证
      /------\
     /Integration\   <- 中量：Hono 路由 + AgentHarness mock
    /------------\
   /  Unit Tests  \  <- 大量：工具函数、工具逻辑、composable
  /________________\
```

## 各层策略

| 层级 | 范围 | Mock 策略 | 目标 |
|------|------|----------|------|
| 单元测试 | 单个工具函数、composable 逻辑 | mock 所有外部依赖（文件系统、fetch） | 确保每个工具行为正确 |
| 集成测试 | Hono 路由 + harness mock | mock AgentHarness（返回预设事件序列） | 确保 SSE 推流和路由正确 |
| E2E 测试 | 启动 server + 浏览器 | 真实 LLM（可选 mock server） | 确保端到端流程 |

## 前端测试

前端 UI 组件不写自动化测试，采用开发服务器 + 浏览器手动验证流程：

1. `npm run dev` 启动开发服务器
2. 开发者在浏览器中查看
3. 反馈修改意见
4. 修改实现
5. 刷新浏览器 → 回到步骤 2

## 测试目录结构

```
tests/
├── conftest.ts          ← 全局 fixtures、mock 工厂
├── unit/
│   ├── tools/
│   │   ├── note-read.test.ts
│   │   ├── note-write.test.ts
│   │   ├── web-search.test.ts
│   │   └── web-fetch.test.ts
│   └── composables/
│       └── useAgent.test.ts
├── integration/
│   ├── routes/
│   │   ├── prompt.test.ts
│   │   └── events.test.ts
│   └── harness.test.ts
├── e2e/
│   └── full-flow.test.ts
└── manual/              ← 手动测试记录
```

## 测试运行器

- **Vitest** — 与 Vite 工具链一致，原生支持 TypeScript
- 前端 composable 用 `@vue/test-utils` + `jsdom`

## Mock 策略

```typescript
// 工具测试 mock 文件系统和 fetch
vi.mock("node:fs/promises");
vi.mock("node:fs");

// harness 集成测试 mock AgentHarness
const mockHarness = {
  prompt: vi.fn(),
  subscribe: vi.fn(),
  abort: vi.fn(),
};

// LLM 相关测试 mock 整个 AgentHarness（不需要调真实 API）
```
