import { ref, watch } from "vue";
import type { ChatMessage, ToolCallStatus } from "../types";
import { nextId } from "../types";

const TOOL_LABELS: Record<string, string> = {
  read: "读取文件",
  write: "写入文件",
  edit: "编辑文件",
  ls: "列出目录",
  grep: "搜索文本",
  find: "查找文件",
  bash: "执行命令",
  web_search: "搜索网络",
  web_fetch: "抓取网页",
};

const STORAGE_KEY = "stuwise-messages";

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch { /* quota exceeded, ignore */ }
}

export function useAgent() {
  const messages = ref<ChatMessage[]>(loadMessages());
  const toolCalls = ref<ToolCallStatus[]>([]);
  const isRunning = ref(false);
  const error = ref<string | null>(null);

  let eventSource: EventSource | null = null;
  let currentAssistantId: string | null = null;

  // 消息变化时自动持久化
  watch(messages, (val) => saveMessages(val), { deep: true });

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
      } catch { /* ignore */ }
    };

    eventSource.onerror = () => {
      cleanupEventSource();
      isRunning.value = false;
      if (currentAssistantId) {
        messages.value = messages.value.map((m) =>
          m.id === currentAssistantId ? { ...m, isStreaming: false } : m
        );
      }
      error.value = "连接断开，请重试";
    };

    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.ok) {
        error.value = data.error || "请求失败";
        cleanupEventSource();
        isRunning.value = false;
      }
      // 后端返回 stopReason: "error" 且无 assistant 消息时展示错误
      else if (data.stopReason === "error" && !currentAssistantId) {
        error.value = "AI 请求失败，请检查 API Key 或网络";
        cleanupEventSource();
        isRunning.value = false;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "网络错误";
      cleanupEventSource();
      isRunning.value = false;
    }
  }

  function cleanupEventSource() {
    if (eventSource) {
      eventSource.onmessage = null;
      eventSource.close();
      eventSource = null;
    }
  }

  function extractToolResult(result: any): string {
    if (!result?.content) return "";
    const texts = result.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text as string);
    return texts.join("\n").slice(0, 500);
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
        cleanupEventSource();
        break;

      case "tool_execution_start":
        toolCalls.value = [...toolCalls.value, {
          id: event.toolCallId,
          name: event.toolName,
          label: TOOL_LABELS[event.toolName] || event.toolName,
          state: "running",
        }];
        break;

      case "tool_execution_end":
        toolCalls.value = toolCalls.value.map((tc) =>
          tc.id === event.toolCallId
            ? {
              ...tc,
              state: event.isError ? "error" : "done",
              result: extractToolResult(event.result),
            }
            : tc,
        );
        break;
    }
  }

  function abort(): void {
    fetch("/api/abort", { method: "POST" }).catch(() => {});
    cleanupEventSource();

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

  return { messages, toolCalls, isRunning, error, send, abort, clearError, _handleEvent: handleEvent };
}
