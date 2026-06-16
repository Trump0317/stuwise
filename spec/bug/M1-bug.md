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

**状态**: 未修复

**现象**: SSE 事件 `tool_execution_end` 中 `isError: true`，DuckDuckGo Lite 返回 403 或 HTML 解析失败。

```
[tool] end web_search error: true
```

**可能原因**: 
- DuckDuckGo Lite 可能需要特定 User-Agent 头
- 网络环境限制（需翻墙）
- HTML 解析正则不匹配实际页面结构

---

## B3: Session 膨胀导致 agent_end error

**状态**: 临时修复（手动清空 sessions）

**现象**: 多次对话后 session JSONL 过大，超出模型 context window (1.4M tokens)，导致 `stopReason: "error"`。

**临时方案**: 每次重启前 `rm -rf data/sessions/*`

**长期方案**: M2+ 实现 context compaction

---

## B4: EventSource 连接时序问题

**状态**: 已修复

**修复**: 1) 添加 300ms 延迟确保 EventSource 连接建立后再发送 prompt；2) handleEvent 区分 message_start 的 role，仅 assistant 创建消息。

**现象**: `new EventSource("/api/events")` 是异步的，`fetch("/api/prompt")` 立即发出，导致前端可能错过早期的 SSE 事件（包括 tool_execution_start）。

**修复**: 添加 `await new Promise(r => setTimeout(r, 300))` 延迟发送 prompt。

**更好的方案**: 使用 `eventSource.onopen` 回调确保连接就绪后再发送 prompt，但当前 onopen 在某些浏览器/Hono SSE 组合下不可靠。
