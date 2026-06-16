# Stuwise

> 面向学生日常场景的 AI Agent，通过 Web UI 交互，本地运行。

## 快速开始

```bash
# 配置 API Key
cp .env.example .env
# 编辑 .env，填入你的 API Key

# 启动
npm install
npm run dev

# 浏览器打开 http://localhost:5173
```

## 技术栈

| 层 | 技术 |
|----|------|
| AI 协议 | `@earendil-works/pi-ai` |
| Agent 框架 | `@earendil-works/pi-agent-core` (AgentHarness) |
| 后端 | Hono + SSE |
| 前端 | Vue 3 + Vite |

## 开发

```bash
npm test          # 运行测试
npm run dev       # 启动开发环境 (Hono :3000 + Vite :5173)
npx tsx server/index.ts  # 仅启动后端
```

详见 [spec/index.md](spec/index.md)。
