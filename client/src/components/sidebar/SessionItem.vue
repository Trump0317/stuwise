<script setup lang="ts">
import { ref, computed } from "vue";
import type { SessionInfo } from "../../types";

const props = defineProps<{
  session: SessionInfo;
  active?: boolean;
}>();

const emit = defineEmits<{
  select: [];
  pin: [pinned: boolean];
  rename: [name: string];
  delete: [];
}>();

const menuOpen = ref(false);
const renaming = ref(false);
const renameText = ref("");

function toggleMenu() { menuOpen.value = !menuOpen.value; }
function closeMenu() { menuOpen.value = false; }

function handleAction(action: "pin" | "rename" | "delete") {
  if (action === "rename") {
    renaming.value = true;
    renameText.value = props.session.name || "";
    closeMenu();
    return;
  }
  if (action === "pin") emit("pin", !props.session.pinned);
  if (action === "delete") emit("delete");
  closeMenu();
}

function submitRename() {
  const v = renameText.value.trim();
  if (v) emit("rename", v);
  renaming.value = false;
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
  menuOpen.value = true;
}

const timeLabel = computed(() => {
  try {
    const d = new Date(props.session.createdAt);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "昨天";
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  } catch { return ""; }
});

const displayName = computed(() =>
  props.session.name || `新会话 (${props.session.messageCount} 条消息)`
);
</script>

<template>
  <div class="session-item" :class="{ active }" @contextmenu="handleContextMenu" @click="emit('select')">
    <span class="dot" :class="active ? 'replying' : 'idle'"></span>
    <div class="session-info">
      <span v-if="!renaming" class="session-msg">{{ displayName }}</span>
      <input
        v-else
        v-model="renameText"
        class="rename-input"
        @blur="submitRename"
        @keydown.enter="submitRename"
        @keydown.escape="renaming = false"
        @click.stop
        ref="renameInput"
      />
    </div>
    <div class="hover-actions">
      <span class="session-time">{{ timeLabel }}</span>
      <button class="btn-more" @click.stop="toggleMenu">⋯</button>
    </div>

    <!-- 右键菜单 -->
    <div v-if="menuOpen" class="context-menu" @click.stop>
      <button class="menu-item" @click="handleAction('pin')">
        {{ session.pinned ? '📌 取消置顶' : '📌 置顶' }}
      </button>
      <button class="menu-item" @click="handleAction('rename')">
        ✏️ 重命名
      </button>
      <div class="menu-divider"></div>
      <button class="menu-item danger" @click="handleAction('delete')">
        🗑 删除
      </button>
    </div>

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
.dot.replying { background: #3b82f6; }

.session-info {
  flex: 1; min-width: 0;
}

.session-msg {
  font-size: 13px; color: #333;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  display: block;
}

.rename-input {
  width: 100%;
  border: 1px solid #4f46e5;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 13px; font-family: inherit;
  outline: none;
}

.hover-actions {
  display: flex; align-items: center; gap: 4px;
  opacity: 0; flex-shrink: 0;
}
.session-item:hover .hover-actions,
.session-item.active .hover-actions { opacity: 1; }

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
