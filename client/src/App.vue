<script setup lang="ts">
import { onMounted, ref } from "vue";
import ChatView from "./components/ChatView.vue";
import ChatInput from "./components/ChatInput.vue";
import SkillList from "./components/SkillList.vue";
import SessionList from "./components/SessionList.vue";
import ConfigPanel from "./components/ConfigPanel.vue";
import { useAgent } from "./composables/useAgent";

const {
  timeline, sessions, currentSessionId, skills,
  isRunning, error, lastSentText,
  init, send, abort, clearError,
  createSession, deleteSession, switchSession,
  steer, toggleSkill,
} = useAgent();

const showSkills = ref(false);

onMounted(() => { init(); });

function handleSend(text: string) {
  send(text);
}

function handleAbort() {
  abort();
}
</script>

<template>
  <div class="app-container">
    <!-- Header 暂时屏蔽 -->
    <!-- SkillList 暂时屏蔽 -->
    <div class="app-body">
      <SessionList
        :sessions="sessions"
        :current-id="currentSessionId"
        @select="switchSession"
        @create="createSession"
        @delete="deleteSession"
        @show-skills="showSkills = !showSkills"
        @show-tools="() => {}"
      />
      <div class="app-chat">
        <SkillList v-if="showSkills" :skills="skills" @toggle="toggleSkill" />
        <div v-if="error" class="error-banner">
          <span>{{ error }}</span>
          <div class="error-actions">
            <button class="error-retry" @click="send(lastSentText)" v-if="lastSentText">重试</button>
            <button class="error-close" @click="clearError">×</button>
          </div>
        </div>
        <main class="app-main">
          <ChatView
            :timeline="timeline"
            :is-running="isRunning"
            @steer="(id, text) => steer(text)"
          />
        </main>
        <footer class="app-footer">
          <ChatInput
            :is-running="isRunning"
            @send="handleSend"
            @abort="handleAbort"
          />
        </footer>
      </div>
    </div>
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
  background: #fff;
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

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
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

.error-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.error-retry {
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}
</style>
