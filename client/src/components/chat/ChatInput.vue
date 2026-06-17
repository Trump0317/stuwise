<script setup lang="ts">
import { ref } from "vue";

const text = ref("");

function handleSend() {
  if (!text.value.trim()) return;
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
    <textarea
      v-model="text"
      placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
      rows="1"
      class="input-area"
      @keydown="handleKeydown"
    ></textarea>
    <button class="btn-send" @click="handleSend">发送</button>
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

.btn-send {
  padding: 10px 20px;
  border: none; border-radius: 8px;
  background: #4f46e5; color: #fff;
  font-size: 14px; cursor: pointer;
  white-space: nowrap;
}
.btn-send:hover { background: #4338ca; }
</style>
