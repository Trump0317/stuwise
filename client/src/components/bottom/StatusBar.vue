<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

const tokens = ref(0);
const compactNeeded = ref(false);
const uptime = ref("");
const maxTokens = 128000;
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  fetchHealth();
  timer = setInterval(fetchHealth, 15000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

async function fetchHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    if (data.ok) {
      tokens.value = data.data.tokens || 0;
      compactNeeded.value = data.data.compactNeeded || false;
      uptime.value = data.data.uptime || "";
    }
  } catch { /* ignore */ }
}

const barPercent = computed(() => Math.min((tokens.value / maxTokens) * 100, 100));
const barColor = computed(() => {
  if (barPercent.value > 80) return "#dc2626";
  if (barPercent.value > 50) return "#f59e0b";
  return "#4f46e5";
});
</script>

<template>
  <div class="status-bar">
    <div class="status-left">
      <span class="status-label">上下文</span>
      <div class="token-progress">
        <div
          class="token-fill"
          :style="{ width: barPercent + '%', background: barColor }"
        ></div>
      </div>
      <span class="token-text" :class="{ warn: compactNeeded }">
        {{ tokens.toLocaleString() }} / {{ (maxTokens / 1000).toFixed(0) }}K
      </span>
      <span v-if="compactNeeded" class="compact-hint">建议压缩</span>
    </div>
    <div class="status-right">
      <span>运行 {{ uptime }}</span>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  height: 28px;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 11px; color: #999;
  flex-shrink: 0;
}

.status-left {
  display: flex; align-items: center; gap: 8px;
}

.status-label {
  font-weight: 500; color: #aaa;
}

.token-progress {
  width: 100px; height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.token-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s, background 0.5s;
}

.token-text {
  white-space: nowrap;
}
.token-text.warn { color: #f59e0b; }

.compact-hint {
  color: #f59e0b; font-weight: 500;
}

.status-right {
  display: flex; align-items: center; gap: 12px;
}
</style>
