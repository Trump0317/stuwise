<script setup lang="ts">
import type { OutputItem } from "../../types";
import OutputItemView from "./OutputItem.vue";

defineProps<{
  outputs: OutputItem[];
}>();
</script>

<template>
  <div>
    <OutputItemView
      v-for="o in outputs.filter(x => x.type === 'image')"
      :key="o.path"
      :output="o"
    />
    <div v-if="outputs.filter(x => x.type === 'image').length === 0" class="empty">暂无图片</div>
  </div>
</template>

<style scoped>
.empty { font-size: 13px; color: #bbb; padding: 20px 0; text-align: center; }
</style>
