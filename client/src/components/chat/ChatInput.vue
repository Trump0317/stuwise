<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  isRunning: boolean;
}>();

const emit = defineEmits<{
  send: [text: string];
  abort: [];
}>();

const text = ref("");

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
</script>

<template>
  <div class="chat-input">
    <button
      class="btn-upload"
      :disabled="isRunning || uploading"
      title="上传模板 (.docx / .md)"
      @click="triggerUpload"
    >
      {{ uploading ? '⏳' : '📎' }}
    </button>
    <input
      ref="fileInput"
      type="file"
      accept=".docx,.md"
      class="file-hidden"
      @change="handleFile"
    />
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
</template>

<style scoped>
.chat-input {
  display: flex; gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
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

.file-hidden { display: none; }

.btn-upload {
  padding: 10px 12px;
  border: 1px solid #e5e7eb; border-radius: 8px;
  background: #fff; cursor: pointer;
  font-size: 16px;
}
.btn-upload:hover { background: #f5f5f5; }
.btn-upload:disabled { opacity: 0.5; cursor: default; }
</style>
