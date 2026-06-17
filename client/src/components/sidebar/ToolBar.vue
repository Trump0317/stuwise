<script setup lang="ts">
const emit = defineEmits<{
  newChat: [];
  skills: [];
  outputs: [];
}>();
</script>

<template>
  <div class="tool-bar">
    <button class="action-btn" @click="emit('newChat')"><span class="icon">＋</span> 新建会话</button>
    <button class="action-btn" @click="emit('skills')"><span class="icon">⚡</span> 技能与工具</button>
    <button class="action-btn" @click="emit('outputs')"><span class="icon">📦</span> 产物</button>
  </div>
</template>

<style scoped>
.tool-bar {
  padding: 8px 12px;
  display: flex; flex-direction: column;
  gap: 2px;
  border-bottom: 1px solid #e5e7eb;
}

.action-btn {
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  color: #555;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  border-radius: 6px;
  display: flex; align-items: center; gap: 8px;
}
.action-btn:hover { background: #f0f0f0; color: #333; }

.icon {
  font-size: 15px;
  width: 20px;
  text-align: center;
}
</style>
