<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

defineProps<{
  isRunning: boolean;
}>();

const emit = defineEmits<{
  send: [text: string];
  abort: [];
}>();

const text = ref("");
const tokens = ref(0);
const compactNeeded = ref(false);
const maxTokens = 128000;
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  fetchHealth();
  timer = setInterval(fetchHealth, 15000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

async function fetchHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    if (data.ok) {
      tokens.value = data.data.tokens || 0;
      compactNeeded.value = data.data.compactNeeded || false;
    }
  } catch { /* ignore */ }
}

function handleSend() {
  const v = text.value.trim();
  if (!v) return;
  emit("send", v);
  text.value = "";
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

const barPercent = computed(() => Math.min((tokens.value / maxTokens) * 100, 100));
const barColor = computed(() => {
  if (barPercent.value > 80) return "#dc2626";
  if (barPercent.value > 50) return "#f59e0b";
  return "#4f46e5";
});
</script>

<template>
  <div class="chat-input-wrapper">
    <div class="token-bar">
      <div class="token-progress">
        <div
          class="token-fill"
          :style="{ width: barPercent + '%', background: barColor }"
        ></div>
      </div>
      <span class="token-text" :class="{ warn: compactNeeded }">
        {{ tokens.toLocaleString() }} / {{ (maxTokens / 1000).toFixed(0) }}K tokens
        <template v-if="compactNeeded"> · 建议压缩</template>
      </span>
    </div>
    <div class="chat-input">
      <textarea
        v-model="text"
        placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
        rows="1"
        class="input-area"
        :disabled="isRunning"
        @keydown="handleKeydown"
      ></textarea>
      <button v-if="isRunning" class="btn-abort" @click="emit('abort')">中断</button>
      <button v-else class="btn-send" @click="handleSend">发送</button>
    </div>
  </div>
</template>

<style scoped>
.chat-input-wrapper {
  border-top: 1px solid #e5e7eb;
}

.token-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 16px 2px;
}

.token-progress {
  flex: 1; height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.token-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s, background 0.5s;
}

.token-text {
  font-size: 11px; color: #bbb;
  white-space: nowrap;
  flex-shrink: 0;
}
.token-text.warn { color: #f59e0b; }

.chat-input {
  display: flex; gap: 8px;
  padding: 4px 16px 12px;
  align-items: flex-end;
}

.input-area {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px; font-family: inherit;
  line-height: 1.5; resize: none;
  outline: none; max-height: 120px;
  background: #fff; color: #333;
}
.input-area:focus { border-color: #4f46e5; }
.input-area::placeholder { color: #ccc; }
.input-area:disabled { background: #fafafa; }

.btn-send {
  padding: 10px 20px;
  border: none; border-radius: 8px;
  background: #4f46e5; color: #fff;
  font-size: 14px; cursor: pointer;
  white-space: nowrap;
}
.btn-send:hover { background: #4338ca; }

.btn-abort {
  padding: 10px 16px;
  border: 1px solid #dc2626; border-radius: 8px;
  background: #fff; color: #dc2626;
  font-size: 13px; cursor: pointer;
  white-space: nowrap;
}
.btn-abort:hover { background: #fef2f2; }
</style>
