<script setup lang="ts">
import { ref } from "vue";
import type { SessionInfo } from "../../types";
import SessionItem from "./SessionItem.vue";

defineProps<{
  sessions: SessionInfo[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
  delete: [id: string];
  rename: [id: string, name: string];
  pin: [id: string, pinned: boolean];
}>();

const expanded = ref(true);
</script>

<template>
  <div class="pinned-section" v-if="sessions.length > 0">
    <div class="section-header" @click="expanded = !expanded">
      <span class="section-title">置顶</span>
      <span class="toggle">{{ expanded ? '▾' : '▸' }}</span>
    </div>
    <div v-if="expanded">
      <SessionItem
        v-for="s in sessions"
        :key="s.id"
        :session="s"
        :active="selectedId === s.id"
        @select="emit('select', s.id)"
        @delete="emit('delete', s.id)"
        @rename="(name) => emit('rename', s.id, name)"
        @pin="(pinned) => emit('pin', s.id, pinned)"
      />
    </div>
  </div>
</template>

<style scoped>
.pinned-section { border-bottom: 1px solid #e5e7eb; }
.section-header {
  display: flex; justify-content: space-between; align-items: center;
  cursor: pointer; user-select: none;
  padding: 6px 12px 2px;
}
.section-title {
  font-size: 10px; font-weight: 600;
  color: #aaa; text-transform: uppercase; letter-spacing: 0.5px;
}
.toggle { font-size: 12px; color: #bbb; }
</style>
