<script setup lang="ts">
import { onMounted } from "vue";

const props = defineProps<{
  tools: Array<{ name: string; description: string; enabled: boolean }>;
}>();

const emit = defineEmits<{
  toggle: [name: string];
}>();
</script>

<template>
  <div class="item-list">
    <div v-for="t in props.tools" :key="t.name" class="tool-item">
      <div class="item-info">
        <span class="item-name">{{ t.name }}</span>
        <span class="item-desc">{{ t.description }}</span>
      </div>
      <div
        class="toggle-switch"
        :class="{ on: t.enabled }"
        @click="emit('toggle', t.name)"
      >
        <span class="slider"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.item-list { display: flex; flex-direction: column; }

.tool-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.item-info {
  display: flex; flex-direction: column; gap: 3px;
  flex: 1;
}

.item-name { font-size: 13px; color: #333; font-weight: 500; }
.item-desc { font-size: 12px; color: #999; }

.toggle-switch {
  position: relative;
  width: 40px; height: 22px;
  flex-shrink: 0; margin-left: 12px;
  cursor: pointer;
}

.slider {
  position: absolute; inset: 0;
  background: #d1d5db;
  border-radius: 22px;
  transition: background 0.2s;
}
.slider::before {
  content: "";
  position: absolute;
  width: 16px; height: 16px;
  left: 3px; bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}
.toggle-switch.on .slider { background: #4f46e5; }
.toggle-switch.on .slider::before { transform: translateX(18px); }
</style>
