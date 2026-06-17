<script setup lang="ts">
import SkillItem from "./SkillItem.vue";
</script>

<template>
  <div class="item-list">
    <SkillItem name="笔记管理" desc="创建、编辑、搜索学习笔记" :enabled="true" />
    <SkillItem name="网页搜索" desc="通过搜索引擎查找资料" :enabled="true" />
  </div>
</template>

<style scoped>
.item-list {
  display: flex; flex-direction: column;
}
</style>
