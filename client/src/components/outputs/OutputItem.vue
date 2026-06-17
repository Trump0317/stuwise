<script setup lang="ts">
defineProps<{
  icon: string;
  name: string;
  time: string;
}>();
</script>

<template>
  <div class="output-item">
    <span class="item-icon">{{ icon }}</span>
    <div class="item-info">
      <span class="item-name">{{ name }}</span>
      <span class="item-time">{{ time }}</span>
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
.item-time { font-size: 11px; color: #999; }
</style>
