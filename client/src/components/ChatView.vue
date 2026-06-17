<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import type { TimelineItem } from "../types";
import ToolCall from "./ToolCall.vue";

const props = defineProps<{
  timeline: TimelineItem[];
  isRunning: boolean;
}>();

const emit = defineEmits<{
  steer: [id: string, text: string];
}>();

const listRef = ref<HTMLElement>();

watch(
  () => props.timeline.length,
  async () => {
    await nextTick();
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight;
    }
  }
);
</script>

<template>
  <div ref="listRef" class="chat-view">
    <div v-if="timeline.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>
      <h2>开始对话</h2>
      <p>输入消息，AI 助手将帮助你处理学习任务。</p>
      <p class="empty-hint">支持：搜索资料、创建笔记、管理文件、执行命令</p>
    </div>
    <template v-else v-for="item in timeline" :key="item.id">
      <div
        v-if="item.kind === 'message' && item.message"
        class="message"
        :class="item.message.role"
      >
        <div class="avatar">{{ item.message.role === "user" ? "我" : "AI" }}</div>
        <div class="bubble">
          <div class="content">{{ item.message.content }}</div>
          <span v-if="item.message.isStreaming" class="cursor">|</span>
        </div>
        <button
          v-if="item.message.role === 'user' && !isRunning"
          class="btn-edit"
          title="编辑重生成"
          @click="emit('steer', item.message.id, item.message.content)"
        >✎</button>
      </div>
      <ToolCall
        v-else-if="item.kind === 'tool' && item.tool"
        :status="item.tool"
      />
    </template>
  </div>
</template>

<style scoped>
.chat-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  text-align: center;
  padding: 40px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h2 {
  font-size: 18px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
}

.empty-state p {
  font-size: 13px;
  max-width: 280px;
  line-height: 1.6;
}

.empty-hint {
  margin-top: 12px;
  color: #d1d5db;
  font-size: 12px !important;
}

.message {
  display: flex;
  gap: 10px;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.assistant {
  align-self: flex-start;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.message.user .avatar {
  background: #4f46e5;
  color: #fff;
}

.message.assistant .avatar {
  background: #e5e7eb;
  color: #374151;
}

.bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message.user .bubble {
  background: #4f46e5;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message.assistant .bubble {
  background: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}

.cursor {
  animation: blink 1s step-end infinite;
  color: #4f46e5;
  font-weight: bold;
}

.btn-edit {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 13px;
  padding: 2px 4px;
  opacity: 0;
  transition: opacity 0.15s;
  align-self: center;
}
.message:hover .btn-edit {
  opacity: 1;
}
.btn-edit:hover {
  color: #4f46e5;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
