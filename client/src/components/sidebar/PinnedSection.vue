<script setup lang="ts">
import { ref } from "vue";
import SessionItem from "./SessionItem.vue";

defineProps<{
  selectedId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();

const expanded = ref(true);
</script>

<template>
  <div class="pinned-section">
    <div class="section-header" @click="expanded = !expanded">
      <span class="section-title">置顶</span>
      <span class="toggle">{{ expanded ? '▾' : '▸' }}</span>
    </div>
    <div v-if="expanded">
      <SessionItem
        id="p1" time="14:30" message="你好，今天有什么可以帮..."
        :active="selectedId === 'p1'" pinned
        @select="emit('select', 'p1')"
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
