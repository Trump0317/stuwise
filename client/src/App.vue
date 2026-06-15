<script setup lang="ts">
import { ref } from "vue";
import ChatView from "./components/ChatView.vue";
import ChatInput from "./components/ChatInput.vue";
import type { ChatMessage } from "./types";
import { nextId } from "./types";

// M0-4 mock 数据
const messages = ref<ChatMessage[]>([
  { id: nextId(), role: "assistant", content: "你好！我是 Stuwise，你的学生助理。有什么可以帮你的？", timestamp: Date.now() - 60000 },
  { id: nextId(), role: "user", content: "今天有什么学习建议？", timestamp: Date.now() - 30000 },
  { id: nextId(), role: "assistant", content: "建议你今天复习一下本周的课程笔记，然后做一套练习题巩固知识。需要我帮你整理笔记吗？", timestamp: Date.now() },
]);

// M0-5 改为 useAgent().isRunning
const isRunning = ref(false);

function handleSend(text: string) {
  // M0-5 对接 useAgent().send()
  console.log("发送:", text);
}

function handleAbort() {
  // M0-5 对接 useAgent().abort()
  console.log("中止");
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Stuwise</h1>
      <span class="subtitle">学生助理</span>
    </header>
    <main class="app-main">
      <ChatView :messages="messages" :is-running="isRunning" />
    </main>
    <footer class="app-footer">
      <ChatInput
        :is-running="isRunning"
        @send="handleSend"
        @abort="handleAbort"
      />
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

.app-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.app-header h1 {
  font-size: 20px;
  font-weight: 600;
}

.subtitle {
  font-size: 14px;
  color: #999;
}

.app-main {
  flex: 1;
  overflow: hidden;
}

.app-footer {
  border-top: 1px solid #eee;
}
</style>
