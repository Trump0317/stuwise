<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import type { TimelineItem } from "../types";
import ToolCall from "./ToolCall.vue";

const props = defineProps<{
  timeline: TimelineItem[];
  isRunning: boolean;
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
    <template v-for="item in timeline" :key="item.id">
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

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
