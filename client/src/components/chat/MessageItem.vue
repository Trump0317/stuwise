<script setup lang="ts">
import { ref } from "vue";
import type { ChatMessage } from "./ChatView.vue";

defineProps<{
  message: ChatMessage;
}>();

const expanded = ref(false);

function toggle() {
  expanded.value = !expanded.value;
}
</script>

<template>
  <div class="message" :class="[message.role, message.subtype || 'normal']">
    <!-- 思考中 -->
    <div v-if="message.subtype === 'thinking'" class="thinking-block" :class="{ expanded }" @click="toggle">
      <div class="thinking-header">
        <span class="thinking-icon">💭</span>
        <span class="thinking-label">思考中…</span>
        <span class="expand-toggle">{{ expanded ? '▴' : '▾' }}</span>
      </div>
      <div v-if="expanded" class="thinking-content">{{ message.content }}</div>
    </div>

    <!-- 工具调用 -->
    <div v-else-if="message.subtype === 'tool_call'" class="tool-block" :class="{ expanded }" @click="toggle">
      <div class="tool-header">
        <span class="tool-icon">▸</span>
        <span class="tool-name">{{ message.toolName }}</span>
        <span class="tool-status" :class="message.toolStatus">●</span>
        <span class="expand-toggle">{{ expanded ? '▴' : '▾' }}</span>
      </div>
      <div v-if="expanded" class="tool-content">{{ message.content }}</div>
    </div>

    <!-- 普通消息 -->
    <div v-else class="bubble">
      <div class="content">{{ message.content }}</div>
      <span v-if="message.isStreaming" class="cursor">|</span>
    </div>
  </div>
</template>

<style scoped>
.message {
  width: 70%;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 普通消息 */
.bubble {
  padding: 8px 14px;
  font-size: 14px; line-height: 1.7;
  white-space: pre-wrap; word-break: break-word;
}

.message.user .bubble {
  display: inline-block;
  background: #f0f0f0;
  color: #333;
  border-radius: 12px;
}

.message.assistant .bubble {
  background: transparent;
  color: #333;
}

.cursor {
  animation: blink 1s step-end infinite;
  color: #999;
}
@keyframes blink { 50% { opacity: 0; } }

/* 思考块 */
.thinking-block {
  cursor: pointer;
}

.thinking-block.expanded {
  background: #f9fafb;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 14px;
}

.thinking-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #bbb;
}

.thinking-icon { font-size: 14px; }

.thinking-content {
  margin-top: 8px;
  font-size: 13px; color: #999;
  line-height: 1.6;
  white-space: pre-wrap; word-break: break-word;
}

.expand-toggle {
  margin-left: auto;
  font-size: 10px; color: #ccc;
}

/* 工具调用块 */
.tool-block {
  cursor: pointer;
  font-family: "SF Mono", "Menlo", monospace;
}

.tool-block.expanded {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 14px;
}

.tool-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #555;
}

.tool-icon {
  color: #6b7280; font-weight: bold;
}

.tool-name {
  font-weight: 500;
}

.tool-status {
  font-size: 8px;
}
.tool-status.running { color: #f59e0b; }
.tool-status.done { color: #22c55e; }
.tool-status.error { color: #dc2626; }

.tool-content {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  font-size: 13px; color: #666;
  line-height: 1.6;
  white-space: pre-wrap; word-break: break-word;
}
</style>
