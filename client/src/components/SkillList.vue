<script setup lang="ts">
defineProps<{
  skills: Array<{ name: string; description: string; enabled: boolean }>;
}>();

const emit = defineEmits<{
  toggle: [name: string];
}>();
</script>

<template>
  <div v-if="skills.length > 0" class="skill-list">
    <span class="skill-label">Skills:</span>
    <button
      v-for="s in skills"
      :key="s.name"
      class="skill-badge"
      :class="{ off: !s.enabled }"
      :title="s.description"
      @click="emit('toggle', s.name)"
    >
      {{ s.name }}
    </button>
  </div>
</template>

<style scoped>
.skill-list {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
}

.skill-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
}

.skill-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  color: #6366f1;
  background: #eef2ff;
  border-radius: 10px;
  border: 1px solid transparent;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s;
}
.skill-badge:hover {
  border-color: #6366f1;
}
.skill-badge.off {
  color: #9ca3af;
  background: #f0f0f0;
  text-decoration: line-through;
}
</style>
