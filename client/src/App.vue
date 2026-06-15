<script setup lang="ts">
import ChatView from "./components/ChatView.vue";
import ChatInput from "./components/ChatInput.vue";
import { useAgent } from "./composables/useAgent";

const { messages, isRunning, error, send, abort, clearError } = useAgent();

function handleSend(text: string) {
  send(text);
}

function handleAbort() {
  abort();
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Stuwise</h1>
      <span class="subtitle">学生助理</span>
    </header>
    <div v-if="error" class="error-banner">
      <span>{{ error }}</span>
      <button class="error-close" @click="clearError">×</button>
    </div>
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

.error-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  border-bottom: 1px solid #fecaca;
}

.error-close {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
</style>
