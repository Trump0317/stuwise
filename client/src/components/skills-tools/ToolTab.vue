<script setup lang="ts">
import SkillItem from "./SkillItem.vue";
</script>

<template>
  <div class="item-list">
    <SkillItem name="文件读写" desc="read / write / edit" :enabled="true" />
    <SkillItem name="目录操作" desc="ls / find / grep" :enabled="true" />
    <SkillItem name="命令执行" desc="bash" :enabled="false" />
    <SkillItem name="网络工具" desc="web_search / web_fetch" :enabled="true" />
  </div>
</template>

<style scoped>
.item-list {
  display: flex; flex-direction: column;
}
</style>
