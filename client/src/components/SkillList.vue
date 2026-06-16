<script setup lang="ts">
defineProps<{
  skills: Array<{ name: string; description: string }>;
}>();
</script>

<template>
  <div v-if="skills.length > 0" class="skill-list">
    <span class="skill-label">Skills:</span>
    <span class="skill-badge" v-for="s in skills" :key="s.name" :title="s.description">
      {{ s.name }}
    </span>
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
  white-space: nowrap;
  cursor: default;
}
</style>
