<script setup lang="ts">
import type { SessionInfo } from "../../types";
import ToolBar from "./ToolBar.vue";
import PinnedSection from "./PinnedSection.vue";
import SessionSection from "./SessionSection.vue";

defineProps<{
  open: boolean;
  sessions: SessionInfo[];
  pinnedSessions: SessionInfo[];
  unpinnedSessions: SessionInfo[];
  currentSessionId: string | null;
}>();

const emit = defineEmits<{
  newChat: [];
  skills: [];
  outputs: [];
  select: [id: string];
  delete: [id: string];
  rename: [id: string, name: string];
  pin: [id: string, pinned: boolean];
}>();
</script>

<template>
  <aside class="sidebar" :class="{ closed: !open }">
    <div class="sidebar-inner">
      <ToolBar @new-chat="emit('newChat')" @skills="emit('skills')" @outputs="emit('outputs')" />
      <PinnedSection
        :sessions="pinnedSessions"
        :selected-id="currentSessionId"
        @select="(id: string) => emit('select', id)"
        @delete="(id: string) => emit('delete', id)"
        @rename="(id: string, name: string) => emit('rename', id, name)"
        @pin="(id: string, pinned: boolean) => emit('pin', id, pinned)"
      />
      <SessionSection
        :sessions="unpinnedSessions"
        :selected-id="currentSessionId"
        @select="(id: string) => emit('select', id)"
        @delete="(id: string) => emit('delete', id)"
        @rename="(id: string, name: string) => emit('rename', id, name)"
        @pin="(id: string, pinned: boolean) => emit('pin', id, pinned)"
      />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  background: #fafafa;
  border-right: 1px solid #e5e7eb;
  display: flex; flex-direction: column;
  overflow: hidden;
  transition: width 0.2s, opacity 0.2s;
  flex-shrink: 0;
}
.sidebar.closed {
  width: 0; border: none; opacity: 0;
}

.sidebar-inner {
  width: 260px;
  display: flex; flex-direction: column;
  height: 100%; overflow: hidden;
}
</style>
