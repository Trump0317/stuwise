<script setup lang="ts">
import type { OutputItem } from "../../types";

defineProps<{
  output: OutputItem;
}>();

function icon(type: string) {
  return type === "image" ? "🖼" : type === "link" ? "🔗" : "📄";
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch { return ""; }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<template>
  <div class="output-item">
    <span class="item-icon">{{ icon(output.type) }}</span>
    <div class="item-info">
      <span class="item-name">{{ output.name }}</span>
      <span class="item-meta">{{ formatTime(output.time) }} · {{ formatSize(output.size) }}</span>
    </div>
  </div>
</template>

<style scoped>
.output-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}
.output-item:hover { background: #fafafa; margin: 0 -16px; padding: 10px 16px; }

.item-icon { font-size: 16px; width: 24px; text-align: center; flex-shrink: 0; }
.item-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.item-name { font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-meta { font-size: 11px; color: #999; }
</style>
