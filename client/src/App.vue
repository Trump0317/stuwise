<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import Header from "./components/header/Header.vue";
import Sidebar from "./components/sidebar/Sidebar.vue";
import ChatPanel from "./components/chat/ChatPanel.vue";
import SkillsPanel from "./components/skills-tools/SkillsPanel.vue";
import OutputsPanel from "./components/outputs/OutputsPanel.vue";
import ConfigPanel from "./components/ConfigPanel.vue";
import StatusBar from "./components/bottom/StatusBar.vue";
import { useAgent } from "./composables/useAgent";
import { useSession } from "./composables/useSession";
import { useSkills } from "./composables/useSkills";
import { useTools } from "./composables/useTools";

const { messages, isRunning, error, send, abort, steer } = useAgent();
const { sessions, currentSessionId, fetchSessions, loadSession, createSession, deleteSession, switchSession } = useSession();
const { skills, fetchSkills, toggleSkill } = useSkills();
const { tools, fetchTools, toggleTool } = useTools();

const leftOpen = ref(true);
const rightOpen = ref(false);
const showConfig = ref(false);
const activePanel = ref<"chat" | "skills" | "outputs">("chat");
const pendingNewChat = ref(false);

const headerTitle = computed(() => {
  const s = sessions.value.find(x => x.id === currentSessionId.value);
  return s?.name || "Stuwise";
});

const pinnedSessions = computed(() => sessions.value.filter(s => s.pinned));
const unpinnedSessions = computed(() => sessions.value.filter(s => !s.pinned));

onMounted(async () => {
  await fetchSessions();
  await fetchSkills();
  await fetchTools();
  if (sessions.value.length > 0) {
    const msgs = await switchSession(sessions.value[0]!.id);
    if (msgs) messages.value = msgs;
  }
});

// 发送消息：如果是新会话先创建
async function handleSend(text: string) {
  if (pendingNewChat.value) {
    const id = await createSession();
    if (id) {
      pendingNewChat.value = false;
      await switchSession(id);
      await fetchSessions();
    } else {
      error.value = "创建会话失败";
      return;
    }
  }
  send(text);
}

async function handleSelect(id: string) {
  pendingNewChat.value = false;
  const msgs = await switchSession(id);
  if (msgs) messages.value = msgs;
  activePanel.value = "chat";
}

async function handleNewChat() {
  messages.value = [];
  pendingNewChat.value = true;
  activePanel.value = "chat";
}

async function handleDelete(id: string) {
  await deleteSession(id);
  await fetchSessions();
  const first = sessions.value[0];
  if (first) {
    const msgs = await switchSession(first.id);
    if (msgs) messages.value = msgs;
  } else {
    messages.value = [];
    pendingNewChat.value = true;
  }
}

async function handleRename(id: string, name: string) {
  sessions.value = sessions.value.map(s =>
    s.id === id ? { ...s, name } : s
  );
  try {
    await fetch(`/api/session/${id}/name`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  } catch { await fetchSessions(); }
}

async function handlePin(id: string, pinned: boolean) {
  // 乐观更新 — 替换整个数组确保 Vue 响应式
  sessions.value = sessions.value.map(s =>
    s.id === id ? { ...s, pinned } : s
  );
  try {
    await fetch(`/api/session/${id}/pin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    });
  } catch { /* API 失败，重新拉取 */
    await fetchSessions();
  }
}
</script>

<template>
  <div class="app-container">
    <Header
      :left-open="leftOpen"
      :right-open="rightOpen"
      :title="headerTitle"
      @toggle-left="leftOpen = !leftOpen"
      @toggle-right="rightOpen = !rightOpen"
      @settings="showConfig = true"
    />
    <div class="app-body">
      <Sidebar
        :open="leftOpen"
        :sessions="sessions"
        :pinned-sessions="pinnedSessions"
        :unpinned-sessions="unpinnedSessions"
        :current-session-id="currentSessionId"
        @new-chat="handleNewChat"
        @skills="activePanel = 'skills'"
        @outputs="activePanel = 'outputs'"
        @select="handleSelect"
        @delete="handleDelete"
        @rename="handleRename"
        @pin="handlePin"
      />
      <ChatPanel
        v-if="activePanel === 'chat'"
        :messages="messages"
        :is-running="isRunning"
        @send="handleSend"
        @abort="abort"
      />
      <SkillsPanel
        v-else-if="activePanel === 'skills'"
        :skills="skills"
        :tools="tools"
        @toggle-skill="toggleSkill"
        @toggle-tool="toggleTool"
      />
      <OutputsPanel v-else-if="activePanel === 'outputs'" />
    </div>
    <div v-if="error" class="error-toast" @click="error = null">{{ error }} ✕</div>
    <ConfigPanel :show="showConfig" @close="showConfig = false" />
    <StatusBar />
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #fff;
  color: #333;
}

.app-container {
  display: flex; flex-direction: column;
  height: 100vh; background: #fff;
}

.app-body {
  display: flex; flex: 1; overflow: hidden;
}

.error-toast {
  position: fixed;
  bottom: 20px; left: 50%; transform: translateX(-50%);
  background: #dc2626; color: #fff;
  padding: 8px 20px; border-radius: 8px;
  font-size: 13px; cursor: pointer;
  z-index: 1000;
}
</style>
