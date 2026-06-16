<script setup lang="ts">
import { computed } from "vue";
import type { ToolCallStatus } from "../types";

const props = defineProps<{
  status: ToolCallStatus;
}>();

const icon = computed(() => {
  switch (props.status.name) {
    case "read": case "write": case "edit": case "ls": case "grep": case "find": return "📁";
    case "bash": return "⚡";
    case "web_search": case "web_fetch": return "🌐";
    default: return "🔧";
  }
});

const stateText = computed(() => {
  switch (props.status.state) {
    case "running": return "执行中...";
    case "done": return "完成";
    case "error": return "失败";
  }
});
</script>

<template>
  <div style="border:2px solid #6366f1;border-radius:8px;margin:8px 0 8px 48px;padding:8px 12px;background:#eef2ff;max-width:85%">
    <span>{{ icon }}</span>
    <strong>{{ status.label }}</strong>
    <span style="margin-left:12px;color:#6366f1">[{{ stateText }}]</span>
    <div v-if="status.result" style="margin-top:6px;padding-top:6px;border-top:1px solid #c7d2fe;font-size:13px;color:#4b5563">
      {{ status.result }}
    </div>
  </div>
</template>
