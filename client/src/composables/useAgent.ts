import { ref } from "vue";
import type { ChatMessage } from "../types";
import { nextId } from "../types";

export function useAgent() {
  const messages = ref<ChatMessage[]>([]);
  const isRunning = ref(false);
  const error = ref<string | null>(null);

  let eventSource: EventSource | null = null;
  let currentAssistantId: string | null = null;

  async function send(text: string): Promise<void> {
    if (isRunning.value) return;
    isRunning.value = true;
    error.value = null;

    // 添加用户消息
    messages.value = [
      ...messages.value,
      {
        id: nextId(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      },
    ];

    // 建立 SSE 连接
    eventSource = new EventSource("/api/events");
    currentAssistantId = null;

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        handleEvent(event);
      } catch {
        // 忽略解析错误
      }
    };

    eventSource.onerror = () => {
      eventSource?.close();
      eventSource = null;
      isRunning.value = false;
      if (currentAssistantId) {
        messages.value = messages.value.map((m) =>
          m.id === currentAssistantId ? { ...m, isStreaming: false } : m
        );
      }
      error.value = "连接断开，请重试";
    };

    // 发送请求
    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.ok) {
        error.value = data.error || "请求失败";
        if (eventSource) {
          eventSource.onmessage = null;
          eventSource.close();
          eventSource = null;
        }
        isRunning.value = false;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "网络错误";
      if (eventSource) {
        eventSource.onmessage = null;
        eventSource.close();
        eventSource = null;
      }
      isRunning.value = false;
    }
  }

  function handleEvent(event: any) {
    switch (event.type) {
      case "agent_start":
        isRunning.value = true;
        error.value = null;
        break;

      case "message_start": {
        currentAssistantId = nextId();
        messages.value = [
          ...messages.value,
          {
            id: currentAssistantId,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
            isStreaming: true,
          },
        ];
        break;
      }

      case "message_update": {
        if (!currentAssistantId) return;
        const ae = event.assistantMessageEvent;
        if (ae?.type === "text_delta" && typeof ae.delta === "string") {
          messages.value = messages.value.map((m) =>
            m.id === currentAssistantId
              ? { ...m, content: m.content + ae.delta }
              : m
          );
        }
        break;
      }

      case "message_end":
        messages.value = messages.value.map((m) =>
          m.id === currentAssistantId ? { ...m, isStreaming: false } : m
        );
        break;

      case "agent_end":
        isRunning.value = false;
        eventSource?.close();
        eventSource = null;
        break;
    }
  }

  function abort(): void {
    fetch("/api/abort", { method: "POST" }).catch(() => {});
    eventSource?.close();
    eventSource = null;

    if (currentAssistantId) {
      messages.value = messages.value.map((m) =>
        m.id === currentAssistantId ? { ...m, isStreaming: false } : m
      );
    }
    isRunning.value = false;
  }

  function clearError(): void {
    error.value = null;
  }

  return { messages, isRunning, error, send, abort, clearError, _handleEvent: handleEvent };
}
