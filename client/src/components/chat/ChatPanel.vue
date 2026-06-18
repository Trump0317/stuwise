<script setup lang="ts">
import ChatView from "./ChatView.vue";
import type { ChatMessage } from "./ChatView.vue";
import ChatInput from "./ChatInput.vue";

defineProps<{
  messages: ChatMessage[];
  isRunning: boolean;
}>();

const emit = defineEmits<{
  send: [text: string];
  abort: [];
}>();
</script>

<template>
  <div class="chat-panel">
    <ChatView :messages="messages" />
    <ChatInput :is-running="isRunning" @send="emit('send', $event)" @abort="emit('abort')" />
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex; flex-direction: column;
  flex: 1; overflow: hidden;
}
</style>
