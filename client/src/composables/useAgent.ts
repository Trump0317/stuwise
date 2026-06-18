import { ref } from "vue";
import type { ChatMessage } from "../types";
import { nextId } from "../types";
import { TOOL_LABELS } from "./constants";

export function useAgent() {
  const messages = ref<ChatMessage[]>([]);
  const isRunning = ref(false);
  const error = ref<string | null>(null);

  let eventSource: EventSource | null = null;
  let currentAssistantId: string | null = null;

  // === send ===

  async function send(text: string): Promise<void> {
    if (isRunning.value) return;
    isRunning.value = true;
    error.value = null;

    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    messages.value = [...messages.value, userMsg];

    eventSource = new EventSource("/api/events");
    currentAssistantId = null;

    eventSource.onmessage = (e) => {
      try { handleEvent(JSON.parse(e.data)); } catch { /* ignore */ }
    };

    eventSource.onerror = () => {
      cleanup();
      isRunning.value = false;
      if (currentAssistantId) {
        messages.value = messages.value.map((m) =>
          m.id === currentAssistantId ? { ...m, isStreaming: false } : m
        );
      }
      error.value = "连接断开";
    };

    await new Promise((r) => setTimeout(r, 300));

    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.ok && !currentAssistantId) {
        error.value = data.error || "请求失败";
        cleanup();
        isRunning.value = false;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "网络错误";
      cleanup();
      isRunning.value = false;
    }
  }

  function cleanup() {
    if (eventSource) {
      eventSource.onmessage = null;
      eventSource.close();
      eventSource = null;
    }
  }

  function abort() {
    fetch("/api/abort", { method: "POST" }).catch(() => {});
    cleanup();
    if (currentAssistantId) {
      messages.value = messages.value.map((m) =>
        m.id === currentAssistantId ? { ...m, isStreaming: false } : m
      );
    }
    isRunning.value = false;
  }

  function steer(editedText: string) {
    if (messages.value.length < 1) return;
    let userIdx = -1;
    for (let i = messages.value.length - 1; i >= 0; i--) {
      if (messages.value[i]!.role === "user") { userIdx = i; break; }
    }
    if (userIdx < 0) return;
    messages.value[userIdx]!.content = editedText;
    messages.value = messages.value.slice(0, userIdx + 1);
    send(editedText);
  }

  // === SSE event handler ===

  function handleEvent(event: any) {
    switch (event.type) {
      case "agent_start":
        isRunning.value = true;
        error.value = null;
        break;

      case "message_start": {
        const msg = event.message;
        if (msg.role === "assistant") {
          currentAssistantId = nextId();
          messages.value = [...messages.value, {
            id: currentAssistantId,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
            isStreaming: true,
          }];
        }
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
          m.id === currentAssistantId
            ? { ...m, isStreaming: false }
            : m
        );
        break;

      case "agent_end":
        isRunning.value = false;
        cleanup();
        break;

      case "tool_execution_start":
        messages.value = [...messages.value, {
          id: event.toolCallId,
          role: "assistant",
          subtype: "tool_call",
          toolName: event.toolName,
          toolStatus: "running",
          content: TOOL_LABELS[event.toolName] || event.toolName,
          timestamp: Date.now(),
        }];
        break;

      case "tool_execution_end":
        messages.value = messages.value.map((m) =>
          m.id === event.toolCallId
            ? { ...m, toolStatus: event.isError ? "error" : "done", subtype: "tool_call" }
            : m,
        );
        break;
    }
  }

  function clearError() { error.value = null; }

  return {
    messages, isRunning, error,
    send, abort, clearError, steer,
    _handleEvent: handleEvent,
  };
}
