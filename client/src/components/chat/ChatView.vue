<script setup lang="ts">
import MessageItem from "./MessageItem.vue";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  subtype?: "normal" | "thinking" | "tool_call";
  toolName?: string;
  toolStatus?: "running" | "done" | "error";
}

defineProps<{
  messages: ChatMessage[];
}>();
</script>

<template>
  <div class="chat-view">
    <div v-if="messages.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>
      <h2>开始对话</h2>
      <p>向 AI 助手提问，获取学习帮助</p>
    </div>
    <MessageItem
      v-for="msg in messages"
      :key="msg.id"
      :message="msg"
    />
  </div>
</template>

<style scoped>
.chat-view {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex; flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-state {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: #9ca3af; text-align: center;
}

.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-state h2 { font-size: 18px; color: #6b7280; font-weight: 500; margin-bottom: 6px; }
.empty-state p { font-size: 13px; max-width: 260px; line-height: 1.6; }
</style>
