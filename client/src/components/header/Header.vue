<script setup lang="ts">
defineProps<{
  leftOpen: boolean;
  rightOpen: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  toggleLeft: [];
  toggleRight: [];
  settings: [];
}>();
</script>

<template>
  <header class="app-header">
    <button class="header-toggle" @click="emit('toggleLeft')" :title="leftOpen ? '隐藏侧边栏' : '显示侧边栏'">
      <span class="icon-sidebar" :class="{ closed: !leftOpen }"></span>
    </button>
    <span class="header-divider" :class="{ shifted: leftOpen }"></span>
    <span class="header-title">{{ title || '' }}</span>
    <div class="header-center"></div>
    <button class="header-btn" @click="emit('settings')" title="设置">⚙</button>
    <button class="header-toggle" @click="emit('toggleRight')" :title="rightOpen ? '隐藏侧边栏' : '显示侧边栏'">
      <span class="icon-sidebar" :class="{ closed: !rightOpen }"></span>
    </button>
  </header>
</template>

<style scoped>
.app-header {
  height: 40px;
  background: #fafafa;
  border-bottom: 1px solid #e5e7eb;
  display: flex; align-items: center;
  padding: 0 8px;
}

.header-toggle {
  width: 32px; height: 32px;
  border: none; background: transparent;
  color: #999; cursor: pointer;
  font-size: 14px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
}
.header-toggle:hover { background: #f0f0f0; color: #333; }

.header-btn {
  width: 32px; height: 32px;
  border: none; background: transparent;
  color: #999; cursor: pointer;
  font-size: 16px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  margin-right: 4px;
}
.header-btn:hover { background: #f0f0f0; color: #333; }

.header-center { flex: 1; }

.header-divider {
  width: 1px; height: 40px;
  background: #e5e7eb;
  margin: 0 8px;
  transition: margin-left 0.2s;
}
.header-divider.shifted {
  margin-left: 219px;
}

.header-title {
  font-size: 13px; color: #555;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.icon-sidebar {
  display: inline-block;
  width: 14px; height: 14px;
  border: 1.5px solid #999;
  border-radius: 2px;
  background: linear-gradient(to right, #999 40%, transparent 40%);
  transition: border-color 0.15s;
}
.header-toggle:hover .icon-sidebar { border-color: #333; }
.icon-sidebar.closed { background: transparent; }
.header-toggle:last-child .icon-sidebar {
  background: linear-gradient(to right, transparent 60%, #999 60%);
}
.header-toggle:last-child .icon-sidebar.closed { background: transparent; }
</style>
