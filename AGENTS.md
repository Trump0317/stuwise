# Stuwise

> 面向学生日常场景的 AI Agent，Web UI，本地运行

## 开发入口

读 [spec/index.md](spec/index.md)，完整规格在其中。

## 技术栈

- 后端：Hono + `@earendil-works/pi-agent-core` (AgentHarness)
- 前端：Vue 3 + Vite
- 协议：SSE (Server-Sent Events)
- AI 层：`@earendil-works/pi-ai`

## 关键规则

- **分支**：master(稳定) ← dev(集成) ← Mx(里程碑) | docs/xxx | fix/xxx
- **开发方法**：TDD，详见 [spec/workflow.md](spec/workflow.md)
- **里程碑状态**：`[ ]` → `[~]` → `[x]`
- **语言**：中文回复，代码标识符英文
- **前端 UI**：不写自动化测试，启动 dev server 浏览器验证
- **后端**：先写测试再写实现
- **每个 commit 对应一个任务**

## 运行命令

```bash
npm run dev        # 启动开发环境 (Hono :3000 + Vite :5173)
npm test           # 运行测试 (vitest)
npx tsx server/index.ts  # 仅启动后端
```
