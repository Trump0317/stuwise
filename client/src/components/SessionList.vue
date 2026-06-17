<script setup lang="ts">
import { ref } from "vue";
import type { SessionInfo } from "../types";

defineProps<{
  sessions: SessionInfo[];
  currentId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
  create: [];
  delete: [id: string];
  showSkills: [];
  showTools: [];
}>();

const collapsed = ref(false);
const width = ref(220);

let dragging = false;
let startX = 0;
let startW = 0;

function onDragStart(e: MouseEvent) {
  dragging = true;
  startX = e.clientX;
  startW = width.value;
  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);
}

function onDragMove(e: MouseEvent) {
  if (!dragging) return;
  const delta = e.clientX - startX;
  width.value = Math.max(160, Math.min(400, startW + delta));
}

function onDragEnd() {
  dragging = false;
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (now.getTime() - d.getTime() < 86400000) return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
</script>

<template>
  <aside class="session-sidebar" :class="{ collapsed }" :style="{ width: collapsed ? '40px' : width + 'px' }">
    <div v-if="!collapsed" class="sidebar-inner">
      <div class="sidebar-top">
        <button class="top-btn primary" @click="emit('create')">＋ 新建会话</button>
      </div>
      <div class="sidebar-nav">
        <button class="nav-btn" @click="emit('showSkills')">📋 技能</button>
        <button class="nav-btn" @click="emit('showTools')">🔧 工具</button>
      </div>
      <div class="sidebar-header">
        <span class="sidebar-title">会话</span>
        <div class="sidebar-actions">
          <button class="btn-new" @click="emit('create')" title="新建">+</button>
          <button class="btn-collapse" @click="collapsed = true" title="收起">◀</button>
        </div>
      </div>
      <ul class="session-list">
        <li
          v-for="s in sessions" :key="s.id"
          class="session-item" :class="{ active: s.id === currentId }"
          @click="emit('select', s.id)"
        >
          <div class="session-info">
            <span class="session-date">{{ formatDate(s.createdAt) }}</span>
            <span class="session-count">{{ s.messageCount }} 条</span>
          </div>
          <button class="btn-delete" @click.stop="emit('delete', s.id)" title="删除">×</button>
        </li>
      </ul>
    </div>

    <div v-else class="sidebar-collapsed" @click="collapsed = false" title="展开会话列表">
      <span>▶</span>
    </div>

    <div class="resize-handle" @mousedown="onDragStart"></div>
  </aside>
</template>

<style scoped>
.session-sidebar {
  position: relative;
  border-right: 1px solid #e5e7eb;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.15s;
  flex-shrink: 0;
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sidebar-top {
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
}

.top-btn {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}
.top-btn.primary {
  background: #4f46e5;
  color: #fff;
}
.top-btn.primary:hover { background: #4338ca; }

.sidebar-nav {
  display: flex;
  gap: 4px;
  padding: 6px 10px;
  border-bottom: 1px solid #eee;
}

.nav-btn {
  flex: 1;
  padding: 5px 6px;
  border: 1px solid #e0e0e0;
  background: #fff;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  color: #555;
  transition: all 0.15s;
}
.nav-btn:hover { background: #f0f0f0; border-color: #999; }

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 12px 8px;
  border-bottom: 1px solid #eee;
}

.sidebar-title { font-size: 14px; font-weight: 600; color: #666; }
.sidebar-actions { display: flex; gap: 4px; }

.btn-new, .btn-collapse {
  width: 24px; height: 24px;
  border: 1px solid #d0d0d0; background: #fff;
  border-radius: 4px; cursor: pointer;
  font-size: 12px; color: #666;
  display: flex; align-items: center; justify-content: center;
}
.btn-new:hover, .btn-collapse:hover { background: #f0f0f0; }

.session-list { list-style: none; padding: 0; margin: 0; flex: 1; overflow-y: auto; }

.session-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; cursor: pointer;
  border-bottom: 1px solid #f0f0f0; transition: background 0.15s;
}
.session-item:hover { background: #f0f0f0; }
.session-item.active { background: #e8f0fe; border-left: 3px solid #4285f4; padding-left: 9px; }

.session-info { display: flex; flex-direction: column; gap: 2px; }
.session-date { font-size: 13px; color: #333; }
.session-count { font-size: 11px; color: #999; }

.btn-delete {
  width: 20px; height: 20px; border: none; background: none;
  color: #ccc; cursor: pointer; font-size: 14px;
  border-radius: 3px; opacity: 0; transition: opacity 0.15s;
}
.session-item:hover .btn-delete { opacity: 1; }
.btn-delete:hover { background: #fee2e2; color: #dc2626; }

.sidebar-collapsed {
  display: flex; align-items: center; justify-content: center;
  height: 100%; cursor: pointer; color: #999; font-size: 14px;
}
.sidebar-collapsed:hover { background: #f0f0f0; color: #666; }

.resize-handle {
  position: absolute; right: -3px; top: 0; bottom: 0;
  width: 6px; cursor: col-resize; z-index: 10;
}
.resize-handle:hover { background: rgba(66, 133, 244, 0.3); }
</style>
