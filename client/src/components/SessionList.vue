<script setup lang="ts">
import type { SessionInfo } from "../types";

defineProps<{
  sessions: SessionInfo[];
  currentId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
  create: [];
  delete: [id: string];
}>();

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
</script>

<template>
  <aside class="session-sidebar">
    <div class="sidebar-header">
      <span class="sidebar-title">会话</span>
      <button class="btn-new" @click="emit('create')" title="新建会话">+</button>
    </div>
    <ul class="session-list">
      <li
        v-for="s in sessions"
        :key="s.id"
        class="session-item"
        :class="{ active: s.id === currentId }"
        @click="emit('select', s.id)"
      >
        <div class="session-info">
          <span class="session-date">{{ formatDate(s.createdAt) }}</span>
          <span class="session-count">{{ s.messageCount }} 条</span>
        </div>
        <button
          class="btn-delete"
          @click.stop="emit('delete', s.id)"
          title="删除会话"
        >×</button>
      </li>
    </ul>
    <div v-if="sessions.length === 0" class="empty-hint">暂无会话</div>
  </aside>
</template>

<style scoped>
.session-sidebar {
  width: 200px;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 12px 8px;
  border-bottom: 1px solid #eee;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.btn-new {
  width: 24px;
  height: 24px;
  border: 1px solid #d0d0d0;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-new:hover {
  background: #f0f0f0;
  border-color: #999;
}

.session-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
}
.session-item:hover {
  background: #f0f0f0;
}
.session-item.active {
  background: #e8f0fe;
  border-left: 3px solid #4285f4;
  padding-left: 9px;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.session-date {
  font-size: 13px;
  color: #333;
}

.session-count {
  font-size: 11px;
  color: #999;
}

.btn-delete {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: #ccc;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}
.session-item:hover .btn-delete {
  opacity: 1;
}
.btn-delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.empty-hint {
  padding: 20px 12px;
  text-align: center;
  font-size: 12px;
  color: #bbb;
}
</style>
