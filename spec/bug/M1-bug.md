# M1 Bug 记录

## B1: ToolCall.vue 不渲染

**状态**: 已修复

**修复**: 去掉 `<style scoped>`，改为所有样式内联。

**现象**: 前端 `toolCalls` 数据正确（Console 确认 tool_execution_start/end 事件到达），但 ToolCall 组件在页面上不可见。

**调试过程**:
1. SSE 事件确认到达 ✅ — Console 显示 `[tool] start/end` 日志
2. 数据确认正确 ✅ — `<pre>{{ JSON.stringify(toolCalls) }}</pre>` 显示完整数据
3. 占位标记可见 ✅ — `TOOL COUNT: N` 和 `END TOOLS` 红色文字可见
4. inline style 可见 ✅ — 黄色背景 + 红色边框的 ToolCall 卡片可见
5. `<style scoped>` 不可见 ❌ — 组件渲染但 CSS 未应用
6. `<style>` 非 scoped + tw- 前缀不可见 ❌ — 同上

**可能原因**: ToolCall.vue 的 `<style>` 在 ChatView 子组件嵌套场景下未被正确注入。Vite + Vue SFC 编译问题或 CSS 加载顺序问题。

---

## B2: web_search 返回错误

**状态**: 已修复

**修复**: 切换为 Bing 引擎（DDG 被墙），添加 User-Agent 头，更新 HTML 解析逻辑。

---

## B3: Session 膨胀导致 agent_end error

**状态**: 已修复

**修复**: 新增 `POST /api/compact` 端点 + prompt 前自动 compact。JSONL 条目超过 80 时自动触发 `harness.compact()`。

---

## B4: EventSource 连接时序问题

**状态**: 已修复

**修复**: 1) 添加 300ms 延迟确保 EventSource 连接建立后再发送 prompt；2) handleEvent 区分 message_start 的 role，仅 assistant 创建消息。

**现象**: `new EventSource("/api/events")` 是异步的，`fetch("/api/prompt")` 立即发出，导致前端可能错过早期的 SSE 事件（包括 tool_execution_start）。

**修复**: 添加 `await new Promise(r => setTimeout(r, 300))` 延迟发送 prompt。

**更好的方案**: 使用 `eventSource.onopen` 回调确保连接就绪后再发送 prompt，但当前 onopen 在某些浏览器/Hono SSE 组合下不可靠。
