<script setup lang="ts">
import { ref } from "vue";
import SkillTab from "./SkillTab.vue";
import ToolTab from "./ToolTab.vue";

defineProps<{
  skills: Array<{ name: string; description: string; enabled: boolean }>;
  tools: Array<{ name: string; description: string; enabled: boolean }>;
}>();

const emit = defineEmits<{
  toggleSkill: [name: string];
  toggleTool: [name: string];
}>();

const activeTab = ref<"skills" | "tools">("skills");
</script>

<template>
  <div class="skills-panel">
    <div class="panel-header">
      <button class="tab-btn" :class="{ active: activeTab === 'skills' }" @click="activeTab = 'skills'">技能</button>
      <button class="tab-btn" :class="{ active: activeTab === 'tools' }" @click="activeTab = 'tools'">工具</button>
    </div>
    <div class="panel-body">
      <SkillTab v-if="activeTab === 'skills'" :skills="skills" @toggle="emit('toggleSkill', $event)" />
      <ToolTab v-if="activeTab === 'tools'" :tools="tools" @toggle="emit('toggleTool', $event)" />
    </div>
  </div>
</template>

<style scoped>
.skills-panel {
  display: flex; flex-direction: column;
  flex: 1; overflow: hidden; background: #fff;
}

.panel-header {
  display: flex; gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  padding: 4px 0;
  border: none; background: transparent;
  font-size: 13px; color: #999; cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.tab-btn:hover { color: #666; }
.tab-btn.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
  font-weight: 500;
}

.panel-body {
  flex: 1; overflow-y: auto;
  padding: 12px 16px;
}
</style>
