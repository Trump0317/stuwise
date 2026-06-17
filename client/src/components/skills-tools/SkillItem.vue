<script setup lang="ts">
defineProps<{
  name: string;
  desc: string;
  enabled: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <div class="skill-item">
    <div class="item-info">
      <span class="item-name">{{ name }}</span>
      <span class="item-desc">{{ desc }}</span>
    </div>
    <label class="toggle-switch" @click="emit('toggle')">
      <input type="checkbox" :checked="enabled" />
      <span class="slider"></span>
    </label>
  </div>
</template>

<style scoped>
.skill-item {
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
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute; inset: 0;
  background: #d1d5db;
  border-radius: 22px;
  cursor: pointer;
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
input:checked + .slider { background: #4f46e5; }
input:checked + .slider::before { transform: translateX(18px); }
</style>
