<script setup lang="ts">
import { ref, watch, onMounted, toRef } from "vue";
import AllTab from "./AllTab.vue";
import ImageTab from "./ImageTab.vue";
import FileTab from "./FileTab.vue";
import LinkTab from "./LinkTab.vue";
import { useOutputs } from "../../composables/useOutputs";

const props = defineProps<{ sessionId: string | null }>();

const { outputs, loading, fetchOutputs } = useOutputs(toRef(props, "sessionId"));

const activeTab = ref<"all" | "image" | "file" | "link">("all");

onMounted(() => fetchOutputs("all"));

watch(activeTab, (tab) => {
  if (tab === "link") fetchOutputs("all");
  else fetchOutputs(tab);
});
</script>

<template>
  <div class="outputs-panel">
    <div class="panel-header">
      <button class="tab-btn" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部</button>
      <button class="tab-btn" :class="{ active: activeTab === 'image' }" @click="activeTab = 'image'">图片</button>
      <button class="tab-btn" :class="{ active: activeTab === 'file' }" @click="activeTab = 'file'">文件</button>
      <button class="tab-btn" :class="{ active: activeTab === 'link' }" @click="activeTab = 'link'">链接</button>
    </div>
    <div class="panel-body">
      <AllTab v-if="activeTab === 'all'" :outputs="outputs" />
      <ImageTab v-if="activeTab === 'image'" :outputs="outputs" />
      <FileTab v-if="activeTab === 'file'" :outputs="outputs" />
      <LinkTab v-if="activeTab === 'link'" :outputs="outputs" />
    </div>
  </div>
</template>

<style scoped>
.outputs-panel {
  display: flex; flex-direction: column;
  flex: 1; overflow: hidden; background: #fff;
}

.panel-header {
  display: flex; gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  padding: 4px 0;
  border: none; background: transparent;
  font-size: 13px; color: #999; cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.tab-btn:hover { color: #666; }
.tab-btn.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
  font-weight: 500;
}

.panel-body {
  flex: 1; overflow-y: auto;
  padding: 8px 16px;
}
</style>
