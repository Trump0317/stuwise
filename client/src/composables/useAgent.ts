import { ref } from "vue";
import type { ChatMessage, TimelineItem, SessionInfo } from "../types";
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

function toTimeline(msgs: ChatMessage[]): TimelineItem[] {
  return msgs.map((m) => ({ id: m.id, kind: "message" as const, message: m, tool: null }));
}

export function useAgent() {
  const timeline = ref<TimelineItem[]>([]);
  const sessions = ref<SessionInfo[]>([]);
  const currentSessionId = ref<string | null>(null);
  const skills = ref<Array<{ name: string; description: string }>>([]);
  const isRunning = ref(false);
  const error = ref<string | null>(null);

  let eventSource: EventSource | null = null;
  let currentAssistantId: string | null = null;

  // === Session 管理 ===

  async function fetchSessions() {
    try {
      const res = await fetch("/api/session");
      const data = await res.json();
      sessions.value = data.sessions || [];
    } catch { /* ignore */ }
  }

  async function loadSession(id: string) {
    try {
      const res = await fetch(`/api/session/${id}`);
      const data = await res.json();
      const messages: ChatMessage[] = (data.messages || []).map((m: any) => ({
        id: nextId(),
        role: m.role,
        content: typeof m.content === "string"
          ? m.content
          : m.content?.map((c: any) => c.text || "").join("") || "",
        timestamp: m.timestamp || Date.now(),
      }));
      timeline.value = toTimeline(messages);
      currentSessionId.value = id;
    } catch (e) {
      error.value = "加载会话历史失败";
    }
  }

  async function createSession() {
    try {
      const res = await fetch("/api/session", { method: "POST" });
      const data = await res.json();
      if (data.session) {
        sessions.value = [data.session, ...sessions.value];
        await switchSession(data.session.id);
      }
    } catch { /* ignore */ }
  }

  async function deleteSession(id: string) {
    try {
      await fetch(`/api/session/${id}`, { method: "DELETE" });
      sessions.value = sessions.value.filter((s) => s.id !== id);
      if (currentSessionId.value === id) {
        // 切换到第一个剩余 session，或清空
        const next = sessions.value[0];
        if (next) {
          await loadSession(next.id);
        } else {
          timeline.value = [];
          currentSessionId.value = null;
        }
      }
    } catch { /* ignore */ }
  }

  async function switchSession(id: string) {
    try {
      await fetch(`/api/session/${id}`, { method: "PUT" });
      await loadSession(id);
    } catch (e) {
      error.value = "切换会话失败";
    }
  }

  // === 初始化 ===

  async function init() {
    await fetchSessions();
    await fetchSkills();
    if (sessions.value.length > 0) {
      await loadSession(sessions.value[0].id);
    }
  }

  async function fetchSkills() {
    try {
      const res = await fetch("/api/skills");
      const data = await res.json();
      skills.value = data.skills || [];
    } catch { /* ignore */ }
  }

  // === 发送消息 ===

  async function send(text: string): Promise<void> {
    if (isRunning.value) return;
    isRunning.value = true;
    error.value = null;

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    timeline.value = [...timeline.value, { id: userMsg.id, kind: "message", message: userMsg, tool: null }];

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
        timeline.value = timeline.value.map((t) =>
          t.kind === "message" && t.message!.id === currentAssistantId
            ? { ...t, message: { ...t.message!, isStreaming: false } }
            : t
        );
      }
      error.value = "连接断开，请重试";
    };

    // 等待 SSE 连接建立
    await new Promise((r) => setTimeout(r, 300));

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
        const msg = event.message;
        if (msg.role === "assistant") {
          currentAssistantId = nextId();
          const assistantMsg: ChatMessage = {
            id: currentAssistantId,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
            isStreaming: true,
          };
          timeline.value = [...timeline.value, { id: currentAssistantId, kind: "message", message: assistantMsg, tool: null }];
        }
        break;
      }

      case "message_update": {
        if (!currentAssistantId) return;
        const ae = event.assistantMessageEvent;
        if (ae?.type === "text_delta" && typeof ae.delta === "string") {
          timeline.value = timeline.value.map((t) =>
            t.kind === "message" && t.message!.id === currentAssistantId
              ? { ...t, message: { ...t.message!, content: t.message!.content + ae.delta } }
              : t
          );
        }
        break;
      }

      case "message_end":
        timeline.value = timeline.value.map((t) =>
          t.kind === "message" && t.message!.id === currentAssistantId
            ? { ...t, message: { ...t.message!, isStreaming: false } }
            : t
        );
        break;

      case "agent_end":
        isRunning.value = false;
        cleanupEventSource();
        break;

      case "tool_execution_start":
        timeline.value = [...timeline.value, {
          id: event.toolCallId,
          kind: "tool",
          message: null,
          tool: {
            id: event.toolCallId,
            name: event.toolName,
            label: TOOL_LABELS[event.toolName] || event.toolName,
            state: "running",
          },
        }];
        break;

      case "tool_execution_end":
        timeline.value = timeline.value.map((t) =>
          t.kind === "tool" && t.tool!.id === event.toolCallId
            ? {
              ...t,
              tool: {
                ...t.tool!,
                state: event.isError ? "error" : "done",
                result: extractToolResult(event.result),
              },
            }
            : t,
        );
        break;
    }
  }

  function abort(): void {
    fetch("/api/abort", { method: "POST" }).catch(() => {});
    cleanupEventSource();

    if (currentAssistantId) {
      timeline.value = timeline.value.map((t) =>
        t.kind === "message" && t.message!.id === currentAssistantId
          ? { ...t, message: { ...t.message!, isStreaming: false } }
          : t
      );
    }
    isRunning.value = false;
  }

  function clearError(): void {
    error.value = null;
  }

  // === Steer: 编辑最后一条用户消息并重新生成 ===

  function steer(editedText: string) {
    if (timeline.value.length < 2) return;

    // 找到最后一条用户消息
    let userIdx = -1;
    for (let i = timeline.value.length - 1; i >= 0; i--) {
      const item = timeline.value[i];
      if (item.kind === "message" && item.message?.role === "user") {
        userIdx = i;
        break;
      }
    }
    if (userIdx < 0) return;

    // 更新用户消息文本
    const userItem = timeline.value[userIdx];
    if (userItem.kind === "message" && userItem.message) {
      userItem.message.content = editedText;
    }

    // 移除用户消息之后的所有内容（AI 回复）
    timeline.value = timeline.value.slice(0, userIdx + 1);

    // 重新发送
    send(editedText);
  }

  // === FollowUp: 在末尾追加追问 ===

  function followUp(text: string) {
    send(text);
  }

  return {
    timeline, sessions, currentSessionId, skills,
    isRunning, error,
    init, send, abort, clearError,
    createSession, deleteSession, switchSession,
    steer, followUp,
    _handleEvent: handleEvent,
  };
}
