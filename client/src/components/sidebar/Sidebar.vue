<script setup lang="ts">
import { ref } from "vue";
import ToolBar from "./ToolBar.vue";
import PinnedSection from "./PinnedSection.vue";
import SessionSection from "./SessionSection.vue";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  newChat: [];
  skills: [];
  outputs: [];
}>();

const selectedId = ref<string | null>("s1");
</script>

<template>
  <aside class="sidebar" :class="{ closed: !open }">
    <div class="sidebar-inner">
      <ToolBar @new-chat="emit('newChat')" @skills="emit('skills')" @outputs="emit('outputs')" />
      <PinnedSection :selected-id="selectedId" @select="selectedId = $event" />
      <SessionSection :selected-id="selectedId" @select="selectedId = $event" />
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
