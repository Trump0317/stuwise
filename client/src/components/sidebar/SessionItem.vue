<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  id?: string;
  time: string;
  message: string;
  active?: boolean;
  status?: "idle" | "thinking" | "replying";
  pinned?: boolean;
}>();

const emit = defineEmits<{
  select: [];
  pin: [];
  rename: [];
  delete: [];
}>();

const menuOpen = ref(false);

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function handleAction(action: "pin" | "rename" | "delete") {
  emit(action);
  closeMenu();
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
  menuOpen.value = true;
}
</script>

<template>
  <div class="session-item" :class="{ active }" @contextmenu="handleContextMenu" @click="emit('select')">
    <span class="dot" :class="status || 'idle'"></span>
    <div class="session-info">
      <span class="session-msg">{{ message }}</span>
    </div>
    <div class="hover-actions">
      <span class="session-time">{{ time }}</span>
      <button class="btn-more" @click.stop="toggleMenu">⋯</button>
    </div>

    <!-- 右键菜单 -->
    <div v-if="menuOpen" class="context-menu" @click.stop>
      <button class="menu-item" @click="handleAction('pin')">
        📌 {{ pinned ? '取消置顶' : '置顶' }}
      </button>
      <button class="menu-item" @click="handleAction('rename')">
        ✏️ 重命名
      </button>
      <div class="menu-divider"></div>
      <button class="menu-item danger" @click="handleAction('delete')">
        🗑 删除
      </button>
    </div>

    <!-- 点击外部关闭菜单 -->
    <div v-if="menuOpen" class="menu-backdrop" @click="closeMenu"></div>
  </div>
</template>

<style scoped>
.session-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-left: 3px solid transparent;
  position: relative;
}
.session-item:hover { background: #f5f5f5; }
.session-item.active {
  background: #eef2ff;
  border-left-color: #4f46e5;
}

.dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #d1d5db;
}
.dot.thinking { background: #3b82f6; animation: pulse 1.2s ease-in-out infinite; }
.dot.replying { background: #3b82f6; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.session-info {
  flex: 1; min-width: 0;
}

.session-msg {
  font-size: 13px; color: #333;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.hover-actions {
  display: flex; align-items: center; gap: 4px;
  opacity: 0; flex-shrink: 0;
}
.session-item:hover .hover-actions { opacity: 1; }

.session-time {
  font-size: 11px; color: #bbb;
  white-space: nowrap;
}

.btn-more {
  background: none; border: none;
  color: #bbb; cursor: pointer;
  font-size: 14px; padding: 0 2px;
  line-height: 1;
}
.btn-more:hover { color: #666; }

.context-menu {
  position: absolute;
  right: 12px; top: 100%;
  z-index: 50;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 4px;
  min-width: 140px;
  display: flex; flex-direction: column;
}

.menu-item {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 10px;
  border: none; background: transparent;
  font-size: 13px; color: #555;
  cursor: pointer;
  border-radius: 4px;
  text-align: left;
}
.menu-item:hover { background: #f5f5f5; }
.menu-item.danger { color: #dc2626; }
.menu-item.danger:hover { background: #fef2f2; }

.menu-divider {
  height: 1px; background: #f0f0f0;
  margin: 2px 0;
}

.menu-backdrop {
  position: fixed; inset: 0;
  z-index: 49;
}
</style>
