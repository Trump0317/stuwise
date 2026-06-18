# Stuwise

面向学生日常场景的 AI Agent，本地运行，Web UI。

> v1.0 — 基础设施完成，后续聚焦学生场景 Skills。

## 快速开始

```bash
git clone <repo> stuwise
cd stuwise
npm install
cp .env.example .env    # 编辑填入 API Key
npm run dev             # 启动 http://localhost:5173
```

## 功能

- 💬 **对话** — 流式回复，支持 tool call 卡片和思考过程展示
- 📋 **会话管理** — 多会话切换、重命名、置顶、自动压缩
- ⚡ **技能与工具** — 9 个通用工具（读写文件/搜索网络/执行命令），可独立开关
- 📦 **产物面板** — 自动汇总对话生成的文件
- ⚙ **设置** — API Key 热更新、模型切换
- 📊 **上下文进度条** — 底部状态栏显示 Token 用量

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Hono + `@earendil-works/pi-agent-core` |
| 前端 | Vue 3 + Vite |
| 协议 | SSE (Server-Sent Events) |
| 持久化 | JSONL（`data/sessions/`） |
| AI | DeepSeek / Anthropic 等（通过 pi-ai） |

## 脚本

```bash
npm run dev          # 开发环境 (Hono :3000 + Vite :5173)
npm run build        # 前端生产构建
npm run build:dist   # 便携分发包 (dist/stuwise/)
npm start            # 生产启动
npm test             # 运行测试
```

## .exe 打包

Windows + Bun：

```powershell
npm run build:dist
cd dist\stuwise
bun build server.mjs --compile --outfile stuwise.exe
```

## 项目结构

```
client/src/components/
├── bottom/          # 底部状态栏
├── chat/            # 对话面板
├── config/          # 设置弹窗
├── header/          # 顶部栏
├── outputs/         # 产物面板
├── sidebar/         # 侧边栏（会话列表）
└── skills-tools/    # 技能与工具面板

server/
├── harness/         # AgentHarness 封装（state/build/session/skill/config/compact）
├── routes/          # API 路由（21 端点）
└── skills-loader.ts # 跨平台 Skill 加载（绕过 pi-agent-core 路径 bug）

spec/                # 设计规格 + 里程碑 + Bug 记录
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/prompt` | 发送消息 |
| GET | `/api/events` | SSE 事件流 |
| POST | `/api/abort` | 中断 |
| GET/POST/DELETE/PUT | `/api/session[/:id]` | 会话 CRUD |
| PUT | `/api/session/:id/name` | 重命名 |
| PUT | `/api/session/:id/pin` | 置顶 |
| GET/PUT | `/api/skills[/:name]` | 技能管理 |
| GET/PUT | `/api/tools[/:name]` | 工具管理 |
| GET/PUT | `/api/config` | 配置 |
| GET | `/api/health` | 健康检查 |
| GET | `/api/outputs` | 产物列表 |
| POST | `/api/compact` | 压缩上下文 |
| POST | `/api/steer` | 编辑重发 |

## 里程碑

| 版本 | 状态 | 目标 |
|------|------|------|
| M0 | [x] | 工程骨架 + 最小原型 |
| M1 | [x] | 9 个通用工具 |
| M2 | [x] | Skill 系统 + 渐进式注入 |
| M3 | [x] | v1.0 正式版（全量前端 + exe 打包） |
| M4 | [ ] | 学生场景 Skills（课件生成、复习计划、笔记整理...） |
