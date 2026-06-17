<script setup lang="ts">
import { ref } from "vue";
import ChatView from "./ChatView.vue";
import type { ChatMessage } from "./ChatView.vue";
import ChatInput from "./ChatInput.vue";

const messages = ref<ChatMessage[]>([
  { id: "1", role: "user", content: "帮我创建一个详细的笔记，今天学了Vue3响应式原理，包括ref、reactive、computed和watch这四个核心API的区别和适用场景" },
  { id: "t1", role: "assistant", subtype: "thinking", content: "用户想要创建一份关于Vue3响应式原理的学习笔记，需要涵盖四个核心API。我应该使用note-management skill来创建笔记，然后详细列出每个API的要点。" },
  { id: "c1", role: "assistant", subtype: "tool_call", toolName: "write", toolStatus: "done", content: "创建文件 data/notes/2026-06-17-Vue3响应式原理.md\n内容: # Vue3 响应式原理..." },
  { id: "2", role: "assistant", content: "好的，笔记已创建。\n\nVue3 响应式原理核心要点：\n\n1. ref() — 用于基本类型，通过.value访问\n2. reactive() — 用于对象类型，基于Proxy\n3. computed() — 计算属性，自动缓存\n4. watch() — 监听变化，支持深度监听\n\n笔记已保存到 data/notes/2026-06-17-Vue3响应式原理.md" },
  { id: "3", role: "user", content: "非常好！再帮我查一下Vue3的nextTick的原理和使用场景" },
  { id: "t2", role: "assistant", subtype: "thinking", content: "用户需要了解Vue3的nextTick。我可以先通过web_search搜索相关资料，然后整理关键信息回复。" },
  { id: "c2", role: "assistant", subtype: "tool_call", toolName: "web_search", toolStatus: "running", content: "正在搜索: Vue3 nextTick 原理 使用场景..." },
  { id: "4", role: "assistant", content: "nextTick 是 Vue3 中一个重要的异步更新机制。\n\n原理：\n• Vue3 的 DOM 更新是异步的\n• 将更新任务推入微任务队列（Promise.then）\n• nextTick 返回 Promise，DOM更新后resolve\n\n使用场景：\n1. 数据变化后操作最新DOM\n2. 子组件挂载后获取引用\n3. 多个修改合并为一次更新" },
]);
</script>

<template>
  <div class="chat-panel">
    <ChatView :messages="messages" />
    <ChatInput />
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex; flex-direction: column;
  flex: 1; overflow: hidden;
}
</style>
