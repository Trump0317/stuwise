<script setup lang="ts">
import { ref, computed } from "vue";
import type { ToolCallStatus } from "../types";

const props = defineProps<{
  status: ToolCallStatus;
}>();

const expanded = ref(false);

const icon = computed(() => {
  switch (props.status.name) {
    case "read":
    case "write":
    case "edit":
    case "ls":
    case "grep":
    case "find":
      return "📁";
    case "bash":
      return "⚡";
    case "web_search":
    case "web_fetch":
      return "🌐";
    default:
      return "🔧";
  }
});

const stateText = computed(() => {
  switch (props.status.state) {
    case "running":
      return "执行中...";
    case "done":
      return "完成";
    case "error":
      return "失败";
  }
});

function toggleExpand() {
  if (props.status.result) {
    expanded.value = !expanded.value;
  }
}
</script>

<template>
  <div class="tool-call" :class="{ error: status.state === 'error' }">
    <div
      class="tool-header"
      :class="{ clickable: !!status.result }"
      @click="toggleExpand"
    >
      <span class="tool-icon">{{ icon }}</span>
      <span class="tool-label">{{ status.label }}</span>
      <span class="tool-state" :class="status.state">
        <span v-if="status.state === 'running'" class="spinner"></span>
        {{ stateText }}
      </span>
      <span v-if="status.result" class="toggle-arrow">
        {{ expanded ? '▾' : '▸' }}
      </span>
    </div>
    <div v-if="expanded && status.result" class="tool-result">
      <pre>{{ status.result }}</pre>
    </div>
  </div>
</template>

<style scoped>
.tool-call {
  margin: 8px 0 8px 48px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
  overflow: hidden;
  max-width: 85%;
}

.tool-call.error {
  border-color: #fca5a5;
  background: #fef2f2;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #6b7280;
}

.tool-header.clickable {
  cursor: pointer;
}

.tool-header.clickable:hover {
  background: #f3f4f6;
}

.tool-icon {
  font-size: 14px;
}

.tool-label {
  font-weight: 500;
  color: #374151;
}

.tool-state {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.tool-state.done {
  color: #059669;
}

.tool-state.error {
  color: #dc2626;
}

.tool-state.running {
  color: #6366f1;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.toggle-arrow {
  font-size: 12px;
}

.tool-result {
  border-top: 1px solid #e5e7eb;
  padding: 8px 12px;
}

.tool-result pre {
  margin: 0;
  font-size: 12px;
  color: #4b5563;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}
</style>
