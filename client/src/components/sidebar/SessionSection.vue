<script setup lang="ts">
import { ref } from "vue";
import SessionItem from "./SessionItem.vue";

defineProps<{
  selectedId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();

const expanded = ref(true);
</script>

<template>
  <div class="session-section">
    <div class="section-header" @click="expanded = !expanded">
      <span class="section-title">会话</span>
      <span class="toggle">{{ expanded ? '▾' : '▸' }}</span>
    </div>
    <div v-if="expanded">
      <SessionItem
        id="s1" time="昨天" message="帮我创建一个笔记..."
        :active="selectedId === 's1'" status="replying"
        @select="emit('select', 's1')"
      />
      <SessionItem
        id="s2" time="6月15日" message="搜索Vue3响应式原理..."
        :active="selectedId === 's2'"
        @select="emit('select', 's2')"
      />
      <SessionItem
        id="s3" time="6月14日" message="帮我整理文件夹..."
        :active="selectedId === 's3'"
        @select="emit('select', 's3')"
      />
    </div>
  </div>
</template>

<style scoped>
.session-section { flex: 1; overflow-y: auto; padding: 6px 0; }
.section-header {
  display: flex; justify-content: space-between; align-items: center;
  cursor: pointer; user-select: none;
  padding: 2px 12px 4px;
}
.section-title {
  font-size: 10px; font-weight: 600;
  color: #aaa; text-transform: uppercase; letter-spacing: 0.5px;
}
.toggle { font-size: 12px; color: #bbb; }
</style>
