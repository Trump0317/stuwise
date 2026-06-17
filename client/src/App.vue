<script setup lang="ts">
import { ref } from "vue";
import Header from "./components/header/Header.vue";
import Sidebar from "./components/sidebar/Sidebar.vue";
import ChatPanel from "./components/chat/ChatPanel.vue";
import SkillsPanel from "./components/skills-tools/SkillsPanel.vue";
import OutputsPanel from "./components/outputs/OutputsPanel.vue";

const leftOpen = ref(true);
const rightOpen = ref(false);
const activePanel = ref<"chat" | "skills" | "outputs">("chat");
</script>

<template>
  <div class="app-container">
    <Header
      :left-open="leftOpen"
      :right-open="rightOpen"
      title="Vue3 响应式原理"
      @toggle-left="leftOpen = !leftOpen"
      @toggle-right="rightOpen = !rightOpen"
    />
    <div class="app-body">
      <Sidebar
        :open="leftOpen"
        @new-chat="activePanel = 'chat'"
        @skills="activePanel = 'skills'"
        @outputs="activePanel = 'outputs'"
      />
      <ChatPanel v-if="activePanel === 'chat'" />
      <SkillsPanel v-else-if="activePanel === 'skills'" />
      <OutputsPanel v-else-if="activePanel === 'outputs'" />
    </div>
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
</style>
