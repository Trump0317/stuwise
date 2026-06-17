<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
  isRunning: boolean;
}>();

const emit = defineEmits<{
  send: [text: string];
  abort: [];
}>();

const text = ref("");
const tokenCount = ref(0);

async function fetchTokens() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    tokenCount.value = data.tokens || 0;
  } catch { /* ignore */ }
}

onMounted(() => {
  fetchTokens();
  const timer = setInterval(fetchTokens, 15000);
  return () => clearInterval(timer);
});

function handleSend() {
  const trimmed = text.value.trim();
  if (!trimmed || props.isRunning) return;
  emit("send", trimmed);
  text.value = "";
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

watch(
  () => props.isRunning,
  (running) => {
    if (!running) {
      text.value = "";
    }
  }
);
</script>

<template>
  <div class="chat-input">
    <textarea
      v-model="text"
      :disabled="isRunning"
      placeholder="输入消息..."
      rows="1"
      class="input-area"
      @keydown="handleKeydown"
    ></textarea>
    <button
      v-if="!isRunning"
      class="btn-send"
      :disabled="!text.trim()"
      @click="handleSend"
    >
      发送
    </button>
    <button
      v-else
      class="btn-stop"
      @click="emit('abort')"
    >
      停止
    </button>
    <span class="token-info" v-if="tokenCount > 0">~{{ tokenCount }} tokens</span>
  </div>
</template>

<style scoped>
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  align-items: flex-end;
}

.input-area {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  max-height: 120px;
}

.input-area:focus {
  border-color: #4f46e5;
}

.input-area:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.btn-send,
.btn-stop {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-send {
  background: #4f46e5;
  color: #fff;
}

.btn-send:hover:not(:disabled) {
  background: #4338ca;
}

.btn-send:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.btn-stop {
  background: #ef4444;
  color: #fff;
}

.btn-stop:hover {
  background: #dc2626;
}

.token-info {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
  align-self: center;
}
</style>
