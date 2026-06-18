<script setup lang="ts">
import SkillItem from "./SkillItem.vue";

defineProps<{
  skills: Array<{ name: string; description: string; enabled: boolean }>;
}>();

const emit = defineEmits<{
  toggle: [name: string];
}>();
</script>

<template>
  <div class="item-list">
    <SkillItem
      v-for="s in skills"
      :key="s.name"
      :name="s.name"
      :desc="s.description"
      :enabled="s.enabled"
      @toggle="emit('toggle', s.name)"
    />
    <div v-if="skills.length === 0" class="empty">暂无加载的技能</div>
  </div>
</template>

<style scoped>
.item-list { display: flex; flex-direction: column; }
.empty { font-size: 13px; color: #bbb; padding: 20px 0; text-align: center; }
</style>
